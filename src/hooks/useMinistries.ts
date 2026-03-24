import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface MinistryWithBJN {
  id: string;
  name: string;
  abbreviation: string;
  is_active: boolean;
  bjn_member_id: string | null;
  bjn_name: string | null;
}

export function useMinistries() {
  const [data, setData] = useState<MinistryWithBJN[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('ministries')
        .select(`
          id, name, abbreviation, is_active, bjn_member_id,
          bjn:members!bjn_member_id(name)
        `)
        .order('name');

      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        abbreviation: r.abbreviation,
        is_active: r.is_active,
        bjn_member_id: r.bjn_member_id,
        bjn_name: r.bjn?.name ?? null,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch ministries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
