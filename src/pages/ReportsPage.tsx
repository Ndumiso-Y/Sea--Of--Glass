import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [view, setView] = useState<'department' | 'ministry' | 'church'>('department');

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Reports</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Generate and export reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:bg-sidebar-accent-hover transition-colors">
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div className="flex gap-1 mb-6">
        {(['department', 'ministry', 'church'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-heading font-medium transition-colors capitalize ${
              view === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {v === 'church' ? 'Church Roll-up' : `${v} Report`}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center min-h-[300px]">
        <FileText size={48} className="text-muted-foreground/30 mb-4" />
        <h2 className="font-heading text-lg font-semibold text-foreground mb-2 capitalize">{view} Report</h2>
        <p className="font-body text-sm text-muted-foreground text-center max-w-md">
          Select a {view === 'church' ? 'month' : `${view} and month`} to generate the report. Reports include attendance, daily bread, evangelism, and test summaries.
        </p>
        <div className="flex gap-3 mt-6">
          {view !== 'church' && (
            <select className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm">
              <option>Select {view}</option>
            </select>
          )}
          <select className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm">
            <option>March 2024</option>
            <option>February 2024</option>
            <option>January 2024</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
