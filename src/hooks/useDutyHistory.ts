import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface DutyHistoryRecord {
  id: string;
  member_id: string;
  role: string;
  department: string;
  cell: string;
  ministry_id: string | null;
  appointed_date: string;
  ended_date: string | null;
  appointed_by: string | null;
  approved_by: string | null;
  reason_for_change: string | null;
  created_at: string;
  // Derived
  is_active: boolean;
  appointer_name: string | null;
  approver_name: string | null;
}

export function useDutyHistory(memberId: string | null | undefined) {
  const [data, setData] = useState<DutyHistoryRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!memberId) { setData(null); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('member_duty_history')
        .select(`
          id, member_id, role, department, cell, ministry_id,
          appointed_date, ended_date, appointed_by, approved_by, reason_for_change, created_at,
          appointer:members!appointed_by(name),
          approver:members!approved_by(name)
        `)
        .eq('member_id', memberId)
        .order('appointed_date', { ascending: false });

      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        member_id: r.member_id,
        role: r.role,
        department: r.department,
        cell: r.cell,
        ministry_id: r.ministry_id,
        appointed_date: r.appointed_date,
        ended_date: r.ended_date,
        appointed_by: r.appointed_by,
        approved_by: r.approved_by,
        reason_for_change: r.reason_for_change,
        created_at: r.created_at,
        is_active: r.ended_date === null,
        appointer_name: r.appointer?.name ?? null,
        approver_name: r.approver?.name ?? null,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch duty history');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { fetch(); }, [fetch]);

  /** SMN override: update ended_date on a historical (non-active) record. */
  const updateDutyEndDate = useCallback(async (historyId: string, newDate: string): Promise<void> => {
    const { error: err } = await supabase
      .from('member_duty_history')
      .update({ ended_date: newDate })
      .eq('id', historyId)
      .not('ended_date', 'is', null); // RLS policy also enforces this
    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, updateDutyEndDate };
}
