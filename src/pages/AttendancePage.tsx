import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { AttendanceType } from '@/data/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const serviceLabels: Record<string, string> = { wed_morning: 'Wed 12h00', wed_evening: 'Wed 19h00', sun: 'Sun 12h00' };
const services = ['wed_morning', 'wed_evening', 'sun'] as const;

const attDisplay: Record<string, { label: string; className: string }> = {
  physical: { label: '●', className: 'text-[#16a34a] text-lg' },
  online: { label: '○', className: 'text-[#3b82f6] text-lg' },
  catchup_spiritual: { label: 'S', className: 'text-[#ea580c] text-[11px] font-bold' },
  catchup_online: { label: 'OF', className: 'text-[#ea580c] text-[11px] font-bold' },
  catchup_friendship: { label: 'F', className: 'text-[#ea580c] text-[11px] font-bold' },
  catchup_full: { label: 'FT', className: 'text-[#ea580c] text-[11px] font-bold' },
  catchup_bb: { label: 'BB', className: 'text-[#ea580c] text-[11px] font-bold' },
  absent: { label: '●', className: 'text-[#dc2626]/40 text-lg' },
  exempted: { label: '盾', className: 'text-[#6B7280] text-[11px]' },
};

const attendanceOptions = [
  { val: 'physical', label: 'Physical' },
  { val: 'online', label: 'Online' },
  { val: 'catchup_spiritual', label: 'C. Spiritual' },
  { val: 'catchup_online', label: 'C. Online' },
  { val: 'catchup_friendship', label: 'C. Friendship' },
  { val: 'absent', label: 'Absent' },
  { val: 'exempted', label: 'Exempted' },
];

function getRecentMondays(count: number): string[] {
  const mondays: string[] = [];
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + diff);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setDate(thisMonday.getDate() - i * 7);
    mondays.push(d.toISOString().split('T')[0]);
  }
  return mondays;
}

