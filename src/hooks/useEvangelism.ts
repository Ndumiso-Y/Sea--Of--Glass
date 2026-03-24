import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EvangelismStage } from '@/data/types';

export interface EvangelismProspect {
  id: string;
  prospect_name: string;
  linked_member_id: string | null;
  stage: EvangelismStage;
  stage_entered_date: string;
  department: string;
  notes: string | null;
  created_at: string;
  // Joined
  linked_member_name: string | null;
}

export interface EvangelismFilter {
  department?: string;
  stage?: EvangelismStage;
  linkedMemberId?: string;
}

export function useEvangelism(filter: EvangelismFilter = {}) {
  const { department, stage, linkedMemberId } = filter;
  const [data, setData] = useState<EvangelismProspect[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('evangelism_prospects')
        .select(`
          id, prospect_name, linked_member_id, stage, stage_entered_date, department, notes, created_at,
          members(name)
        `)
        .order('stage_entered_date', { ascending: false });

      if (department)     query = query.eq('department', department);
      if (stage)          query = query.eq('stage', stage);
      if (linkedMemberId) query = query.eq('linked_member_id', linkedMemberId);

      const { data: rows, error: err } = await query;
      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        prospect_name: r.prospect_name,
        linked_member_id: r.linked_member_id,
        stage: r.stage as EvangelismStage,
        stage_entered_date: r.stage_entered_date,
        department: r.department,
        notes: r.notes,
        created_at: r.created_at,
        linked_member_name: r.members?.name ?? null,
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch evangelism prospects');
    } finally {
      setLoading(false);
    }
  }, [department, stage, linkedMemberId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
