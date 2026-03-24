// supabase/functions/refresh-telegram-chats/index.ts
// Calls Telegram getUpdates, extracts unique chats, and upserts them into
// the telegram_chats table. Used by Settings → Telegram Chats → Refresh.

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
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Call Telegram getUpdates ─────────────────────────────────────────────
    const tgRes  = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=100`);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: tgData.description ?? 'Telegram API error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Extract unique group / supergroup / channel chats ────────────────────
    const seen = new Map<number, { chat_id: number; chat_title: string | null; chat_type: string }>();

    for (const upd of tgData.result) {
      const chat =
        upd.message?.chat ??
        upd.channel_post?.chat ??
        upd.my_chat_member?.chat;

      if (!chat) continue;
      // Skip private chats — only groups/channels are relevant
      if (chat.type === 'private') continue;
      if (!seen.has(chat.id)) {
        seen.set(chat.id, {
          chat_id:    chat.id,
          chat_title: chat.title ?? chat.username ?? null,
          chat_type:  chat.type,
        });
      }
    }

    const chatsToUpsert = [...seen.values()];

    if (chatsToUpsert.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, upserted: 0, chats: [], message: 'No group chats found in recent updates.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Upsert into telegram_chats ───────────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    const { data: upserted, error: upsertError } = await supabase
      .from('telegram_chats')
      .upsert(chatsToUpsert, { onConflict: 'chat_id', ignoreDuplicates: false })
      .select('id, chat_id, chat_title, chat_type, scope, department, cell, is_active');

    if (upsertError) throw new Error(upsertError.message);

    return new Response(
      JSON.stringify({ ok: true, upserted: upserted?.length ?? 0, chats: upserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
