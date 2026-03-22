import React from 'react';
import { members, attendance, dailyBread, evangelismProspects } from '@/data/seed';
import { Users, ClipboardCheck, BookOpen, TrendingUp } from 'lucide-react';

const stages = ['bucket', 'pickup', 'bb', 'read_for_centre', 'centre', 'passover'] as const;
const stageLabels: Record<string, string> = {
  bucket: 'Bucket', pickup: 'Pick Up', bb: 'BB',
  read_for_centre: 'Read for Centre', centre: 'Centre', passover: 'Passover'
};
const departments = [
  { key: 'MG', label: "Men's Group" },
  { key: 'WG', label: "Women's Group" },
  { key: 'YG', label: 'Youth Group' },
  { key: 'SNG', label: 'Seniors Group' },
  { key: 'STUDENTS', label: 'Students' },
];

const DashboardPage: React.FC = () => {
  const totalMembers = members.length;

  // Attendance calc (latest week)
  const latestWeek = '2024-03-25';
  const weekAtt = attendance.filter(a => a.service_date === latestWeek);
  const physical = weekAtt.filter(a => a.attendance_type === 'physical').length;
  const online = weekAtt.filter(a => a.attendance_type === 'online').length;
  const total = weekAtt.filter(a => a.attendance_type !== 'exempted').length;
  const attPct = total > 0 ? Math.round(((physical + online) / total) * 100) : 0;
  const physPct = total > 0 ? Math.round((physical / total) * 100) : 0;
  const onlPct = total > 0 ? Math.round((online / total) * 100) : 0;

  // Daily bread
  const weekDb = dailyBread.filter(d => d.date.startsWith(latestWeek));
  const dbWatched = weekDb.filter(d => d.watched).length;
  const dbPct = weekDb.length > 0 ? Math.round((dbWatched / weekDb.length) * 100) : 0;

  // Evangelism
  const activeProspects = evangelismProspects.filter(p => p.stage !== 'passover').length;

  const statCards = [
    { label: 'Total Members', value: totalMembers, icon: <Users size={20} />, color: 'text-primary' },
    { label: 'Attendance This Week', value: `${attPct}%`, sub: `${physPct}% physical · ${onlPct}% online`, icon: <ClipboardCheck size={20} />, color: 'text-success' },
    { label: 'Daily Bread Compliance', value: `${dbPct}%`, icon: <BookOpen size={20} />, color: 'text-warning' },
    { label: 'Active Prospects', value: activeProspects, icon: <TrendingUp size={20} />, color: 'text-primary' },
  ];

  // Dept summary
  const deptSummary = departments.map(dept => {
    const deptMembers = members.filter(m => m.department === dept.key);
    const deptIds = deptMembers.map(m => m.id);
    const deptAtt = weekAtt.filter(a => deptIds.includes(a.member_id));
    const wedAtt = deptAtt.filter(a => a.service_type.startsWith('wed') && (a.attendance_type === 'physical' || a.attendance_type === 'online'));
    const sunAtt = deptAtt.filter(a => a.service_type === 'sun' && (a.attendance_type === 'physical' || a.attendance_type === 'online'));
    const deptDb = weekDb.filter(d => deptIds.includes(d.member_id));
    const dbP = deptDb.length > 0 ? Math.round((deptDb.filter(d => d.watched).length / deptDb.length) * 100) : 0;
    return { ...dept, wedCount: wedAtt.length, sunCount: sunAtt.length, dbPct: dbP, memberCount: deptMembers.length };
  });

  // Funnel
  const funnelData = stages.map(s => ({
    stage: stageLabels[s],
    count: evangelismProspects.filter(p => p.stage === s).length,
  }));
  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Church overview — week of March 25, 2024</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">{card.label}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{card.value}</p>
            {card.sub && <p className="font-body text-xs text-muted-foreground mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department summary */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Department Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium text-xs">Department</th>
                  <th className="text-center py-2 text-muted-foreground font-medium text-xs">Members</th>
                  <th className="text-center py-2 text-muted-foreground font-medium text-xs">Wed</th>
                  <th className="text-center py-2 text-muted-foreground font-medium text-xs">Sun</th>
                  <th className="text-center py-2 text-muted-foreground font-medium text-xs">DB %</th>
                </tr>
              </thead>
              <tbody>
                {deptSummary.map(d => (
                  <tr key={d.key} className="border-b border-border/50">
                    <td className="py-2.5 font-medium text-foreground">{d.label}</td>
                    <td className="text-center text-muted-foreground">{d.memberCount}</td>
                    <td className="text-center text-muted-foreground">{d.wedCount}</td>
                    <td className="text-center text-muted-foreground">{d.sunCount}</td>
                    <td className="text-center">
                      <span className={`font-medium ${d.dbPct >= 70 ? 'text-success' : d.dbPct >= 50 ? 'text-warning' : 'text-destructive'}`}>{d.dbPct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evangelism funnel */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Evangelism Pipeline</h2>
          <div className="space-y-3">
            {funnelData.map(f => (
              <div key={f.stage}>
                <div className="flex justify-between text-xs font-body mb-1">
                  <span className="text-muted-foreground">{f.stage}</span>
                  <span className="font-medium text-foreground">{f.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
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
