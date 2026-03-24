import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TestResult {
  id: string;
  member_id: string;
  test_name: string;
  date_written: string;
  score: number;
  pass: boolean;
  rewrite_required: boolean;
  ministry: string;
  created_at: string;
  // Joined
  member_name: string;
  member_department: string;
  member_cell: string;
}

export interface TestResultsFilter {
  memberId?: string;
  ministry?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
}

export function useTestResults(filter: TestResultsFilter = {}) {
  const { memberId, ministry, startDate, endDate, department } = filter;
  const [data, setData] = useState<TestResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('test_results')
        .select(`
          id, member_id, test_name, date_written, score, pass, rewrite_required, ministry, created_at,
          members!inner(name, department, cell)
        `)
        .order('date_written', { ascending: false });

      if (memberId)   query = query.eq('member_id', memberId);
      if (ministry)   query = query.eq('ministry', ministry);
      if (startDate)  query = query.gte('date_written', startDate);
      if (endDate)    query = query.lte('date_written', endDate);
      if (department) query = (query as any).eq('members.department', department);

      const { data: rows, error: err } = await query;
      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        member_id: r.member_id,
        test_name: r.test_name,
        date_written: r.date_written,
        score: r.score,
        pass: r.pass,
        rewrite_required: r.rewrite_required,
        ministry: r.ministry,
        created_at: r.created_at,
        member_name: r.members?.name ?? '',
        member_department: r.members?.department ?? '',
        member_cell: r.members?.cell ?? '',
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch test results');
    } finally {
      setLoading(false);
    }
  }, [memberId, ministry, startDate, endDate, department]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