const weeks = getRecentMondays(8);

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [weekIdx, setWeekIdx] = useState(weeks.length - 1);

  const weekStart = weeks[weekIdx];
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  }, [weekStart]);

  const deptScope = (user?.role === 'GSN' || user?.role === 'SMN') ? undefined : user?.department;

  const { data: memberData, loading: membersLoading } = useMembers({ department: deptScope });
  const { data: attData, loading: attLoading } = useAttendance({
    startDate: weekStart,
    endDate: weekEnd,
    department: deptScope,
  });

  const scopedMembers = memberData ?? [];
  const loading = membersLoading || attLoading;

  // Absence summary: members absent (no physical/online record) this week
  const memberAbsences = scopedMembers.map(m => {
    const mAtt = (attData ?? []).filter(a => a.member_id === m.id);
    const absentCount = mAtt.filter(a => a.attendance_type === 'absent').length;
    return { ...m, absentCount };
  });
  const absentees = memberAbsences.filter(m => m.absentCount > 0 && m.absentCount < 4);
  const habituals = memberAbsences.filter(m => m.absentCount >= 4 && m.absentCount < 8);
  const ltas = memberAbsences.filter(m => m.absentCount >= 8);

  return (
    <div className="p-6 lg:p-8">
      {/* Week Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[24px] font-bold text-black">Attendance</h1>
          <p className="font-body text-[14px] text-muted-foreground mt-1">Weekly service attendance tracker</p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-[8px] p-1">
          <button
            onClick={() => { if (weekIdx > 0) setWeekIdx(weekIdx - 1); }}
            disabled={weekIdx === 0}
            className="p-1 text-[#6B7280] hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-heading text-[14px] font-medium text-black px-4 min-w-[140px] text-center">
            Week of {weekStart}
          </span>
          <button
            onClick={() => { if (weekIdx < weeks.length - 1) setWeekIdx(weekIdx + 1); }}
            disabled={weekIdx === weeks.length - 1}
            className="p-1 text-[#6B7280] hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-[11px] font-body text-[#6B7280]">Legend:</span>
        {Object.entries({
          'Physical': 'bg-[#16a34a]/10 text-[#16a34a]',
          'Online': 'bg-[#3b82f6]/10 text-[#3b82f6]',
          'Catchup': 'bg-[#ea580c]/10 text-[#ea580c]',
          'Absent': 'bg-[#dc2626]/10 text-[#dc2626]',
          'Exempted': 'bg-[#E5E7EB]/50 text-[#6B7280]',
        }).map(([label, cls]) => (
          <span key={label} className={`px-2 py-0.5 rounded-full text-[11px] font-body font-medium ${cls}`}>
            {label}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden mb-8">
        <div className="overflow-x-auto pb-12">
          {loading ? (
            <div className="text-center py-12 text-[#6B7280] font-body text-sm">Loading...</div>
          ) : (
            <table className="w-full text-[13px] font-body bg-white">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] sticky left-0 bg-white z-10 border-r border-[#E5E7EB]">Member</th>
                  {services.map(s => (
                    <th key={s} className="h-[44px] text-center font-heading text-[12px] font-medium uppercase text-black min-w-[100px]">{serviceLabels[s]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scopedMembers.map((m, idx) => {
                  const isExempted = m.status === 'Exempted';
                  return (
                    <tr key={m.id} className={`border-b border-[#E5E7EB] h-[44px] hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} ${isExempted ? 'opacity-40' : ''}`}>
                      <td className={`px-4 text-black sticky left-0 z-10 border-r border-[#E5E7EB] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} ${isExempted ? 'italic' : ''}`}>
                        {m.name}
                      </td>
                      {services.map(s => {
                        const rec = (attData ?? []).find(a => a.member_id === m.id && a.service_type === s);
                        const disp = rec ? (attDisplay[rec.attendance_type] ?? { label: '—', className: 'text-[#E5E7EB]/80' }) : { label: '—', className: 'text-[#E5E7EB]/80' };
                        return (
                          <td key={s} className="text-center p-0 align-middle relative group">
                            <div className="w-[44px] h-[44px] mx-auto flex items-center justify-center cursor-pointer">
                              <span className={disp.className}>{disp.label}</span>
                            </div>
                            {/* Hover Popover */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-6 hidden group-hover:flex flex-col bg-white border border-[#E5E7EB] rounded-[8px] shadow-sm z-50 overflow-hidden w-[140px]">
                              {attendanceOptions.map(opt => (
                                <button key={opt.val} className="px-3 py-2 text-left text-[11px] font-body text-black hover:bg-[#FAFAFA] border-b border-[#E5E7EB] last:border-0 hover:text-[#de3163]">
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Absence summary */}
      <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5">
        <h2 className="font-heading text-[16px] font-bold text-black mb-4">Absence Summary (this week)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#ea580c]/5 rounded-[8px] p-4 border border-[#ea580c]/20">
            <p className="font-heading text-[11px] font-semibold text-[#ea580c] uppercase tracking-[0.08em] mb-2">Absentee (1–3)</p>
            {absentees.length > 0 ? absentees.map(m => (
              <p key={m.id} className="text-[13px] font-body text-black">{m.name} ({m.absentCount})</p>
            )) : <p className="text-[13px] text-[#6B7280] font-body">None</p>}
          </div>
          <div className="bg-[#dc2626]/5 rounded-[8px] p-4 border border-[#dc2626]/20">
            <p className="font-heading text-[11px] font-semibold text-[#dc2626] uppercase tracking-[0.08em] mb-2">Habitual (4–7)</p>
            {habituals.length > 0 ? habituals.map(m => (
              <p key={m.id} className="text-[13px] font-body text-black">{m.name} ({m.absentCount})</p>
            )) : <p className="text-[13px] text-[#6B7280] font-body">None</p>}
          </div>
          <div className="bg-[#dc2626]/5 rounded-[8px] p-4 border border-[#dc2626]/20">
            <p className="font-heading text-[11px] font-semibold text-[#dc2626] uppercase tracking-[0.08em] mb-2">LTA (8+)</p>
            {ltas.length > 0 ? ltas.map(m => (
              <p key={m.id} className="text-[13px] font-body text-black">{m.name} ({m.absentCount})</p>
            )) : <p className="text-[13px] text-[#6B7280] font-body">None</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
