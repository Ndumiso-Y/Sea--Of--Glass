import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useMinistries } from '@/hooks/useMinistries';
import { useRoleChangeRequests } from '@/hooks/useRoleChangeRequests';
import { useTelegramChats, type TelegramChat } from '@/hooks/useTelegramChats';
import { supabase } from '@/lib/supabase';
import { Settings as SettingsIcon, Shield, Building2, Users, Check, X as XIcon, Bell, Send, RefreshCw, ChevronDown, Loader2 } from 'lucide-react';

const DEPARTMENTS = ['MG', 'WG', 'YG', 'SNG', 'STUDENTS'] as const;

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'roles' | 'approvals' | 'ministries' | 'church' | 'telegram'>('roles');
  const isGSN = user?.role === 'GSN';
  const isSMN = user?.role === 'SMN';

  const { data: membersData, loading: membersLoading } = useMembers();
  const { data: ministriesData, loading: ministriesLoading } = useMinistries();
  const { data: rcData, loading: rcLoading, approve, reject } = useRoleChangeRequests('pending');
  const { data: tgChats, loading: tgLoading, refetch: tgRefetch, updateChat } = useTelegramChats();

  const pendingCount = (rcData ?? []).length;

  // Per-row edit state for Telegram chats
  const [editingChat, setEditingChat] = useState<Record<string, Partial<TelegramChat>>>({});
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const tabs = [
    ...(isSMN || isGSN ? [{ key: 'roles',     label: 'Role Management',   icon: <Users size={16} /> }] : []),
    ...(isGSN           ? [{ key: 'approvals', label: `Approvals${pendingCount ? ` (${pendingCount})` : ''}`, icon: <Shield size={16} /> }] : []),
    ...(isGSN           ? [{ key: 'ministries',label: 'Ministry Activation', icon: <Building2 size={16} /> }] : []),
    ...(isGSN || isSMN  ? [{ key: 'telegram',  label: 'Telegram Chats',    icon: <Send size={16} /> }] : []),
    ...(isGSN           ? [{ key: 'church',    label: 'Church Profile',    icon: <SettingsIcon size={16} /> }] : []),
  ];

  const handleRefreshChats = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke('refresh-telegram-chats');
      await tgRefetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveChat = async (id: string) => {
    const updates = editingChat[id];
    if (!updates) return;
    setSavingId(id);
    try {
      await updateChat(id, updates);
      setEditingChat(prev => { const next = { ...prev }; delete next[id]; return next; });
    } finally {
      setSavingId(null);
    }
  };

  const patchEdit = (id: string, patch: Partial<TelegramChat>) => {
    setEditingChat(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  };

  const handleApprove = async (requestId: string) => {
    if (!user?.memberId) return;
    try {
      await approve(requestId, user.memberId);
    } catch (e) {
      console.error('Approve failed', e);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.memberId) return;
    try {
      await reject(requestId, user.memberId);
    } catch (e) {
      console.error('Reject failed', e);
    }
  };

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
            {membersLoading ? (
              <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
            ) : (
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Member</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Current Role</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Department</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Cell</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(membersData ?? []).map(m => (
                    <tr key={m.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{m.name}</td>
                      <td className="py-3 px-4"><span className="text-[11px] px-2 py-0.5 rounded bg-foreground text-card font-medium">{m.duty_title}</span></td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.department}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.cell}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-[11px] px-3 py-1 rounded bg-muted text-foreground font-medium hover:bg-muted-foreground/10 transition-colors">
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Approvals */}
      {tab === 'approvals' && isGSN && (
        <div className="space-y-4">
          {rcLoading ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
          ) : (rcData ?? []).length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            (rcData ?? []).map(r => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{r.member_name}</h3>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {r.current_role} → <span className="text-primary font-medium">{r.proposed_role}</span>
                      {' · '}Dept: {r.proposed_department} · Cell: {r.proposed_cell}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      Submitted by {r.requester_name ?? 'Unknown'} on {r.created_at.split('T')[0]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-heading font-medium hover:bg-success/90 transition-colors"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-heading font-medium hover:bg-destructive/90 transition-colors"
                    >
                      <XIcon size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ministry Activation */}
      {tab === 'ministries' && isGSN && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {ministriesLoading ? (
              <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading...</div>
            ) : (
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
                  {(ministriesData ?? []).map(m => (
                    <tr key={m.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium text-foreground">{m.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.abbreviation}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.bjn_name ?? '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${m.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {m.is_active ? 'Active' : 'Dormant'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Telegram Chats */}
      {tab === 'telegram' && (isGSN || isSMN) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-muted-foreground">
              Map each Telegram group to its department or cell so announcements are delivered correctly.
            </p>
            <button
              onClick={handleRefreshChats}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-heading font-medium hover:bg-muted disabled:opacity-60 transition-colors"
            >
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh Chats
            </button>
          </div>

          {tgLoading ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading…</div>
          ) : (tgChats ?? []).length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Send size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground mb-1">No Telegram chats found.</p>
              <p className="font-body text-xs text-muted-foreground">
                Add the bot to a Telegram group, send a message in that group, then click Refresh Chats.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Chat</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Scope</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Department / Cell</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium text-xs">Active</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(tgChats ?? []).map(chat => {
                    const edit   = editingChat[chat.id] ?? {};
                    const scope  = edit.scope      ?? chat.scope      ?? 'church_wide';
                    const dept   = edit.department ?? chat.department ?? '';
                    const cell   = edit.cell       ?? chat.cell       ?? '';
                    const active = edit.is_active  !== undefined ? edit.is_active : chat.is_active;
                    const dirty  = !!editingChat[chat.id];

                    return (
                      <tr key={chat.id} className="border-b border-border/50">
                        {/* Chat info */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground text-sm">{chat.chat_title ?? '(unnamed)'}</p>
                          <p className="text-xs text-muted-foreground">{chat.chat_type} · ID: {chat.chat_id}</p>
                        </td>

                        {/* Scope */}
                        <td className="py-3 px-4">
                          <div className="relative max-w-[140px]">
                            <select
                              value={scope}
                              onChange={e => patchEdit(chat.id, { scope: e.target.value, department: '', cell: '' })}
                              className="w-full px-2 py-1.5 pr-7 rounded border border-input bg-background text-foreground text-xs font-body appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                            >
                              <option value="church_wide">Church-wide</option>
                              <option value="department">Department</option>
                              <option value="cell">Cell</option>
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </td>

                        {/* Department / Cell value */}
                        <td className="py-3 px-4">
                          {scope === 'department' ? (
                            <div className="relative max-w-[100px]">
                              <select
                                value={dept}
                                onChange={e => patchEdit(chat.id, { department: e.target.value })}
                                className="w-full px-2 py-1.5 pr-7 rounded border border-input bg-background text-foreground text-xs font-body appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                              >
                                <option value="">Select…</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          ) : scope === 'cell' ? (
                            <input
                              type="text"
                              value={cell}
                              onChange={e => patchEdit(chat.id, { cell: e.target.value })}
                              placeholder="Cell name"
                              className="max-w-[120px] w-full px-2 py-1.5 rounded border border-input bg-background text-foreground text-xs font-body focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Active toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => patchEdit(chat.id, { is_active: !active })}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                              active
                                ? 'bg-success/10 text-success'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {active ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Save */}
                        <td className="py-3 px-4 text-right">
                          {dirty && (
                            <button
                              onClick={() => handleSaveChat(chat.id)}
                              disabled={savingId === chat.id}
                              className="flex items-center gap-1.5 ml-auto px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
                            >
                              {savingId === chat.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                              Save
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
              <input defaultValue={user?.name ?? ''} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm" />
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
