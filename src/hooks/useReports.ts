import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface DeptReportRow {
  department: string;
  label: string;
  memberCount: number;
  physicalAvg: number;
  onlineAvg: number;
  attendancePct: number;
  dbPct: number;
}

export interface EvangelismReportRow {
  stage: string;
  label: string;
  count: number;
}

export interface ReportData {
  byDepartment: DeptReportRow[];
  grandTotal: { members: number; physical: number; online: number; pct: number };
  evangelismByStage: EvangelismReportRow[];
  evangelismTotal: number;
}

const DEPT_LABELS: Record<string, string> = {
  MG: "Men's Group", WG: "Women's Group", YG: 'Youth Group',
  SNG: 'Seniors Group', STUDENTS: 'Students',
};

const STAGE_LABELS: Record<string, string> = {
  bucket: 'Bucket', pickup: 'Pick Up', bb: 'BB',
  read_for_centre: 'Read for Centre', centre: 'Centre', passover: 'Passover',
};

/** Convert "March 2024" → { startDate: '2024-03-01', endDate: '2024-03-31' } */
function monthToRange(monthLabel: string): { startDate: string; endDate: string } {
  const months: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
    July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
  };
  const [month, year] = monthLabel.split(' ');
  const mm = months[month] ?? '01';
  const startDate = `${year}-${mm}-01`;
  const lastDay = new Date(Number(year), Number(mm), 0).getDate();
  const endDate = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

export function useReports(monthLabel: string) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = monthToRange(monthLabel);

      const [
        { data: memberRows },
        { data: attRows },
        { data: dbRows },
        { data: evRows },
      ] = await Promise.all([
        supabase.from('members').select('id, department'),
        supabase.from('attendance')
          .select('member_id, service_type, attendance_type, members!inner(department)')
          .gte('service_date', startDate)
          .lte('service_date', endDate),
        supabase.from('daily_bread')
          .select('member_id, watched, members!inner(department)')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase.from('evangelism_prospects').select('stage, department'),
      ]);

      const depts = ['MG', 'WG', 'YG', 'SNG', 'STUDENTS'];

      const byDepartment: DeptReportRow[] = depts.map(dept => {
        const deptMembers = (memberRows ?? []).filter((m: any) => m.department === dept);
        const deptIds = new Set(deptMembers.map((m: any) => m.id));
        const deptAtt = (attRows ?? []).filter((a: any) => (a.members as any)?.department === dept);

        const nonExempt = deptAtt.filter((a: any) => a.attendance_type !== 'exempted').length;
        const physical = deptAtt.filter((a: any) => a.attendance_type === 'physical').length;
        const online = deptAtt.filter((a: any) => a.attendance_type === 'online').length;

        const deptDb = (dbRows ?? []).filter((d: any) => (d.members as any)?.department === dept);
        const dbWatched = deptDb.filter((d: any) => d.watched).length;

        // Avg per service type (approx: physical/online totals divided by service count)
        const serviceCount = nonExempt > 0 ? Math.max(1, Math.round(nonExempt / Math.max(deptMembers.length, 1))) : 1;

        return {
          department: dept,
          label: DEPT_LABELS[dept] ?? dept,
          memberCount: deptMembers.length,
          physicalAvg: Math.round(physical / serviceCount),
          onlineAvg: Math.round(online / serviceCount),
          attendancePct: nonExempt > 0 ? Math.round(((physical + online) / nonExempt) * 100) : 0,
          dbPct: deptDb.length > 0 ? Math.round((dbWatched / deptDb.length) * 100) : 0,
        };
      }).filter(d => d.memberCount > 0);

      const totalMembers = (memberRows ?? []).length;
      const totalAtt = (attRows ?? []).filter((a: any) => a.attendance_type !== 'exempted').length;
      const totalPhysical = (attRows ?? []).filter((a: any) => a.attendance_type === 'physical').length;
      const totalOnline = (attRows ?? []).filter((a: any) => a.attendance_type === 'online').length;
      const serviceCount = totalAtt > 0 ? Math.max(1, Math.round(totalAtt / Math.max(totalMembers, 1))) : 1;

      const evangelismByStage: EvangelismReportRow[] = Object.keys(STAGE_LABELS).map(s => ({
        stage: s,
        label: STAGE_LABELS[s],
        count: (evRows ?? []).filter((e: any) => e.stage === s).length,
      }));

      setData({
        byDepartment,
        grandTotal: {
          members: totalMembers,
          physical: Math.round(totalPhysical / serviceCount),
          online: Math.round(totalOnline / serviceCount),
          pct: totalAtt > 0 ? Math.round(((totalPhysical + totalOnline) / totalAtt) * 100) : 0,
        },
        evangelismByStage,
        evangelismTotal: (evRows ?? []).length,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [monthLabel]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
