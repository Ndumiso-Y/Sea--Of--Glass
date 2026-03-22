import React, { useState } from 'react';
import { members, attendance } from '@/data/seed';
import { useAuth } from '@/contexts/AuthContext';

const serviceLabels: Record<string, string> = { wed_morning: 'Wed 12h00', wed_evening: 'Wed 19h00', sun: 'Sun 12h00' };
const services = ['wed_morning', 'wed_evening', 'sun'] as const;
const weeks = ['2024-03-04', '2024-03-11', '2024-03-18', '2024-03-25'];

const attDisplay: Record<string, { label: string; className: string }> = {
  physical: { label: '●', className: 'text-success text-lg' },
  online: { label: '○', className: 'text-blue-500 text-lg' },
  catchup_spiritual: { label: 'S', className: 'text-warning text-xs font-bold' },
  catchup_online: { label: 'OF', className: 'text-warning text-xs font-bold' },
  catchup_friendship: { label: 'F', className: 'text-warning text-xs font-bold' },
  catchup_full: { label: 'FT', className: 'text-warning text-xs font-bold' },
  catchup_bb: { label: 'BB', className: 'text-warning text-xs font-bold' },
  absent: { label: '●', className: 'text-destructive/40 text-lg' },
  exempted: { label: '🛡', className: 'text-muted-foreground text-sm' },
};

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(weeks[weeks.length - 1]);

  const scopedMembers = user?.role === 'GSN' || user?.role === 'SMN'
    ? members
    : members.filter(m => m.department === user?.department);

  // Absence summary
  const memberAbsences = scopedMembers.map(m => {
    const absent = attendance.filter(a => a.member_id === m.id && a.attendance_type === 'absent').length;
    return { ...m, absentCount: absent };
  });
  const absentees = memberAbsences.filter(m => m.absentCount > 0 && m.absentCount < 4);
  const habituals = memberAbsences.filter(m => m.absentCount >= 4 && m.absentCount < 8);
  const ltas = memberAbsences.filter(m => m.absentCount >= 8);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Attendance</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Weekly service attendance tracker</p>
        </div>
        <select
          value={selectedWeek}
          onChange={e => setSelectedWeek(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {weeks.map(w => <option key={w} value={w}>Week of {w}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs sticky left-0 bg-muted/50">Member</th>
                {services.map(s => (
                  <th key={s} className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">{serviceLabels[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scopedMembers.map(m => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="py-2.5 px-4 font-medium text-foreground sticky left-0 bg-card whitespace-nowrap">{m.name}</td>
                  {services.map(s => {
                    const rec = attendance.find(a => a.member_id === m.id && a.service_date === selectedWeek && a.service_type === s);
                    const disp = rec ? attDisplay[rec.attendance_type] : { label: '—', className: 'text-muted-foreground/30' };
                    return (
                      <td key={s} className="text-center py-2.5 px-4">
                        <span className={disp.className}>{disp.label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absence summary */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">Absence Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
            <p className="font-heading text-xs font-semibold text-warning uppercase tracking-wide mb-2">Absentee (&lt;4)</p>
            {absentees.length > 0 ? absentees.map(m => (
              <p key={m.id} className="text-sm font-body text-foreground">{m.name} ({m.absentCount})</p>
            )) : <p className="text-sm text-muted-foreground font-body">None</p>}
          </div>
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <p className="font-heading text-xs font-semibold text-destructive uppercase tracking-wide mb-2">Habitual (4+)</p>
            {habituals.length > 0 ? habituals.map(m => (
              <p key={m.id} className="text-sm font-body text-foreground">{m.name} ({m.absentCount})</p>
            )) : <p className="text-sm text-muted-foreground font-body">None</p>}
          </div>
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <p className="font-heading text-xs font-semibold text-destructive uppercase tracking-wide mb-2">LTA (8+)</p>
            {ltas.length > 0 ? ltas.map(m => (
              <p key={m.id} className="text-sm font-body text-foreground">{m.name} ({m.absentCount})</p>
            )) : <p className="text-sm text-muted-foreground font-body">None</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
