import React, { useState } from 'react';
import { members, dailyBread } from '@/data/seed';
import { useAuth } from '@/contexts/AuthContext';
import { Check } from 'lucide-react';

const days = ['Mon', 'Tue', 'Thu', 'Fri'];
const weeks = ['2024-03-04', '2024-03-11', '2024-03-18', '2024-03-25'];

const DailyBreadPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(weeks[weeks.length - 1]);

  const scopedMembers = user?.role === 'GSN' || user?.role === 'SMN'
    ? members
    : members.filter(m => m.department === user?.department);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Daily Bread</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Weekly devotional tracking</p>
        </div>
        <select
          value={selectedWeek}
          onChange={e => setSelectedWeek(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {weeks.map(w => <option key={w} value={w}>Week of {w}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs sticky left-0 bg-muted/50">Member</th>
                {days.map((d, i) => (
                  <th key={d} className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">{d}</th>
                ))}
                <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">%</th>
              </tr>
            </thead>
            <tbody>
              {scopedMembers.map(m => {
                const mDb = dailyBread.filter(d => d.member_id === m.id && d.date.startsWith(selectedWeek));
                const watched = mDb.filter(d => d.watched).length;
                const pct = mDb.length > 0 ? Math.round((watched / mDb.length) * 100) : 0;

                return (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="py-2.5 px-4 font-medium text-foreground sticky left-0 bg-card whitespace-nowrap">{m.name}</td>
                    {days.map((_, i) => {
                      const rec = mDb[i];
                      return (
                        <td key={i} className="text-center py-2.5 px-4">
                          {rec?.watched ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                              <Check size={14} className="text-success" />
                            </span>
                          ) : rec?.is_flex_day ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-warning" />
                          ) : (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-border" />
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-2.5 px-4">
                      <span className={`font-medium text-xs ${pct >= 70 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyBreadPage;
