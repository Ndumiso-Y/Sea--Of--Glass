import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AttendanceType, ServiceType } from '@/data/types';

export interface AttendanceRecord {
  id: string;
  member_id: string;
  service_date: string;
  service_type: ServiceType;
  attendance_type: AttendanceType;
  recorded_by: string | null;
  created_at: string;
  // Joined
  member_name: string;
  member_department: string;
  member_cell: string;
  member_status: string;
}

export interface AttendanceFilter {
  serviceDate?: string;       // single date — exact match
  startDate?: string;         // date range start (inclusive)
  endDate?: string;           // date range end (inclusive)
  department?: string;
  cell?: string;
  memberId?: string;
}

export function useAttendance(filter: AttendanceFilter = {}) {
  const { serviceDate, startDate, endDate, department, cell, memberId } = filter;
  const [data, setData] = useState<AttendanceRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('attendance')
        .select(`
          id, member_id, service_date, service_type, attendance_type, recorded_by, created_at,
          members!inner(name, department, cell, status)
        `)
        .order('service_date', { ascending: false })
        .order('member_id');

      if (serviceDate) query = query.eq('service_date', serviceDate);
      if (startDate)   query = query.gte('service_date', startDate);
      if (endDate)     query = query.lte('service_date', endDate);
      if (memberId)    query = query.eq('member_id', memberId);
      if (department)  query = (query as any).eq('members.department', department);
      if (cell)        query = (query as any).eq('members.cell', cell);

      const { data: rows, error: err } = await query;
      if (err) throw err;

      const flat = (rows ?? []).map((r: any) => ({
        id: r.id,
        member_id: r.member_id,
        service_date: r.service_date,
        service_type: r.service_type as ServiceType,
        attendance_type: r.attendance_type as AttendanceType,
        recorded_by: r.recorded_by,
        created_at: r.created_at,
        member_name: r.members?.name ?? '',
        member_department: r.members?.department ?? '',
        member_cell: r.members?.cell ?? '',
        member_status: r.members?.status ?? '',
      }));

      setData(flat);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [serviceDate, startDate, endDate, department, cell, memberId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
