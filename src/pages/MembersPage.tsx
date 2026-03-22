import React, { useState } from 'react';
import { members, attendance, dailyBread, evangelismProspects, testResults, dutyHistory } from '@/data/seed';
import { useAuth } from '@/contexts/AuthContext';
import { Member } from '@/data/types';
import { Search, Plus, X, Camera } from 'lucide-react';

const statusColors: Record<string, string> = {
  Active: 'bg-success/10 text-success',
  Exempted: 'bg-muted text-muted-foreground',
  Absentee: 'bg-warning/10 text-warning',
  'Habitual Absentee': 'bg-destructive/10 text-destructive',
  LTA: 'bg-destructive/10 text-destructive',
  Dropout: 'bg-foreground/10 text-foreground',
};

const gaColors: Record<string, string> = {
  Member: 'bg-muted text-muted-foreground',
  Deacon: 'bg-foreground/10 text-foreground',
  Instructor: 'bg-primary/10 text-primary',
  Evangelist: 'bg-primary text-primary-foreground',
};

const MembersPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [profileTab, setProfileTab] = useState('overview');

  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.scj_number.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || m.department === deptFilter;
    return matchSearch && matchDept;
  });

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getMemberStats = (memberId: string) => {
    const mAtt = attendance.filter(a => a.member_id === memberId);
    const present = mAtt.filter(a => a.attendance_type === 'physical' || a.attendance_type === 'online').length;
    const attPct = mAtt.length > 0 ? Math.round((present / mAtt.length) * 100) : 0;

    const mDb = dailyBread.filter(d => d.member_id === memberId);
    const watched = mDb.filter(d => d.watched).length;
    const dbPct = mDb.length > 0 ? Math.round((watched / mDb.length) * 100) : 0;

    const prospect = evangelismProspects.find(p => p.linked_member_id === memberId);
    const tests = testResults.filter(t => t.member_id === memberId);
    const passed = tests.filter(t => t.pass).length;

    return { attPct, dbPct, evangelismStage: prospect?.stage || 'N/A', testsPassed: `${passed}/${tests.length}` };
  };

  const memberHistory = selectedMember ? dutyHistory.filter(h => h.member_id === selectedMember.id).sort((a, b) => new Date(b.appointed_date).getTime() - new Date(a.appointed_date).getTime()) : [];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Members</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{filteredMembers.length} members</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:bg-sidebar-accent-hover transition-colors">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Departments</option>
          <option value="MG">Men's Group</option>
          <option value="WG">Women's Group</option>
          <option value="YG">Youth Group</option>
          <option value="SNG">Seniors Group</option>
          <option value="STUDENTS">Students</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Member</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden md:table-cell">SCJ Number</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden sm:table-cell">Department</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden lg:table-cell">Cell</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden lg:table-cell">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs hidden md:table-cell">GA Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => (
                <tr
                  key={m.id}
                  onClick={() => { setSelectedMember(m); setProfileTab('overview'); }}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-card text-xs font-heading font-semibold flex-shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{m.name}</span>
                        {m.is_pastor && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">Pastor</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs hidden md:table-cell">{m.scj_number}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{m.department}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{m.cell}</td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-foreground text-card font-medium">{m.duty_title}</span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${gaColors[m.ga_status]}`}>{m.ga_status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColors[m.status]}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member profile slide-in */}
      {selectedMember && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedMember(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center text-card text-xl font-heading font-bold">
                      {getInitials(selectedMember.name)}
                    </div>
                    {user?.role === 'CULTURE' && (
                      <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Camera size={14} />
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-foreground">{selectedMember.name}</h2>
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">{selectedMember.scj_number}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-foreground text-card font-medium">{selectedMember.duty_title}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${gaColors[selectedMember.ga_status]}`}>{selectedMember.ga_status}</span>
                      {selectedMember.is_pastor && <span className="text-[11px] px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">Pastor</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              {/* Metrics */}
              {(() => {
                const stats = getMemberStats(selectedMember.id);
                return (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-heading">Attendance</p>
                      <p className="font-heading text-lg font-bold text-foreground mt-1">{stats.attPct}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-heading">Daily Bread</p>
                      <p className="font-heading text-lg font-bold text-foreground mt-1">{stats.dbPct}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-heading">Evangelism</p>
                      <p className="font-heading text-lg font-bold text-foreground mt-1 capitalize">{stats.evangelismStage}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-heading">Tests</p>
                      <p className="font-heading text-lg font-bold text-foreground mt-1">{stats.testsPassed}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
                {['overview', 'attendance', 'evangelism', 'tests', 'duty_history', 'exemptions'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setProfileTab(tab)}
                    className={`px-3 py-2 text-xs font-heading font-medium whitespace-nowrap transition-colors border-b-2 ${
                      profileTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'duty_history' ? 'Duty History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {profileTab === 'overview' && (
                <div className="space-y-3 text-sm font-body">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{selectedMember.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground">{selectedMember.phone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Telegram</span>
                    <span className="text-foreground">{selectedMember.telegram_handle}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Department</span>
                    <span className="text-foreground">{selectedMember.department}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Cell</span>
                    <span className="text-foreground">{selectedMember.cell}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="text-foreground">{selectedMember.created_at}</span>
                  </div>
                </div>
              )}

              {profileTab === 'duty_history' && (user?.role === 'GSN' || user?.role === 'SMN' || user?.role === 'HJN') && (
                <div className="space-y-3">
                  {memberHistory.map(h => {
                    const isActive = h.ended_date === null;
                    const appointer = members.find(m => m.id === h.appointed_by);
                    const approver = members.find(m => m.id === h.approved_by);
                    return (
                      <div key={h.id} className={`rounded-lg border p-3 ${isActive ? 'border-l-4 border-l-primary border-border' : 'border-border'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-heading text-sm font-semibold text-foreground">{h.role}</span>
                          {isActive && <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium">Current</span>}
                        </div>
                        <p className="text-xs text-muted-foreground font-body">{h.department} · {h.cell}{h.ministry_id ? ` · Ministry` : ''}</p>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          {h.appointed_date} — {h.ended_date || 'Present'}
                        </p>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          Appointed by: {appointer?.name || 'Unknown'} · Approved by: {approver?.name || 'Unknown'}
                        </p>
                        {h.reason_for_change && <p className="text-xs text-muted-foreground/70 font-body mt-1 italic">{h.reason_for_change}</p>}
                      </div>
                    );
                  })}
                  {memberHistory.length === 0 && <p className="text-sm text-muted-foreground font-body">No duty history recorded.</p>}
                </div>
              )}

              {profileTab !== 'overview' && profileTab !== 'duty_history' && (
                <p className="text-sm text-muted-foreground font-body">Detailed {profileTab} records will be shown here.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MembersPage;
