// supabase/functions/mark-announcement-read/index.ts
// Inserts a read receipt for a member and returns the updated total read count.

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
    const { announcement_id, member_id } = await req.json();

    if (!announcement_id || !member_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'announcement_id and member_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    // Insert read receipt — ignore conflict if already marked
    const { error: insertError } = await supabase
      .from('announcement_reads')
      .insert({ announcement_id, member_id })
      .select()
      .maybeSingle();

    // UNIQUE constraint violation (23505) means already read — not a real error
    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message);
    }

    // Return updated read count for this announcement
    const { count, error: countError } = await supabase
      .from('announcement_reads')
      .select('*', { count: 'exact', head: true })
      .eq('announcement_id', announcement_id);

    if (countError) throw new Error(countError.message);

    return new Response(
      JSON.stringify({ ok: true, read_count: count ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
