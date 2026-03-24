import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/data/types';

export interface MembersFilter {
  department?: string;
  cell?: string;
  status?: string;
  search?: string;
}

export function useMembers(filter: MembersFilter = {}) {
  const { department, cell, status, search } = filter;
  const [data, setData] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('members').select('*').order('name');
      if (department) query = query.eq('department', department);
      if (cell) query = query.eq('cell', cell);
      if (status) query = query.eq('status', status);
      if (search) query = query.or(`name.ilike.%${search}%,scj_number.ilike.%${search}%`);
      const { data: result, error: err } = await query;
      if (err) throw err;
      setData(result as Member[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [department, cell, status, search]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
