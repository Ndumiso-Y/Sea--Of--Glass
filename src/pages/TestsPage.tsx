import React, { useState } from 'react';
import { testResults, members } from '@/data/seed';
import { Plus, Check, X as XIcon } from 'lucide-react';

const TestsPage: React.FC = () => {
  const [deptFilter, setDeptFilter] = useState('all');
  const [testFilter, setTestFilter] = useState('all');

  const testNames = [...new Set(testResults.map(t => t.test_name))];

  const filtered = testResults.filter(t => {
    const member = members.find(m => m.id === t.member_id);
    const matchDept = deptFilter === 'all' || member?.department === deptFilter;
    const matchTest = testFilter === 'all' || t.test_name === testFilter;
    return matchDept && matchTest;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tests & Results</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{filtered.length} results</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:bg-sidebar-accent-hover transition-colors">
          <Plus size={16} /> Add Result
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm">
          <option value="all">All Departments</option>
          <option value="MG">MG</option><option value="WG">WG</option><option value="YG">YG</option><option value="SNG">SNG</option>
        </select>
        <select value={testFilter} onChange={e => setTestFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm">
          <option value="all">All Tests</option>
          {testNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Member</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Test</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Date</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Score</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Pass</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Rewrite</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const member = members.find(m => m.id === t.member_id);
                return (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium text-foreground">{member?.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.test_name}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{t.date_written}</td>
                    <td className="text-center py-3 px-4 font-medium text-foreground">{t.score}%</td>
                    <td className="text-center py-3 px-4">
                      {t.pass ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-success/10 text-success font-medium"><Check size={12} /> Pass</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-destructive/10 text-destructive font-medium"><XIcon size={12} /> Fail</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4 hidden sm:table-cell">
                      {t.rewrite_required ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">Yes</span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">No</span>
                      )}
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

export default TestsPage;
