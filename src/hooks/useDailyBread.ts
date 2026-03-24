import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface DailyBreadRecord {
  id: string;
  member_id: string;
  date: string;
  watched: boolean;
  is_flex_day: boolean;
  recorded_by: string | null;
  // Joined
  member_name: string;
  member_department: string;
  member_cell: string;
}

export interface DailyBreadFilter {
  weekStart?: string;   // ISO Monday date — resolves to Mon–Fri range
  startDate?: string;
  endDate?: string;
  department?: string;
  cell?: string;
  memberId?: string;
}

/** Returns the Mon/Tue/Thu/Fri dates for a given week-start (Monday). */
export function getWeekDayDates(weekStart: string): string[] {
  const base = new Date(weekStart + 'T00:00:00');
  return [0, 1, 3, 4].map(offset => {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    return d.toISOString().split('T')[0];
  });
}

export function useDailyBread(filter: DailyBreadFilter = {}) {
  const { weekStart, startDate, endDate, department, cell, memberId } = filter;
  const [data, setData] = useState<DailyBreadRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('daily_bread')
        .select(`
          id, member_id, date, watched, is_flex_day, recorded_by,
          members!inner(name, department, cell)
        `)
        .order('date')
        .order('member_id');

      if (weekStart) {
        const dates = getWeekDayDates(weekStart);
        query = query.gte('date', dates[0]).lte('date', dates[dates.length - 1]);
      }
      if (startDate) query = query.gte('date', startDate);
      if (endDate)   query = query.lte('date', endDate);
      if (memberId)   query = query.eq('member_id', memberId);
      if (department) query = (query as any).eq('members.department', department);
      if (cell)       query = (query as any).eq('members.cell', cell);

      const { data: rows, error: err } = await query;
      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        member_id: r.member_id,
        date: r.date,
        watched: r.watched,
        is_flex_day: r.is_flex_day,
        recorded_by: r.recorded_by,
        member_name: r.members?.name ?? '',
        member_department: r.members?.department ?? '',
        member_cell: r.members?.cell ?? '',
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch daily bread');
    } finally {
      setLoading(false);
    }
  }, [weekStart, startDate, endDate, department, cell, memberId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
