import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ClaimStatus } from '@/data/types';

export interface FinanceClaim {
  id: string;
  submitted_by: string | null;
  amount: number;
  category: string;
  status: ClaimStatus;
  date_submitted: string;
  notes: string;
  submitter_name: string | null;
}

export function useFinanceClaims() {
  const [data, setData] = useState<FinanceClaim[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('finance_claims')
        .select(`
          id, submitted_by, amount, category, status, date_submitted, notes,
          submitter:members!submitted_by(name)
        `)
        .order('date_submitted', { ascending: false });

      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        submitted_by: r.submitted_by,
        amount: r.amount,
        category: r.category,
        status: r.status as ClaimStatus,
        date_submitted: r.date_submitted,
        notes: r.notes,
        submitter_name: r.submitter?.name ?? null,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch finance claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
