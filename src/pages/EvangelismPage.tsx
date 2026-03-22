import React, { useState } from 'react';
import { evangelismProspects, members } from '@/data/seed';
import { EvangelismStage } from '@/data/types';

const stages: EvangelismStage[] = ['bucket', 'pickup', 'bb', 'read_for_centre', 'centre', 'passover'];
const stageLabels: Record<EvangelismStage, string> = {
  bucket: 'Bucket', pickup: 'Pick Up', bb: 'BB',
  read_for_centre: 'Read for Centre', centre: 'Centre', passover: 'Passover',
};
const stageColors: Record<EvangelismStage, string> = {
  bucket: 'bg-muted-foreground', pickup: 'bg-warning', bb: 'bg-blue-500',
  read_for_centre: 'bg-purple-500', centre: 'bg-primary', passover: 'bg-success',
};

const EvangelismPage: React.FC = () => {
  const [tab, setTab] = useState<'individual' | 'rollup'>('individual');

  const daysInStage = (dateStr: string) => {
    const entered = new Date(dateStr);
    const now = new Date('2024-03-25');
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Evangelism Pipeline</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Track prospect progress through the pipeline</p>
      </div>

      <div className="flex gap-1 mb-6">
        {(['individual', 'rollup'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-heading font-medium transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {t === 'individual' ? 'Individual' : 'Cell / Dept Rollup'}
          </button>
        ))}
      </div>

      {tab === 'individual' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Prospect</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Linked Member</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Stage</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden md:table-cell">Progress</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Days in Stage</th>
                </tr>
              </thead>
              <tbody>
                {evangelismProspects.map(p => {
                  const linked = members.find(m => m.id === p.linked_member_id);
                  const stageIdx = stages.indexOf(p.stage);
                  return (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{p.prospect_name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{linked?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded text-white font-medium ${stageColors[p.stage]}`}>
                          {stageLabels[p.stage]}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex gap-0.5">
                          {stages.map((s, i) => (
                            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stageIdx ? stageColors[p.stage] : 'bg-border'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground hidden sm:table-cell">{daysInStage(p.stage_entered_date)}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'rollup' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Department</th>
                  {stages.map(s => (
                    <th key={s} className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">{stageLabels[s]}</th>
                  ))}
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {['MG', 'WG', 'YG', 'SNG'].map(dept => {
                  const deptProspects = evangelismProspects.filter(p => p.department === dept);
                  return (
                    <tr key={dept} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{dept}</td>
                      {stages.map(s => (
                        <td key={s} className="text-center py-3 px-4 text-muted-foreground">
                          {deptProspects.filter(p => p.stage === s).length || '—'}
                        </td>
                      ))}
                      <td className="text-center py-3 px-4 font-medium text-foreground">{deptProspects.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvangelismPage;
