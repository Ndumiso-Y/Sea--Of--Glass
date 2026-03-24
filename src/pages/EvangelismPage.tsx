import React, { useState } from 'react';
import { useEvangelism } from '@/hooks/useEvangelism';
import { EvangelismStage } from '@/data/types';
import { Check } from 'lucide-react';

const stages: EvangelismStage[] = ['bucket', 'pickup', 'bb', 'read_for_centre', 'centre', 'passover'];
const stageLabels: Record<EvangelismStage, string> = {
  bucket: 'Bucket', pickup: 'Pick Up', bb: 'BB',
  read_for_centre: 'Read', centre: 'Centre', passover: 'Passover',
};

const stageBarColors = [
  'bg-[#0A0A0A]',
  'bg-[#34111d]',
  'bg-[#5e1931]',
  'bg-[#882044]',
  'bg-[#b32958]',
  'bg-[#de3163]'
];

const EvangelismPage: React.FC = () => {
  const [tab, setTab] = useState<'individual' | 'rollup'>('individual');
  const { data, loading } = useEvangelism();
  const prospects = data ?? [];

  const getDaysInStage = (dateStr: string) => {
    const entered = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-[24px] font-bold text-black">Evangelism Pipeline</h1>
        <p className="font-body text-[14px] text-[#6B7280] mt-1">Track prospect progress through the pipeline</p>
      </div>

      <div className="flex gap-4 border-b border-[#E5E7EB] mb-6">
        {(['individual', 'rollup'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-[13px] font-heading font-normal transition-colors border-b-2 ${
              tab === t ? 'border-[#de3163] text-black' : 'border-transparent text-[#6B7280] hover:text-black'
            }`}
          >
            {t === 'individual' ? 'Individual' : 'Cell / Dept Rollup'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280] font-body text-sm">Loading...</div>
      ) : tab === 'individual' ? (
        <div className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto pb-6">
            <table className="w-full text-[13px] font-body bg-white min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Prospect</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Linked Member</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] w-[400px]">Progress</th>
                  <th className="h-[44px] text-right px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] w-[120px]">Days in Stage</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p, idx) => {
                  const currentStageIdx = stages.indexOf(p.stage);
                  const days = getDaysInStage(p.stage_entered_date);
                  const daysColor = days > 60 ? 'text-[#DC2626]' : days > 30 ? 'text-[#ea580c]' : 'text-black';

                  return (
                    <tr key={p.id} className={`border-b border-[#E5E7EB] h-[80px] hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                      <td className="px-4 font-medium text-black align-middle">{p.prospect_name}</td>
                      <td className="px-4 text-[#6B7280] align-middle">{p.linked_member_name ?? '—'}</td>
                      <td className="px-4 align-middle">
                        <div className="flex items-start w-full relative pt-2">
                          {stages.map((s, i) => {
                            const isCompleted = i < currentStageIdx;
                            const isCurrent = i === currentStageIdx;
                            return (
                              <div key={s} className="flex-1 flex flex-col relative items-center group">
                                {i < stages.length - 1 && (
                                  <div className={`absolute top-[12px] left-1/2 w-full h-[1px] ${isCompleted ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'}`} />
                                )}
                                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-heading font-medium ${isCompleted ? 'bg-[#0A0A0A] text-white' : isCurrent ? 'bg-[#de3163] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'}`}>
                                  {isCompleted ? <Check size={12} strokeWidth={3} /> : i + 1}
                                </div>
                                <span className={`text-[11px] font-body mt-2 text-center whitespace-nowrap ${isCurrent ? 'text-black font-semibold' : 'text-[#6B7280]'}`}>
                                  {stageLabels[s]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className={`px-4 text-right font-medium align-middle ${daysColor}`}>{days} <span className="text-[11px] font-normal text-[#6B7280] ml-0.5">days</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden p-6 max-w-[800px]">
          <h2 className="font-heading text-[16px] font-bold text-black mb-6">Department Evangelism Rollup</h2>
          <div className="space-y-6">
            {['MG', 'WG', 'YG', 'SNG'].map(dept => {
              const deptProspects = prospects.filter(p => p.department === dept);
              const total = deptProspects.length;
              return (
                <div key={dept}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-heading text-[13px] font-semibold text-black">{dept}</span>
                    <span className="font-body text-[12px] text-[#6B7280]">Total: {total}</span>
                  </div>
                  <div className="h-8 flex rounded-[4px] overflow-hidden bg-[#FAFAFA] border border-[#E5E7EB]">
                    {total === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-[#6B7280] font-body">No prospects</div>
                    ) : (
                      stages.map((s, i) => {
                        const count = deptProspects.filter(p => p.stage === s).length;
                        if (count === 0) return null;
                        const widthPct = (count / total) * 100;
                        return (
                          <div
                            key={s}
                            style={{ width: `${widthPct}%` }}
                            className={`${stageBarColors[i]} h-full flex items-center justify-center transition-all group relative border-r border-white/20 last:border-0`}
                          >
                            {widthPct > 8 && <span className="text-[11px] font-heading font-medium text-white/90">{count}</span>}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-[10px] font-body hidden group-hover:block whitespace-nowrap z-10">
                              {stageLabels[s]}: {count}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-[#E5E7EB]">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stageBarColors[i]}`} />
                <span className="text-[11px] font-body text-[#6B7280]">{stageLabels[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvangelismPage;
