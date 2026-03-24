// supabase/functions/send-announcement/index.ts
// Sends an announcement to the matching Telegram chats and marks
// announcements.telegram_sent = true on at least one successful send.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      announcement_id,
      title,
      body,
      recipient_group,   // 'church_wide' | 'department' | 'cell'
      department,
      cell,
      sent_by_name,
    } = await req.json();

    if (!announcement_id || !title) {
      return new Response(
        JSON.stringify({ ok: false, error: 'announcement_id and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl   = Deno.env.get('SUPABASE_URL')!;
    const serviceKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken      = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // ── Fetch matching telegram_chats ────────────────────────────────────────
    let query = supabase
      .from('telegram_chats')
      .select('chat_id, chat_title')
      .eq('is_active', true);

    if (recipient_group === 'department' && department) {
      query = query.eq('department', department);
    } else if (recipient_group === 'cell' && cell) {
      query = query.eq('cell', cell);
    }
    // church_wide → no additional filter: sends to ALL active chats

    const { data: chats, error: chatsError } = await query;
    if (chatsError) throw new Error(chatsError.message);

    if (!chats || chats.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          sent: false,
          results: [],
          message: 'No matching Telegram chats found. Add chats via Settings → Telegram Chats.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Build Telegram message ───────────────────────────────────────────────
    const messageText = [
      '🔔 <b>Sea of Glass Rustenburg</b>',
      `<b>${escapeHtml(title)}</b>`,
      '',
      escapeHtml(body ?? ''),
      '',
      `— ${escapeHtml(sent_by_name ?? 'Admin')}`,
    ].join('\n');

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // ── Send to each chat ────────────────────────────────────────────────────
    const results: { chat_id: number; chat_title: string | null; success: boolean; error: string | null }[] = [];

    for (const chat of chats) {
      try {
        const resp = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat.chat_id,
            text: messageText,
            parse_mode: 'HTML',
          }),
        });
        const tgData = await resp.json();
        results.push({
          chat_id: chat.chat_id,
          chat_title: chat.chat_title,
          success: tgData.ok === true,
          error: tgData.ok ? null : (tgData.description ?? 'Unknown Telegram error'),
        });
      } catch (e) {
        results.push({
          chat_id: chat.chat_id,
          chat_title: chat.chat_title,
          success: false,
          error: String(e),
        });
      }
    }

    // ── Mark telegram_sent = true if at least one succeeded ──────────────────
    const anySuccess = results.some(r => r.success);
    if (anySuccess) {
      await supabase
        .from('announcements')
        .update({ telegram_sent: true })
        .eq('id', announcement_id);
    }

    return new Response(
      JSON.stringify({ ok: true, sent: anySuccess, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
