import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { supabase } from '@/lib/supabase';
import { Megaphone, Plus, Check, Send, X, Loader2, ChevronDown, Globe, Building2, Users } from 'lucide-react';

type Scope = 'church_wide' | 'department' | 'cell';

const DEPARTMENTS = ['MG', 'WG', 'YG', 'SNG', 'STUDENTS'] as const;

const scopeLabel: Record<Scope, string> = {
  church_wide: 'Church-wide',
  department:  'Specific Department',
  cell:        'Specific Cell',
};

const scopeIcon: Record<Scope, React.ReactNode> = {
  church_wide: <Globe size={14} />,
  department:  <Building2 size={14} />,
  cell:        <Users size={14} />,
};

const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, refetch } = useAnnouncements();
  const canCreate = user?.role === 'GSN' || user?.role === 'SMN';

  // ── Create form state ────────────────────────────────────────────────────────
  const [showForm, setShowForm]   = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody]   = useState('');
  const [formScope, setFormScope] = useState<Scope>('church_wide');
  const [formDept, setFormDept]   = useState<string>(DEPARTMENTS[0]);
  const [formCell, setFormCell]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  // ── Read counts (live, seeded from fetched data) ─────────────────────────────
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [myReads,    setMyReads]    = useState<Set<string>>(new Set());
  const [markingId,  setMarkingId]  = useState<string | null>(null);

  // Seed counts from initial fetch
  useEffect(() => {
    if (!data) return;
    setReadCounts(prev => {
      const next = { ...prev };
      data.forEach(a => { if (!(a.id in next)) next[a.id] = a.read_count; });
      return next;
    });
  }, [data]);

  // Fetch which announcements this member has already read
  useEffect(() => {
    if (!user?.memberId) return;
    supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('member_id', user.memberId)
      .then(({ data: reads }) => {
        setMyReads(new Set((reads ?? []).map((r: { announcement_id: string }) => r.announcement_id)));
      });
  }, [user?.memberId]);

  // Realtime subscription on announcement_reads
  useEffect(() => {
    const channel = supabase
      .channel('realtime:ann_reads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcement_reads' },
        (payload) => {
          const annId = (payload.new as { announcement_id: string }).announcement_id;
          setReadCounts(prev => ({ ...prev, [annId]: (prev[annId] ?? 0) + 1 }));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.memberId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const recipientGroup =
        formScope === 'church_wide' ? 'all' :
        formScope === 'department'  ? formDept :
        formCell;

      const { data: inserted, error: insertErr } = await supabase
        .from('announcements')
        .insert({
          title:           formTitle,
          body:            formBody,
          created_by:      user.memberId,
          recipient_group: recipientGroup,
          scope:           formScope,
          department:      formScope === 'department' ? formDept : null,
          cell:            formScope === 'cell' ? formCell : null,
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      // Invoke Telegram send function
      const { data: fnResult, error: fnErr } = await supabase.functions.invoke('send-announcement', {
        body: {
          announcement_id: inserted.id,
          title:           formTitle,
          body:            formBody,
          recipient_group: formScope,
          department:      formScope === 'department' ? formDept : null,
          cell:            formScope === 'cell' ? formCell : null,
          sent_by_name:    user.name,
        },
      });

      if (fnErr) {
        console.warn('Telegram send warning:', fnErr);
      } else if (fnResult && !fnResult.sent) {
        console.info('Announcement created. Telegram note:', fnResult.message ?? 'No chats matched.');
      }

      setFormTitle('');
      setFormBody('');
      setFormScope('church_wide');
      setFormCell('');
      setShowForm(false);
      refetch();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (announcementId: string) => {
    if (!user?.memberId || myReads.has(announcementId)) return;
    setMarkingId(announcementId);
    try {
      const { error } = await supabase
        .from('announcement_reads')
        .insert({ announcement_id: announcementId, member_id: user.memberId });
      if (!error) {
        setMyReads(prev => new Set([...prev, announcementId]));
      }
    } finally {
      setMarkingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Announcements</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{(data ?? []).length} announcements</p>
        </div>
        {canCreate && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Create Announcement
          </button>
        )}
      </div>

      {/* ── Create form ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-foreground">New Announcement</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Title */}
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                required
                placeholder="Announcement title"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {/* Body */}
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Message</label>
              <textarea
                value={formBody}
                onChange={e => setFormBody(e.target.value)}
                required
                rows={4}
                placeholder="Write your announcement…"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
            {/* Scope */}
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Recipients</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(['church_wide', 'department', 'cell'] as Scope[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormScope(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-heading font-medium border transition-colors ${
                      formScope === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {scopeIcon[s]} {scopeLabel[s]}
                  </button>
                ))}
              </div>

              {formScope === 'department' && (
                <div className="relative max-w-xs">
                  <select
                    value={formDept}
                    onChange={e => setFormDept(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              )}

              {formScope === 'cell' && (
                <input
                  type="text"
                  value={formCell}
                  onChange={e => setFormCell(e.target.value)}
                  required
                  placeholder="Cell name (e.g. Alpha Cell)"
                  className="max-w-xs w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              )}
            </div>

            {formError && <p className="text-destructive font-body text-sm">{formError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Sending…' : 'Create & Send'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-border text-muted-foreground font-heading text-sm font-medium hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Announcement list ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          {(data ?? []).map(a => {
            const alreadyRead = myReads.has(a.id);
            const liveCount   = readCounts[a.id] ?? a.read_count;

            return (
              <div key={a.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground">{a.title}</h3>
                      <p className="text-xs text-muted-foreground font-body">
                        {a.author_name} · {new Date(a.created_at).toLocaleDateString('en-ZA')}
                        {' · '}
                        {a.scope === 'department' && a.department
                          ? `${a.department} only`
                          : a.scope === 'cell' && a.cell
                          ? `${a.cell} only`
                          : 'All members'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.telegram_sent ? (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-success/10 text-success font-medium">
                        <Send size={10} /> Sent
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">
                        Not sent
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-body text-sm text-foreground/80 mb-3">{a.body}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                    <Check size={12} />
                    <span>{liveCount} read</span>
                  </div>
                  {user && !canCreate && (
                    alreadyRead ? (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-success/10 text-success font-medium">
                        <Check size={10} /> Read
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkRead(a.id)}
                        disabled={markingId === a.id}
                        className="flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-lg bg-primary/10 text-primary font-heading font-medium hover:bg-primary/20 disabled:opacity-60 transition-colors"
                      >
                        {markingId === a.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <Check size={11} />}
                        Mark as read
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}

          {!loading && (data ?? []).length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Megaphone size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No announcements yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
