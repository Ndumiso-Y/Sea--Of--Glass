import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ContributionRecord {
  id: string;
  member_id: string;
  member_name: string;
  contribution_type_id: string;
  contribution_type_name: string;
  is_special: boolean;
  amount: number;
  payment_date: string;
  contribution_month: string;
  is_provisional: boolean;
  provisional_rejection_reason: string | null;
  status: 'confirmed' | 'provisional' | 'rejected';
  department: string;
  notes: string | null;
  captured_by: string | null;
  created_at: string;
}

export interface ContributionFilter {
  month?: string;           // ISO date — first of month e.g. '2026-03-01'
  department?: string;
  contributionTypeId?: string;
  status?: string;
  memberId?: string;
}

export function useContributions(filter: ContributionFilter = {}) {
  const { month, department, contributionTypeId, status, memberId } = filter;
  const [data, setData]       = useState<ContributionRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('contributions')
        .select(`
          id, member_id, contribution_type_id, amount, payment_date,
          contribution_month, is_provisional, provisional_rejection_reason,
          status, department, notes, captured_by, created_at,
          member:members!member_id(name),
          contribution_type:contribution_types!contribution_type_id(name, is_special)
        `)
        .order('payment_date', { ascending: false });

      if (month)               query = query.eq('contribution_month', month);
      if (department)          query = query.eq('department', department);
      if (contributionTypeId)  query = query.eq('contribution_type_id', contributionTypeId);
      if (status)              query = query.eq('status', status);
      if (memberId)            query = query.eq('member_id', memberId);

      const { data: rows, error: err } = await query;
      if (err) throw err;

      const flat: ContributionRecord[] = (rows ?? []).map((r: any) => ({
        id:                          r.id,
        member_id:                   r.member_id,
        member_name:                 r.member?.name ?? 'Unknown',
        contribution_type_id:        r.contribution_type_id,
        contribution_type_name:      r.contribution_type?.name ?? 'Unknown',
        is_special:                  r.contribution_type?.is_special ?? false,
        amount:                      Number(r.amount),
        payment_date:                r.payment_date,
        contribution_month:          r.contribution_month,
        is_provisional:              r.is_provisional,
        provisional_rejection_reason: r.provisional_rejection_reason,
        status:                      r.status,
        department:                  r.department,
        notes:                       r.notes,
        captured_by:                 r.captured_by,
        created_at:                  r.created_at,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch contributions');
    } finally {
      setLoading(false);
    }
  }, [month, department, contributionTypeId, status, memberId]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const addContribution = useCallback(async (payload: {
    member_id: string;
    contribution_type_id: string;
    amount: number;
    payment_date: string;
    department: string;
    notes?: string;
    captured_by?: string;
    is_provisional?: boolean;
    status?: string;
  }) => {
    // contribution_month is set by the DB trigger
    const { error: err } = await supabase.from('contributions').insert({
      ...payload,
      contribution_month: new Date().toISOString().slice(0, 10), // placeholder; trigger overwrites
    });
    if (err) throw err;
    await fetch();
  }, [fetch]);

  const confirmProvisional = useCallback(async (
    id: string,
    confirmedBy: string,
  ) => {
    const { error: err } = await supabase
      .from('contributions')
      .update({
        status: 'confirmed',
        is_provisional: false,
        provisional_confirmed_by: confirmedBy,
        provisional_confirmed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (err) throw err;
    await fetch();
  }, [fetch]);

  const rejectProvisional = useCallback(async (
    id: string,
    rejectedBy: string,
    reason: string,
  ) => {
    const { error: err } = await supabase
      .from('contributions')
      .update({
        status: 'rejected',
        provisional_rejected_by: rejectedBy,
        provisional_rejected_at: new Date().toISOString(),
        provisional_rejection_reason: reason,
      })
      .eq('id', id);
    if (err) throw err;
    await fetch();
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, addContribution, confirmProvisional, rejectProvisional };
}
