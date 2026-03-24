import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RoleChangeStatus } from '@/data/types';

export interface RoleChangeRequest {
  id: string;
  member_id: string;
  requested_by: string | null;
  current_role: string;
  proposed_role: string;
  proposed_department: string;
  proposed_cell: string;
  proposed_ministry_id: string | null;
  status: RoleChangeStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Joined
  member_name: string;
  requester_name: string | null;
}

export function useRoleChangeRequests(statusFilter?: RoleChangeStatus) {
  const [data, setData] = useState<RoleChangeRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('role_change_requests')
        .select(`
          id, member_id, requested_by, current_role, proposed_role,
          proposed_department, proposed_cell, proposed_ministry_id,
          status, reviewed_by, reviewed_at, rejection_reason, created_at,
          member:members!member_id(name),
          requester:members!requested_by(name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);

      const { data: rows, error: err } = await query;
      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        member_id: r.member_id,
        requested_by: r.requested_by,
        current_role: r.current_role,
        proposed_role: r.proposed_role,
        proposed_department: r.proposed_department,
        proposed_cell: r.proposed_cell,
        proposed_ministry_id: r.proposed_ministry_id,
        status: r.status as RoleChangeStatus,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        rejection_reason: r.rejection_reason,
        created_at: r.created_at,
        member_name: r.member?.name ?? 'Unknown',
        requester_name: r.requester?.name ?? null,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch role change requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  /** GSN: approve a pending role change. Calls the DB stored procedure. */
  const approve = useCallback(async (requestId: string, approverId: string): Promise<void> => {
    const { error: err } = await supabase.rpc('approve_role_change', {
      request_id: requestId,
      approver_id: approverId,
    });
    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  /** GSN: reject a pending role change. */
  const reject = useCallback(async (requestId: string, approverId: string, reason?: string): Promise<void> => {
    const { error: err } = await supabase.rpc('reject_role_change', {
      request_id: requestId,
      approver_id: approverId,
      reason: reason ?? null,
    });
    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, approve, reject };
}
