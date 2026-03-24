import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useDailyBread, getWeekDayDates } from '@/hooks/useDailyBread';
import { useEvangelism } from '@/hooks/useEvangelism';
import { useAttendance } from '@/hooks/useAttendance';
import { useContributions } from '@/hooks/useContributions';
import { supabase } from '@/lib/supabase';
import {
  Home, Megaphone, PlayCircle, TrendingUp, ClipboardCheck, Wallet,
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  Loader2,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addWeeks(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().split('T')[0];
}

function fmt(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-ZA', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function timeAgo(isoStr: string): string {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STAGE_COLORS: Record<string, string> = {
  bucket:            'bg-[#E5E7EB] text-[#6B7280]',
  pickup:            'bg-blue-50 text-blue-700',
  bb:                'bg-yellow-50 text-yellow-700',
  read_for_centre:   'bg-orange-50 text-orange-700',
  centre:            'bg-purple-50 text-purple-700',
  passover:          'bg-green-50 text-green-700',
};

const ATT_LABELS: Record<string, { label: string; color: string }> = {
  physical:             { label: 'Physical', color: 'bg-green-50 text-green-700' },
  online:               { label: 'Online', color: 'bg-blue-50 text-blue-700' },
  catchup_spiritual:    { label: 'Catchup', color: 'bg-yellow-50 text-yellow-700' },
  catchup_online:       { label: 'Catchup', color: 'bg-yellow-50 text-yellow-700' },
  catchup_friendship:   { label: 'Catchup', color: 'bg-yellow-50 text-yellow-700' },
  catchup_full:         { label: 'Catchup', color: 'bg-yellow-50 text-yellow-700' },
  catchup_bb:           { label: 'Catchup', color: 'bg-yellow-50 text-yellow-700' },
  absent:               { label: 'Absent', color: 'bg-red-50 text-red-600' },
  exempted:             { label: 'Exempted', color: 'bg-[#E5E7EB] text-[#6B7280]' },
};

const DAY_NAMES = ['Mon', 'Tue', 'Thu', 'Fri'];

// ── Nav tabs ─────────────────────────────────────────────────────────────────

type Tab = 'home' | 'announcements' | 'videos' | 'fruits' | 'attendance' | 'contributions';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home',          label: 'Home',           icon: <Home size={18} /> },
  { id: 'announcements', label: 'Announcements',  icon: <Megaphone size={18} /> },
  { id: 'videos',        label: 'Service Videos', icon: <PlayCircle size={18} /> },
  { id: 'fruits',        label: 'My Fruits',      icon: <TrendingUp size={18} /> },
  { id: 'attendance',    label: 'Attendance',     icon: <ClipboardCheck size={18} /> },
  { id: 'contributions', label: 'Contributions',  icon: <Wallet size={18} /> },
];

// ── Main component ───────────────────────────────────────────────────────────

