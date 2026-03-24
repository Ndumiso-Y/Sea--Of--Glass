import React from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useDailyBread, getWeekDayDates } from '@/hooks/useDailyBread';
import { useEvangelism } from '@/hooks/useEvangelism';
import { Users, ClipboardCheck, BookOpen, TrendingUp } from 'lucide-react';

const stages = ['bucket', 'pickup', 'bb', 'read_for_centre', 'centre', 'passover'] as const;
const stageLabels: Record<string, string> = {
  bucket: 'Bucket', pickup: 'Pick Up', bb: 'BB',
  read_for_centre: 'Read for Centre', centre: 'Centre', passover: 'Passover',
};
const departments = [
  { key: 'MG', label: "Men's Group" },
  { key: 'WG', label: "Women's Group" },
  { key: 'YG', label: 'Youth Group' },
  { key: 'SNG', label: 'Seniors Group' },
  { key: 'STUDENTS', label: 'Students' },
];

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

const DashboardPage: React.FC = () => {
  const weekStart = getCurrentWeekMonday();
  const weekDays = getWeekDayDates(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const { data: memberData } = useMembers();
  const { data: attData } = useAttendance({ startDate: weekStart, endDate: weekEndStr });
  const { data: dbData } = useDailyBread({ weekStart });
  const { data: evData } = useEvangelism();

  const totalMembers = (memberData ?? []).length;

  const physical = (attData ?? []).filter(a => a.attendance_type === 'physical').length;
  const online = (attData ?? []).filter(a => a.attendance_type === 'online').length;
  const total = (attData ?? []).filter(a => a.attendance_type !== 'exempted').length;
  const attPct = total > 0 ? Math.round(((physical + online) / total) * 100) : 0;
  const physPct = total > 0 ? Math.round((physical / total) * 100) : 0;
  const onlPct = total > 0 ? Math.round((online / total) * 100) : 0;

  const dbWatched = (dbData ?? []).filter(d => d.watched).length;
  const dbPct = (dbData ?? []).length > 0 ? Math.round((dbWatched / (dbData ?? []).length) * 100) : 0;

  const activeProspects = (evData ?? []).filter(p => p.stage !== 'passover').length;

  const statCards = [
    { label: 'Total Members', value: totalMembers, icon: <Users size={20} />, color: 'text-primary' },
    { label: 'Attendance This Week', value: `${attPct}%`, sub: `${physPct}% physical · ${onlPct}% online`, icon: <ClipboardCheck size={20} />, color: 'text-success' },
    { label: 'Daily Bread Compliance', value: `${dbPct}%`, icon: <BookOpen size={20} />, color: 'text-warning' },
    { label: 'Active Prospects', value: activeProspects, icon: <TrendingUp size={20} />, color: 'text-primary' },
  ];

  const deptSummary = departments.map(dept => {
    const memberCount = (memberData ?? []).filter(m => m.department === dept.key).length;
    const deptAtt = (attData ?? []).filter(a => a.member_department === dept.key);
    const wedAtt = deptAtt.filter(a => a.service_type.startsWith('wed') && (a.attendance_type === 'physical' || a.attendance_type === 'online'));
    const sunAtt = deptAtt.filter(a => a.service_type === 'sun' && (a.attendance_type === 'physical' || a.attendance_type === 'online'));
    const deptDb = (dbData ?? []).filter(d => d.member_department === dept.key);
    const dbP = deptDb.length > 0 ? Math.round((deptDb.filter(d => d.watched).length / deptDb.length) * 100) : 0;
    return { ...dept, memberCount, wedCount: wedAtt.length, sunCount: sunAtt.length, dbPct: dbP };
  });

  const funnelData = stages.map(s => ({
    stage: stageLabels[s],
    count: (evData ?? []).filter(p => p.stage === s).length,
  }));
  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-heading text-[24px] font-bold text-black">Dashboard</h1>
        <p className="font-body text-[14px] text-muted-foreground mt-1">Church overview — week of {weekStart}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-[8px] border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-[11px] text-[#6B7280] uppercase tracking-wider">{card.label}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className="font-heading text-[32px] font-bold text-black leading-none">{card.value}</p>
            {card.sub && <p className="font-body text-[13px] text-muted-foreground mt-2">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department summary */}
        <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5">
          <h2 className="font-heading text-[16px] font-bold text-black mb-4">Department Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="h-[44px] px-2 text-left align-middle font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Department</th>
                  <th className="h-[44px] px-2 text-center align-middle font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Members</th>
                  <th className="h-[44px] px-2 text-center align-middle font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Wed</th>
                  <th className="h-[44px] px-2 text-center align-middle font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Sun</th>
                  <th className="h-[44px] px-2 text-center align-middle font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">DB %</th>
                </tr>
              </thead>
              <tbody>
                {deptSummary.map((d, idx) => (
                  <tr key={d.key} className={`border-b border-[#E5E7EB] h-[44px] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                    <td className="px-2 font-medium text-black">{d.label}</td>
                    <td className="px-2 text-center text-black">{d.memberCount}</td>
                    <td className="px-2 text-center text-black">{d.wedCount}</td>
                    <td className="px-2 text-center text-black">{d.sunCount}</td>
                    <td className="px-2 text-center">
                      <span className={`font-medium ${d.dbPct >= 70 ? 'text-[#16a34a]' : d.dbPct >= 50 ? 'text-[#ea580c]' : 'text-[#dc2626]'}`}>{d.dbPct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evangelism funnel */}
        <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5">
          <h2 className="font-heading text-[16px] font-bold text-black mb-4">Evangelism Pipeline</h2>
          <div className="space-y-4">
            {funnelData.map(f => (
              <div key={f.stage}>
                <div className="flex justify-between text-[13px] font-body mb-2">
                  <span className="text-[#6B7280]">{f.stage}</span>
                  <span className="font-medium text-black">{f.count}</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#de3163] rounded-full transition-all"
                    style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
