import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { members, ministries, roleChangeRequests } from '@/data/seed';
import { Settings as SettingsIcon, Shield, Building2, Users, Check, X as XIcon, Bell } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'roles' | 'approvals' | 'ministries' | 'church'>('roles');
  const isGSN = user?.role === 'GSN';
  const isSMN = user?.role === 'SMN';
  const pendingCount = roleChangeRequests.filter(r => r.status === 'pending').length;

  const tabs = [
    ...(isSMN || isGSN ? [{ key: 'roles', label: 'Role Management', icon: <Users size={16} /> }] : []),
    ...(isGSN ? [{ key: 'approvals', label: `Approvals${pendingCount ? ` (${pendingCount})` : ''}`, icon: <Shield size={16} /> }] : []),
    ...(isGSN ? [{ key: 'ministries', label: 'Ministry Activation', icon: <Building2 size={16} /> }] : []),
    ...(isGSN ? [{ key: 'church', label: 'Church Profile', icon: <SettingsIcon size={16} /> }] : []),
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Manage roles, ministries, and church profile</p>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Role Management */}
      {tab === 'roles' && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Member</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Current Role</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Department</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Cell</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Status</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const pending = roleChangeRequests.find(r => r.member_id === m.id && r.status === 'pending');
                  return (
                    <tr key={m.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{m.name}</td>
                      <td className="py-3 px-4"><span className="text-[11px] px-2 py-0.5 rounded bg-foreground text-card font-medium">{m.duty_title}</span></td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.department}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.cell}</td>
                      <td className="py-3 px-4 text-center">
                        {pending ? (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">Pending</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-[11px] px-3 py-1 rounded bg-muted text-foreground font-medium hover:bg-muted-foreground/10 transition-colors">
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approvals */}
      {tab === 'approvals' && isGSN && (
        <div className="space-y-4">
          {roleChangeRequests.filter(r => r.status === 'pending').map(r => {
            const member = members.find(m => m.id === r.member_id);
            const requester = members.find(m => m.id === r.requested_by);
            return (
              <div key={r.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{member?.name}</h3>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {r.current_role} → <span className="text-primary font-medium">{r.proposed_role}</span>
                      {' · '}Dept: {r.proposed_department} · Cell: {r.proposed_cell}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">Submitted by {requester?.name} on {r.created_at}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-heading font-medium hover:bg-success/90 transition-colors">
                      <Check size={14} /> Approve
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-heading font-medium hover:bg-destructive/90 transition-colors">
                      <XIcon size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {roleChangeRequests.filter(r => r.status === 'pending').length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No pending approvals</p>
            </div>
          )}
        </div>
      )}

      {/* Ministry Activation */}
      {tab === 'ministries' && isGSN && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Ministry</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Abbreviation</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">BJN</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {ministries.map(m => {
                  const bjn = members.find(mem => mem.id === m.bjn_member_id);
                  return (
                    <tr key={m.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{m.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.abbreviation}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{bjn?.name || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${m.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {m.is_active ? 'Active' : 'Dormant'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Church Profile */}
      {tab === 'church' && isGSN && (
        <div className="bg-card rounded-xl border border-border p-5 max-w-lg">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Church Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Church Name</label>
              <input defaultValue="New Heaven and New Earth" className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Region</label>
              <input defaultValue="Rustenburg, South Africa" className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">GSN Name</label>
              <input defaultValue="Thabo Molefe" className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Telegram Bot Token</label>
              <input type="password" defaultValue="xxxxxxxxxxxx" className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm" />
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:bg-sidebar-accent-hover transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
