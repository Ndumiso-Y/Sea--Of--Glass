import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AnnouncementWithMeta {
  id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
  recipient_group: string;
  scope: string | null;
  department: string | null;
  cell: string | null;
  telegram_sent: boolean;
  // Joined / computed
  author_name: string;
  read_count: number;
}

export function useAnnouncements() {
  const [data, setData] = useState<AnnouncementWithMeta[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch announcements with author name and read records
      const { data: rows, error: err } = await supabase
        .from('announcements')
        .select(`
          id, title, body, created_by, created_at, recipient_group, scope, department, cell, telegram_sent,
          author:members!created_by(name),
          announcement_reads(id)
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        created_by: r.created_by,
        created_at: r.created_at,
        recipient_group: r.recipient_group,
        scope: r.scope ?? null,
        department: r.department ?? null,
        cell: r.cell ?? null,
        telegram_sent: r.telegram_sent,
        author_name: r.author?.name ?? 'Unknown',
        read_count: Array.isArray(r.announcement_reads) ? r.announcement_reads.length : 0,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