const MemberHomePage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [weekStart, setWeekStart] = useState(getCurrentWeekMonday);
  const [toggling, setToggling] = useState<string | null>(null); // date being toggled

  const memberId = user?.memberId ?? '';

  const { data: announcements, loading: annLoading } = useAnnouncements();
  const { data: dbData, loading: dbLoading, refetch: refetchDb } = useDailyBread({ memberId, weekStart });
  const { data: fruits, loading: fruitsLoading } = useEvangelism({ linkedMemberId: memberId });
  const { data: attData, loading: attLoading } = useAttendance({ memberId });
  const { data: contribData, loading: contribLoading } = useContributions({ memberId: memberId || undefined });

  // ── Stats for Home tab ──────────────────────────────────────────────────
  const attRecords  = attData ?? [];
  const present     = attRecords.filter(a => a.attendance_type === 'physical' || a.attendance_type === 'online').length;
  const nonExempt   = attRecords.filter(a => a.attendance_type !== 'exempted').length;
  const attPct      = nonExempt > 0 ? Math.round((present / nonExempt) * 100) : 0;

  const dbAll       = dbData ?? [];
  const dbWatched   = dbAll.filter(d => d.watched).length;
  const dbPct       = dbAll.length > 0 ? Math.round((dbWatched / dbAll.length) * 100) : 0;

  const myFruits    = fruits ?? [];
  const latestFruit = myFruits[0];

  // ── Service video toggle ────────────────────────────────────────────────
  const toggleDailyBread = useCallback(async (date: string) => {
    if (!memberId || toggling) return;
    setToggling(date);
    try {
      const existing = dbData?.find(d => d.date === date);
      if (existing) {
        await supabase
          .from('daily_bread')
          .update({ watched: !existing.watched })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_bread')
          .insert({ member_id: memberId, date, watched: true });
      }
      await refetchDb();
    } finally {
      setToggling(null);
    }
  }, [memberId, dbData, toggling, refetchDb]);

  // ── Week dates ──────────────────────────────────────────────────────────
  const weekDates = getWeekDayDates(weekStart);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-[#F9FAFB] pt-4 pb-0 z-10">
        <div className="flex gap-1 overflow-x-auto border-b border-[#E5E7EB] pb-0 no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-heading whitespace-nowrap
                border-b-2 transition-colors flex-shrink-0
                ${tab === t.id
                  ? 'border-[#de3163] text-black'
                  : 'border-transparent text-[#6B7280] hover:text-black'}
              `}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HOME ─────────────────────────────────────────────────────── */}
      {tab === 'home' && (
        <div className="pt-6 space-y-6">
          <div>
            <p className="font-body text-[14px] text-[#6B7280]">{greeting},</p>
            <h1 className="font-heading text-[26px] font-bold text-black mt-0.5">
              {user?.name?.split(' ')[0]}
            </h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Attendance',    value: `${attPct}%`,   sub: `${present} of ${nonExempt} services` },
              { label: 'Service Videos',value: `${dbPct}%`,    sub: `${dbWatched} of ${dbAll.length} watched` },
              { label: 'Fruits Stage',  value: latestFruit?.stage ?? 'None', sub: latestFruit?.prospect_name ?? 'No prospects yet' },
              { label: 'Department',    value: user?.department ?? '—', sub: `Cell: ${user?.cell ?? '—'}` },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-[10px] border border-[#E5E7EB] p-4">
                <p className="font-heading text-[10px] uppercase tracking-wide text-[#9CA3AF] mb-1">{c.label}</p>
                <p className="font-heading text-[22px] font-bold text-black">{c.value}</p>
                <p className="font-body text-[12px] text-[#6B7280] mt-0.5 truncate">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Latest announcement */}
          {announcements?.[0] && (
            <div>
              <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
                Latest Announcement
              </p>
              <button
                onClick={() => setTab('announcements')}
                className="w-full text-left bg-white border border-[#E5E7EB] rounded-[10px] p-4 hover:border-[#de3163] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading text-[14px] font-semibold text-black">{announcements[0].title}</p>
                  <span className="font-body text-[11px] text-[#9CA3AF] flex-shrink-0">
                    {timeAgo(announcements[0].created_at)}
                  </span>
                </div>
                <p className="font-body text-[13px] text-[#6B7280] mt-1 line-clamp-2">
                  {announcements[0].body}
                </p>
              </button>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Mark Service Watched', tab: 'videos' as Tab, icon: <PlayCircle size={16} />, accent: true },
                { label: 'View Attendance',       tab: 'attendance' as Tab, icon: <ClipboardCheck size={16} />, accent: false },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => setTab(a.tab)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-[10px] font-heading text-[13px] font-semibold
                    border transition-colors text-left
                    ${a.accent
                      ? 'bg-[#de3163] text-white border-transparent hover:opacity-90'
                      : 'bg-white text-black border-[#E5E7EB] hover:border-[#de3163]'}
                  `}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENTS ────────────────────────────────────────────── */}
      {tab === 'announcements' && (
        <div className="pt-6 space-y-3">
          <h2 className="font-heading text-[18px] font-bold text-black">Announcements</h2>
          {annLoading && <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">Loading…</p>}
          {!annLoading && (announcements ?? []).length === 0 && (
            <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">No announcements yet.</p>
          )}
          {(announcements ?? []).map(a => (
            <div key={a.id} className="bg-white border border-[#E5E7EB] rounded-[10px] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-heading text-[14px] font-semibold text-black">{a.title}</p>
                <span className="font-body text-[11px] text-[#9CA3AF] flex-shrink-0">{timeAgo(a.created_at)}</span>
              </div>
              <p className="font-body text-[13px] text-[#374151] leading-relaxed">{a.body}</p>
              <p className="font-body text-[11px] text-[#9CA3AF] mt-2">
                {a.author_name} · {a.recipient_group === 'all' ? 'All members' : a.recipient_group}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── SERVICE VIDEOS ───────────────────────────────────────────── */}
      {tab === 'videos' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[18px] font-bold text-black">Service Videos</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekStart(w => addWeeks(w, -1))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-body text-[12px] text-[#6B7280] w-24 text-center">
                {fmt(weekDates[0])}
              </span>
              <button
                onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E5E7EB] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <p className="font-body text-[13px] text-[#6B7280]">
            Tap a day to mark your service video as watched.
          </p>

          {dbLoading ? (
            <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">Loading…</p>
          ) : (
            <div className="space-y-2">
              {weekDates.map((date, i) => {
                const record  = dbData?.find(d => d.date === date);
                const watched = record?.watched ?? false;
                const isToday = date === new Date().toISOString().split('T')[0];
                const busy    = toggling === date;

                return (
                  <button
                    key={date}
                    onClick={() => toggleDailyBread(date)}
                    disabled={busy}
                    className={`
                      w-full flex items-center justify-between px-4 py-4 rounded-[10px] border transition-all
                      ${watched
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-[#E5E7EB] hover:border-[#de3163]'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {busy
                        ? <Loader2 size={20} className="animate-spin text-[#6B7280]" />
                        : watched
                          ? <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                          : <Circle size={20} className="text-[#D1D5DB] flex-shrink-0" />
                      }
                      <div className="text-left">
                        <span className="font-heading text-[14px] font-semibold text-black">
                          {DAY_NAMES[i]}
                        </span>
                        {isToday && (
                          <span className="ml-2 text-[10px] font-heading font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#de3163]/10 text-[#de3163]">
                            Today
                          </span>
                        )}
                        <p className="font-body text-[12px] text-[#6B7280]">{fmt(date)}</p>
                      </div>
                    </div>
                    <span className={`font-heading text-[12px] font-semibold ${watched ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                      {watched ? 'Watched' : 'Not watched'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Week summary */}
          {!dbLoading && (
            <div className="bg-white border border-[#E5E7EB] rounded-[10px] px-4 py-3 flex items-center justify-between">
              <span className="font-heading text-[13px] text-[#6B7280]">This week</span>
              <span className="font-heading text-[14px] font-bold text-black">
                {(dbData ?? []).filter(d => d.watched && weekDates.includes(d.date)).length} / 4 watched
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MY FRUITS ────────────────────────────────────────────────── */}
      {tab === 'fruits' && (
        <div className="pt-6 space-y-4">
          <h2 className="font-heading text-[18px] font-bold text-black">My Fruits</h2>
          <p className="font-body text-[13px] text-[#6B7280]">
            Prospects you are responsible for bringing to the church.
          </p>

          {fruitsLoading && <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">Loading…</p>}

          {!fruitsLoading && myFruits.length === 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 text-center">
              <TrendingUp size={28} className="mx-auto text-[#D1D5DB] mb-3" />
              <p className="font-heading text-[14px] font-semibold text-black mb-1">No prospects yet</p>
              <p className="font-body text-[13px] text-[#6B7280]">
                Speak to your HJN to register a new prospect in your name.
              </p>
            </div>
          )}

          {myFruits.map(p => {
            const daysInStage = Math.floor(
              (Date.now() - new Date(p.stage_entered_date).getTime()) / 86400000
            );
            return (
              <div key={p.id} className="bg-white border border-[#E5E7EB] rounded-[10px] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-heading text-[15px] font-semibold text-black">{p.prospect_name}</p>
                  <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STAGE_COLORS[p.stage] ?? 'bg-[#E5E7EB] text-[#6B7280]'}`}>
                    {p.stage.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="font-body text-[12px] text-[#9CA3AF]">
                  {daysInStage} day{daysInStage !== 1 ? 's' : ''} in this stage
                  {p.stage_entered_date ? ` · Since ${fmt(p.stage_entered_date)}` : ''}
                </p>
                {p.notes && (
                  <p className="font-body text-[13px] text-[#6B7280] mt-2 italic">{p.notes}</p>
                )}
                <p className="font-body text-[11px] text-[#9CA3AF] mt-2">
                  Contact your HJN or cell leader to update this prospect's stage.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ATTENDANCE ───────────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[18px] font-bold text-black">My Attendance</h2>
            <span className="font-heading text-[14px] font-bold text-black">{attPct}%</span>
          </div>

          {/* Summary bar */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] px-4 py-3">
            <div className="w-full h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#de3163] transition-all"
                style={{ width: `${attPct}%` }}
              />
            </div>
            <p className="font-body text-[12px] text-[#6B7280] mt-2">
              {present} present · {nonExempt - present} absent · {attRecords.filter(a => a.attendance_type === 'exempted').length} exempted
            </p>
          </div>

          {attLoading && <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">Loading…</p>}
          {!attLoading && attRecords.length === 0 && (
            <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">No attendance records yet.</p>
          )}

          <div className="space-y-2">
            {attRecords.slice(0, 30).map(a => {
              const meta = ATT_LABELS[a.attendance_type] ?? { label: a.attendance_type, color: 'bg-[#E5E7EB] text-[#6B7280]' };
              return (
                <div key={a.id} className="bg-white border border-[#E5E7EB] rounded-[10px] px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-heading text-[13px] font-semibold text-black">{fmt(a.service_date)}</p>
                    <p className="font-body text-[11px] text-[#9CA3AF] mt-0.5">
                      {a.service_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>

          {attRecords.length > 30 && (
            <p className="font-body text-[12px] text-[#9CA3AF] text-center">
              Showing 30 most recent records
            </p>
          )}
        </div>
      )}

      {/* ── MY CONTRIBUTIONS ─────────────────────────────────────────── */}
      {tab === 'contributions' && (() => {
        const fmtZAR = (n: number) =>
          new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n);
        const fmtMon = (iso: string) =>
          new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

        const records = contribData ?? [];
        // Monthly summaries
        const monthMap: Record<string, number> = {};
        for (const c of records) {
          if (c.status === 'rejected') continue;
          monthMap[c.contribution_month] = (monthMap[c.contribution_month] ?? 0) + c.amount;
        }
        const months = Object.entries(monthMap)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 3);

        const provisional = records.filter(c => c.status === 'provisional');
        const rejected    = records.filter(c => c.status === 'rejected');

        return (
          <div className="pt-6 space-y-5">
            <h2 className="font-heading text-[18px] font-bold text-black">My Contributions</h2>

            {/* Provisional / rejected alerts */}
            {provisional.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-[10px] px-4 py-3">
                <p className="font-heading text-[13px] font-semibold text-yellow-700">
                  {provisional.length} pending confirmation
                </p>
                <p className="font-body text-[12px] text-yellow-600 mt-0.5">
                  Your Finance team will verify these records.
                </p>
              </div>
            )}
            {rejected.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
                <p className="font-heading text-[13px] font-semibold text-red-700">
                  {rejected.length} record{rejected.length > 1 ? 's were' : ' was'} rejected
                </p>
                {rejected[0].provisional_rejection_reason && (
                  <p className="font-body text-[12px] text-red-600 mt-0.5">
                    "{rejected[0].provisional_rejection_reason}"
                  </p>
                )}
              </div>
            )}

            {/* Monthly summary cards */}
            {months.length > 0 && (
              <div>
                <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
                  Monthly Summary
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {months.map(([month, total]) => (
                    <div key={month} className="bg-white border border-[#E5E7EB] rounded-[10px] p-3">
                      <p className="font-body text-[10px] text-[#9CA3AF] mb-1">{fmtMon(month)}</p>
                      <p className="font-heading text-[16px] font-bold text-black">{fmtZAR(total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contribution history */}
            <div>
              <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
                History
              </p>
              {contribLoading && (
                <p className="font-body text-[13px] text-[#6B7280] py-6 text-center">Loading…</p>
              )}
              {!contribLoading && records.length === 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 text-center">
                  <Wallet size={28} className="mx-auto text-[#D1D5DB] mb-3" />
                  <p className="font-body text-[13px] text-[#6B7280]">No contribution records yet.</p>
                </div>
              )}
              <div className="space-y-2">
                {records.slice(0, 20).map(c => {
                  const badgeCls =
                    c.status === 'confirmed'   ? 'bg-green-50 text-green-700' :
                    c.status === 'provisional' ? 'bg-yellow-50 text-yellow-700' :
                                                 'bg-red-50 text-red-600';
                  return (
                    <div key={c.id} className="bg-white border border-[#E5E7EB] rounded-[10px] px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-heading text-[13px] font-semibold text-black">
                          {c.contribution_type_name}
                        </p>
                        <p className="font-body text-[11px] text-[#9CA3AF] mt-0.5">
                          {new Date(c.payment_date).toLocaleDateString('en-ZA')} · {fmtMon(c.contribution_month)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-[14px] font-semibold text-black">{fmtZAR(c.amount)}</p>
                        <span className={`text-[10px] font-heading font-semibold px-1.5 py-0.5 rounded ${badgeCls}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default MemberHomePage;
