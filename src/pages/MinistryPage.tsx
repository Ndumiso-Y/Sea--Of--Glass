import React from 'react';
import { useParams } from 'react-router-dom';
import { ministries, members, financeClaims, constructionProjects, evangelismProspects } from '@/data/seed';
import { Lock, DollarSign, Briefcase } from 'lucide-react';

const MinistryPage: React.FC = () => {
  const { ministryId } = useParams<{ ministryId: string }>();
  const ministry = ministries.find(m => m.id === ministryId);

  if (!ministry) return <div className="p-8"><p className="text-muted-foreground font-body">Ministry not found.</p></div>;

  if (!ministry.is_active) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Lock size={48} className="text-muted-foreground/30 mb-4" />
        <h1 className="font-heading text-xl font-bold text-foreground mb-2">{ministry.name}</h1>
        <p className="font-body text-sm text-muted-foreground">This ministry is currently dormant. Contact GSN to activate.</p>
      </div>
    );
  }

  const bjn = members.find(m => m.id === ministry.bjn_member_id);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Briefcase size={20} className="text-primary" />
          <h1 className="font-heading text-2xl font-bold text-foreground">{ministry.name}</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          BJN: {bjn?.name || 'Unassigned'} · {ministry.abbreviation}
        </p>
      </div>

      {/* Finance Ministry */}
      {ministry.abbreviation === 'FIN' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2"><DollarSign size={16} /> Claims Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Submitter</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Category</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Amount</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {financeClaims.map(c => {
                  const sub = members.find(m => m.id === c.submitted_by);
                  const statusCl = c.status === 'approved' ? 'bg-success/10 text-success' : c.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning';
                  return (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-3 px-4 text-foreground">{sub?.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.category}</td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">R {c.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center"><span className={`text-[11px] px-2 py-0.5 rounded font-medium capitalize ${statusCl}`}>{c.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Construction Ministry */}
      {ministry.abbreviation === 'CONST' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-foreground">Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Project</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Budget</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Spent</th>
                </tr>
              </thead>
              <tbody>
                {constructionProjects.map(p => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-4"><span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{p.status}</span></td>
                    <td className="py-3 px-4 text-right text-muted-foreground">R {p.budget.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">R {p.actual_spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evangelism Ministry */}
      {ministry.abbreviation === 'EVAN' && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">All Departments Evangelism</h2>
          <p className="font-body text-sm text-muted-foreground">Total prospects: {evangelismProspects.length}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
            {(['bucket','pickup','bb','read_for_centre','centre','passover'] as const).map(s => (
              <div key={s} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground font-body capitalize">{s.replace(/_/g, ' ')}</p>
                <p className="font-heading text-lg font-bold text-foreground mt-1">{evangelismProspects.filter(p => p.stage === s).length}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generic active ministry */}
      {!['FIN', 'CONST', 'EVAN'].includes(ministry.abbreviation) && (
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="font-body text-sm text-muted-foreground">
            {ministry.name} module is active. Detailed features for this ministry will be implemented as needed.
          </p>
        </div>
      )}
    </div>
  );
};

export default MinistryPage;
