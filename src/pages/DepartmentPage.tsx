import React from 'react';
import { useParams } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useDailyBread, getWeekDayDates } from '@/hooks/useDailyBread';
import { useEvangelism } from '@/hooks/useEvangelism';
import { Users, ClipboardCheck, BookOpen, TrendingUp } from 'lucide-react';

const deptNames: Record<string, string> = {
  MG: "Men's Group", WG: "Women's Group", YG: 'Youth Group', SNG: 'Seniors Group', STUDENTS: 'Students Group',
};

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

const DepartmentPage: React.FC = () => {
  const { deptId } = useParams<{ deptId: string }>();

  const weekStart = getCurrentWeekMonday();
  const weekDays = getWeekDayDates(weekStart);
  const weekEnd = weekDays[weekDays.length - 1];

  const { data: membersData } = useMembers({ department: deptId });
  const { data: attData } = useAttendance({ startDate: weekStart, endDate: weekEnd, department: deptId });
  const { data: dbData } = useDailyBread({ weekStart, department: deptId });
  const { data: evData } = useEvangelism({ department: deptId });

  const deptMembers = membersData ?? [];

  const present = (attData ?? []).filter(a => a.attendance_type === 'physical' || a.attendance_type === 'online').length;
  const total = (attData ?? []).filter(a => a.attendance_type !== 'exempted').length;
  const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

  const dbWatched = (dbData ?? []).filter(d => d.watched).length;
  const dbPct = (dbData ?? []).length > 0 ? Math.round((dbWatched / (dbData ?? []).length) * 100) : 0;

  const stats = [
    { label: 'Members', value: deptMembers.length, icon: <Users size={18} />, color: 'text-primary' },
    { label: 'Attendance', value: `${attPct}%`, icon: <ClipboardCheck size={18} />, color: 'text-success' },
    { label: 'Daily Bread', value: `${dbPct}%`, icon: <BookOpen size={18} />, color: 'text-warning' },
    { label: 'Prospects', value: (evData ?? []).length, icon: <TrendingUp size={18} />, color: 'text-primary' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{deptNames[deptId || ''] || deptId}</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Department overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="font-heading text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Name</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Cell</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {deptMembers.map(m => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="py-3 px-4 font-medium text-foreground">{m.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.cell}</td>
                  <td className="py-3 px-4"><span className="text-[11px] px-2 py-0.5 rounded bg-foreground text-card font-medium">{m.duty_title}</span></td>
                  <td className="py-3 px-4"><span className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success font-medium">{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPage;
