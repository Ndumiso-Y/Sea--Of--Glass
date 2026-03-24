import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ContributionType {
  id: string;
  name: string;
  description: string | null;
  is_special: boolean;
  target_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export function useContributionTypes() {
  const [data, setData]       = useState<ContributionType[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('contribution_types')
        .select('id, name, description, is_special, target_amount, start_date, end_date, is_active')
        .order('name');
      if (err) throw err;
      setData(rows ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch contribution types');
    } finally {
      setLoading(false);
    }
  }, []);

  const createType = useCallback(async (
    payload: Omit<ContributionType, 'id'> & { created_by?: string }
  ) => {
    const { error: err } = await supabase.from('contribution_types').insert(payload);
    if (err) throw err;
    await fetch();
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, createType };
}
