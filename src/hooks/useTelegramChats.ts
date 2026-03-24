import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TelegramChat {
  id: string;
  chat_id: number;
  chat_title: string | null;
  chat_type: string | null;
  scope: string | null;
  department: string | null;
  cell: string | null;
  is_active: boolean;
  created_at: string;
}

export function useTelegramChats() {
  const [data, setData]       = useState<TelegramChat[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('telegram_chats')
        .select('id, chat_id, chat_title, chat_type, scope, department, cell, is_active, created_at')
        .order('created_at', { ascending: true });
      if (err) throw err;
      setData(rows ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch Telegram chats');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChat = useCallback(
    async (id: string, updates: Partial<Omit<TelegramChat, 'id' | 'chat_id' | 'created_at'>>) => {
      const { error: err } = await supabase
        .from('telegram_chats')
        .update(updates)
        .eq('id', id);
      if (err) throw err;
      await fetch();
    },
    [fetch],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, updateChat };
}
