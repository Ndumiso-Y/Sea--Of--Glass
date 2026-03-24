import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useDailyBread } from '@/hooks/useDailyBread';
import { useEvangelism } from '@/hooks/useEvangelism';
import { useTestResults } from '@/hooks/useTestResults';
import { useDutyHistory } from '@/hooks/useDutyHistory';
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

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

/* ---- MemberProfile sub-component: hooks run only when this mounts ---- */
interface MemberProfileProps {
  member: Member;
  onClose: () => void;
}

const MemberProfile: React.FC<MemberProfileProps> = ({ member, onClose }) => {
  const { user } = useAuth();
  const [profileTab, setProfileTab] = useState('overview');

  const { data: attData } = useAttendance({ memberId: member.id });
  const { data: dbData } = useDailyBread({ memberId: member.id });
  const { data: testData } = useTestResults({ memberId: member.id });
  const { data: historyData } = useDutyHistory(member.id);
  const { data: evData } = useEvangelism();

  // Compute stats
  const mAtt = attData ?? [];
  const present = mAtt.filter(a => a.attendance_type === 'physical' || a.attendance_type === 'online').length;
  const nonExemptAtt = mAtt.filter(a => a.attendance_type !== 'exempted').length;
  const attPct = nonExemptAtt > 0 ? Math.round((present / nonExemptAtt) * 100) : 0;

  const mDb = dbData ?? [];
  const watched = mDb.filter(d => d.watched).length;
  const dbPct = mDb.length > 0 ? Math.round((watched / mDb.length) * 100) : 0;

  const prospect = (evData ?? []).find(p => p.linked_member_id === member.id);
  const mTests = testData ?? [];
  const passed = mTests.filter(t => t.pass).length;

  const memberHistory = (historyData ?? []).slice().sort(
    (a, b) => new Date(b.appointed_date).getTime() - new Date(a.appointed_date).getTime()
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white border-l border-[#E5E7EB] z-50 overflow-y-auto animate-slide-in-right">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-[80px] h-[80px] rounded-full bg-black flex items-center justify-center text-white text-[24px] font-heading font-bold overflow-hidden">
                  {member.profile_image_url ? (
                    <img src={member.profile_image_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>
                {user?.role === 'CULTURE' && (
                  <div className="absolute inset-0 bg-black/50 rounded-full hidden group-hover:flex items-center justify-center cursor-pointer">
                    <Camera size={24} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-heading text-[20px] font-semibold text-black">{member.name}</h2>
                <p className="font-mono text-[13px] text-[#6B7280] mt-0.5">{member.scj_number}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E5E7EB]/50 text-[#6B7280] font-semibold">{member.duty_title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#de3163] text-white font-semibold">{member.ga_status}</span>
                  {member.is_pastor && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10B981] text-white font-semibold">Pastor</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#6B7280] hover:text-black mt-2">
              <X size={20} />
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Attendance %', val: `${attPct}%` },
              { label: 'Daily Bread %', val: `${dbPct}%` },
              { label: 'Evangelism Stage', val: prospect?.stage ?? 'N/A' },
              { label: 'Tests Passed', val: `${passed}/${mTests.length}` },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-[8px] border border-[#E5E7EB] p-3">
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wide font-heading truncate">{card.label}</p>
                <p className="font-heading text-[20px] font-bold text-black mt-1">{card.val}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-[#E5E7EB] mb-6 overflow-x-auto">
            {['overview', 'attendance', 'evangelism', 'tests', 'duty history', 'exemptions'].map(t => (
              <button
                key={t}
                onClick={() => setProfileTab(t)}
                className={`pb-2 text-[13px] font-heading font-normal whitespace-nowrap transition-colors border-b-2 ${
                  profileTab === t ? 'border-[#de3163] text-black' : 'border-transparent text-[#6B7280] hover:text-black'
                }`}
              >
                {t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {profileTab === 'overview' && (
            <div className="space-y-4 text-[13px] font-body">
              <div className="flex flex-col"><span className="text-[#6B7280] mb-1">Email</span><span className="text-black">{member.email}</span></div>
              <div className="flex flex-col"><span className="text-[#6B7280] mb-1">Phone</span><span className="text-black">{member.phone}</span></div>
              <div className="flex flex-col"><span className="text-[#6B7280] mb-1">Telegram</span><span className="text-black">{member.telegram_handle}</span></div>
              <div className="flex flex-col"><span className="text-[#6B7280] mb-1">Department / Cell</span><span className="text-black">{member.department} · {member.cell}</span></div>
              <div className="flex flex-col"><span className="text-[#6B7280] mb-1">Joined</span><span className="text-black">{member.created_at?.split('T')[0]}</span></div>
            </div>
          )}

          {profileTab === 'duty history' && (
            <div className="relative pl-3 space-y-6">
              {memberHistory.map(h => (
                <div key={h.id} className={`pl-4 border-l-[3px] ${h.is_active ? 'border-[#de3163]' : 'border-[#E5E7EB]'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-heading text-[14px] font-semibold text-black">{h.role}</span>
                    {(user?.role === 'SMN' && !h.is_active) && (
                      <button className="text-[12px] font-body text-[#de3163] hover:underline">Edit end date</button>
                    )}
                  </div>
                  <p className="text-[13px] text-[#6B7280] font-body">{h.department} · {h.cell}{h.ministry_id ? ' · Ministry' : ''}</p>
                  <p className="text-[12px] text-[#6B7280] font-body mt-2">
                    {h.appointed_date} — {h.ended_date ?? 'Current'}
                  </p>
                  <p className="text-[12px] text-[#6B7280] font-body">
                    Appointed by: {h.appointer_name ?? 'Unknown'} · Approved by: {h.approver_name ?? 'Unknown'}
                  </p>
                  {h.reason_for_change && <p className="text-[12px] text-[#6B7280] font-body mt-1 italic">Reason: {h.reason_for_change}</p>}
                </div>
              ))}
              {memberHistory.length === 0 && <p className="text-[13px] text-[#6B7280] font-body">No duty history recorded.</p>}
            </div>
          )}

          {profileTab !== 'overview' && profileTab !== 'duty history' && (
            <p className="text-[13px] text-[#6B7280] font-body">Detailed {profileTab} records will be shown here.</p>
          )}
        </div>
      </div>
    </>
  );
};

/* ---- Main MembersPage ---- */
const MembersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { data: membersData, loading } = useMembers({
    department: deptFilter !== 'all' ? deptFilter : undefined,
    search: search || undefined,
  });

  const filteredMembers = membersData ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[24px] font-bold text-black">Members</h1>
          <p className="font-body text-[14px] text-muted-foreground mt-1">{filteredMembers.length} members</p>
        </div>
        <button className="flex items-center gap-2 px-4 h-[36px] bg-[#de3163] text-white rounded-[8px] font-heading text-[13px] font-semibold transition-colors">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 h-[36px] rounded-[8px] border border-[#E5E7EB] bg-white text-black font-body text-[13px] focus:outline-none focus:border-[#de3163]"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 h-[36px] rounded-[8px] border border-[#E5E7EB] bg-white text-black font-body text-[13px] focus:outline-none focus:border-[#de3163]"
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
      <div className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-[#6B7280] font-body text-sm">Loading...</div>
          ) : (
            <table className="w-full text-[13px] font-body bg-white">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Member</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] hidden md:table-cell">SCJ Number</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] hidden sm:table-cell">Department</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] hidden lg:table-cell">Cell</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] hidden lg:table-cell">Role</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280] hidden md:table-cell">GA Status</th>
                  <th className="h-[44px] text-left px-4 font-heading text-[11px] font-normal uppercase tracking-[0.08em] text-[#6B7280]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className={`border-b border-[#E5E7EB] h-[44px] cursor-pointer transition-colors hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white text-[11px] font-heading font-semibold flex-shrink-0">
                          {getInitials(m.name)}
                        </div>
                        <div>
                          <span className="font-medium text-black">{m.name}</span>
                          {m.is_pastor && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#10B981] text-white font-semibold">Pastor</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-[#6B7280] font-mono text-[13px] hidden md:table-cell">{m.scj_number}</td>
                    <td className="px-4 text-[#6B7280] hidden sm:table-cell">{m.department}</td>
                    <td className="px-4 text-[#6B7280] hidden lg:table-cell">{m.cell}</td>
                    <td className="px-4 hidden lg:table-cell">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E5E7EB]/50 text-[#6B7280] font-semibold">{m.duty_title}</span>
                    </td>
                    <td className="px-4 hidden md:table-cell">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#de3163] text-white font-semibold">{m.ga_status}</span>
                    </td>
                    <td className="px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColors[m.status] ?? ''}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Member profile slide-in */}
      {selectedMember && (
        <MemberProfile member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
};

export default MembersPage;
