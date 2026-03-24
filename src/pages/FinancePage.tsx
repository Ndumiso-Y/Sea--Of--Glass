import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContributions } from '@/hooks/useContributions';
import { useContributionTypes } from '@/hooks/useContributionTypes';
import { useMembers } from '@/hooks/useMembers';
import { supabase } from '@/lib/supabase';
import {
  Wallet, Plus, Check, X, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, Star, ChevronDown,
} from 'lucide-react';

// ── Finance ministry seed UUID
const FINANCE_MINISTRY_ID = '00000000-0000-0000-0001-000000000002';

const DEPARTMENTS = ['MG', 'WG', 'YG', 'SNG'] as const;

// Standard (non-special) type names for overview table columns
const OVERVIEW_TYPES = ['Tithe', 'Construction', 'Missions', 'Thanksgiving Offering', 'Service Offering'] as const;

// ── Banking cutoff helpers (mirrors PostgreSQL get_contribution_month) ─────────
function getLastFriday(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const dow = lastDay.getDay();
  return new Date(year, month, lastDay.getDate() - ((dow - 5 + 7) % 7));
}

export function previewContributionMonth(paymentDateStr: string): { label: string; isNextMonth: boolean } {
  if (!paymentDateStr) return { label: '—', isNextMonth: false };
  const [y, m, d] = paymentDateStr.split('-').map(Number);
  const payment    = new Date(y, m - 1, d);
  const lastFriday = getLastFriday(y, m - 1);
  const isNext     = payment > lastFriday;
  const cm         = isNext ? new Date(y, m, 1) : new Date(y, m - 1, 1);
  return {
    label: cm.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
    isNextMonth: isNext,
  };
}

// ── Currency formatting ────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n);

const fmtMonth = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = {
    confirmed:   { cls: 'bg-success/10 text-success',      label: 'Confirmed' },
    provisional: { cls: 'bg-warning/10 text-warning',      label: 'Provisional' },
    rejected:    { cls: 'bg-destructive/10 text-destructive', label: 'Rejected' },
  }[status] ?? { cls: 'bg-muted text-muted-foreground', label: status };
  return (
    <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD CONTRIBUTION MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface AddFormProps {
  onClose: () => void;
  onSaved: () => void;
  capturedBy: string;
  userDept?: string;
}

const AddContributionModal: React.FC<AddFormProps> = ({ onClose, onSaved, capturedBy, userDept }) => {
  const { data: members }  = useMembers();
  const { data: types }    = useContributionTypes();
  const { addContribution }= useContributions();

  const [memberId,   setMemberId]   = useState('');
  const [typeId,     setTypeId]     = useState('');
  const [amount,     setAmount]     = useState('');
  const [payDate,    setPayDate]    = useState('');
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState<string | null>(null);

  const selectedMember = (members ?? []).find(m => m.id === memberId);
  const preview        = previewContributionMonth(payDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !typeId || !amount || !payDate) return;
    setSaving(true);
    setErr(null);
    try {
      await addContribution({
        member_id: memberId,
        contribution_type_id: typeId,
        amount: parseFloat(amount),
        payment_date: payDate,
        department: selectedMember?.department ?? userDept ?? '',
        notes: notes || undefined,
        captured_by: capturedBy,
        status: 'confirmed',
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading text-base font-semibold text-foreground">Add Contribution</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Member */}
          <div>
            <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Member</label>
            <div className="relative">
              <select
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 pr-8 rounded-lg border border-input bg-background text-foreground font-body text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select member…</option>
                {(members ?? []).map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Contribution Type</label>
            <div className="relative">
              <select
                value={typeId}
                onChange={e => setTypeId(e.target.value)}
                required
                className="w-full px-3 py-2 pr-8 rounded-lg border border-input bg-background text-foreground font-body text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select type…</option>
                {(types ?? []).filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>{t.is_special ? '★ ' : ''}{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Amount (ZAR)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              placeholder="e.g. 1500"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Payment date */}
          <div>
            <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Payment Date</label>
            <input
              type="date"
              value={payDate}
              onChange={e => setPayDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {payDate && (
              <div className={`mt-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                preview.isNextMonth
                  ? 'bg-warning/10 text-warning'
                  : 'bg-success/10 text-success'
              }`}>
                {preview.isNextMonth
                  ? <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  : <Check size={13} className="mt-0.5 flex-shrink-0" />}
                <span>
                  {preview.isNextMonth
                    ? `Payment date is after the banking cutoff. This will be assigned to ${preview.label}.`
                    : `This will count for: ${preview.label}.`}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {err && <p className="text-destructive text-sm font-body">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground font-heading text-sm font-medium hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REJECT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const RejectModal: React.FC<{
  onConfirm: (reason: string) => void;
  onClose: () => void;
}> = ({ onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-sm shadow-lg p-5">
        <h3 className="font-heading text-base font-semibold text-foreground mb-3">Reject Provisional</h3>
        <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for rejection…"
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 py-2 bg-destructive text-white rounded-lg font-heading text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Reject
          </button>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground font-heading text-sm font-medium hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SPECIAL OFFERING MODAL
// ─────────────────────────────────────────────────────────────────────────────
const CreateSpecialModal: React.FC<{
  onClose: () => void;
  onSaved: () => void;
  createdBy: string;
}> = ({ onClose, onSaved, createdBy }) => {
  const { createType } = useContributionTypes();
  const [form, setForm] = useState({
    name: '', description: '', target_amount: '', start_date: '', end_date: '',
    departments: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleDept = (d: string) =>
    setForm(f => ({
      ...f,
      departments: f.departments.includes(d) ? f.departments.filter(x => x !== d) : [...f.departments, d],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      // Insert contribution_type
      const { data: ct, error: ctErr } = await supabase
        .from('contribution_types')
        .insert({
          name:          form.name,
          description:   form.description || null,
          is_special:    true,
          target_amount: form.target_amount ? parseFloat(form.target_amount) : null,
          start_date:    form.start_date || null,
          end_date:      form.end_date || null,
          is_active:     true,
          created_by:    createdBy,
        })
        .select('id')
        .single();
      if (ctErr) throw ctErr;

      // Insert special_offering_access for each selected dept
      if (form.departments.length > 0) {
        const { error: soaErr } = await supabase
          .from('special_offering_access')
          .insert(form.departments.map(d => ({ contribution_type_id: ct.id, department: d })));
        if (soaErr) throw soaErr;
      }

      onSaved();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading text-base font-semibold text-foreground">New Special Offering</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[
            { key: 'name', label: 'Name', placeholder: 'e.g. Building Fund 2026', required: true },
            { key: 'description', label: 'Description', placeholder: 'Campaign description', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">{f.label}</label>
              <input
                type="text"
                value={(form as any)[f.key]}
                onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                required={f.required}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Target (ZAR)</label>
              <input type="number" min="0" value={form.target_amount}
                onChange={e => setForm(x => ({ ...x, target_amount: e.target.value }))}
                placeholder="200000"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div></div>
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Start Date</label>
              <input type="date" value={form.start_date}
                onChange={e => setForm(x => ({ ...x, start_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">End Date</label>
              <input type="date" value={form.end_date}
                onChange={e => setForm(x => ({ ...x, end_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="font-heading text-sm font-medium text-foreground block mb-2">Visible to Departments</label>
            <div className="flex gap-2 flex-wrap">
              {DEPARTMENTS.map(d => (
                <button key={d} type="button"
                  onClick={() => toggleDept(d)}
                  className={`px-3 py-1 rounded-lg text-sm font-heading font-medium border transition-colors ${
                    form.departments.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'
                  }`}
                >{d}</button>
              ))}
            </div>
          </div>
          {err && <p className="text-destructive text-sm font-body">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground font-heading text-sm font-medium hover:text-foreground"
            >Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE PAGE
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'contributions' | 'provisional' | 'special';

const FinancePage: React.FC = () => {
  const { user }       = useAuth();
  const isGSN          = user?.role === 'GSN';
  const isFinanceTeam  = user?.ministry_id === FINANCE_MINISTRY_ID;
  const canSeeAll      = isGSN || isFinanceTeam;
  const isHJN          = user?.role === 'HJN';

  // ── Month navigator ──────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const monthIso = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  const prevMonthIso = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;

  const navMonth = (dir: -1 | 1) => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + dir, 1));

  // ── Active tab ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>(canSeeAll ? 'overview' : 'contributions');

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showAdd,    setShowAdd]    = useState(false);
  const [showSpecial,setShowSpecial]= useState(false);
  const [rejectId,   setRejectId]   = useState<string | null>(null);

  // ── Filters for Member Contributions tab ────────────────────────────────────
  const [filterDept,   setFilterDept]   = useState(isHJN ? (user?.department ?? '') : '');
  const [filterType,   setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');

  // ── Data hooks ───────────────────────────────────────────────────────────────
  const overviewFilter = canSeeAll
    ? { month: monthIso }
    : { month: monthIso, department: user?.department };

  const prevOverviewFilter = canSeeAll
    ? { month: prevMonthIso }
    : { month: prevMonthIso, department: user?.department };

  const { data: overviewData,  loading: ovLoading }  = useContributions(overviewFilter);
  const { data: prevData }                            = useContributions(prevOverviewFilter);
  const { data: provData,      refetch: provRefetch } = useContributions({ status: 'provisional' });
  const { data: contribData,   loading: cLoading, refetch: cRefetch, confirmProvisional, rejectProvisional } = useContributions({
    month:              filterMonth || undefined,
    department:         filterDept  || undefined,
    contributionTypeId: filterType  || undefined,
    status:             filterStatus|| undefined,
    memberId:           (!canSeeAll && !isHJN) ? user?.memberId : undefined,
  });
  const { data: types, refetch: typesRefetch } = useContributionTypes();
  const specialTypes = useMemo(() => (types ?? []).filter(t => t.is_special && t.is_active), [types]);

  // ── Overview aggregation ─────────────────────────────────────────────────────
  const sumByTypeDept = (rows: typeof overviewData) => {
    const acc: Record<string, Record<string, number>> = {};
    for (const r of rows ?? []) {
      if (r.status === 'rejected') continue;
      if (!acc[r.contribution_type_name]) acc[r.contribution_type_name] = {};
      acc[r.contribution_type_name][r.department] =
        (acc[r.contribution_type_name][r.department] ?? 0) + r.amount;
    }
    return acc;
  };

  const currAgg  = useMemo(() => sumByTypeDept(overviewData), [overviewData]);
  const prevAgg  = useMemo(() => sumByTypeDept(prevData),    [prevData]);

  const totalByType = (agg: typeof currAgg, typeName: string) =>
    Object.values(agg[typeName] ?? {}).reduce((s, v) => s + v, 0);

  const deptTotal = (agg: typeof currAgg, dept: string) =>
    Object.values(agg).reduce((s, byDept) => s + (byDept[dept] ?? 0), 0);

  const grandTotal = (agg: typeof currAgg) =>
    DEPARTMENTS.reduce((s, d) => s + deptTotal(agg, d), 0);

  // ── Special offering totals ──────────────────────────────────────────────────
  const { data: allContrib } = useContributions({});
  const specialTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const c of allContrib ?? []) {
      if (!c.is_special || c.status === 'rejected') continue;
      totals[c.contribution_type_id] = (totals[c.contribution_type_id] ?? 0) + c.amount;
    }
    return totals;
  }, [allContrib]);

  const specialByMember = (typeId: string) =>
    (allContrib ?? []).filter(c => c.contribution_type_id === typeId && c.status !== 'rejected');

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleConfirm = async (id: string) => {
    if (!user?.memberId) return;
    await confirmProvisional(id, user.memberId);
    provRefetch();
  };

  const handleReject = async (reason: string) => {
    if (!rejectId || !user?.memberId) return;
    await rejectProvisional(rejectId, user.memberId, reason);
    setRejectId(null);
    provRefetch();
  };

  const tabs: { key: Tab; label: string }[] = [
    ...(canSeeAll ? [{ key: 'overview'      as Tab, label: 'Overview' }] : []),
    { key: 'contributions' as Tab, label: 'Member Contributions' },
    ...(canSeeAll ? [{ key: 'provisional'   as Tab, label: `Provisional${(provData ?? []).length ? ` (${(provData ?? []).length})` : ''}` }] : []),
    ...(canSeeAll || isHJN ? [{ key: 'special' as Tab, label: 'Special Offerings' }] : []),
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Contributions</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Tithe & Offering tracking</p>
        </div>
        {canSeeAll && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:opacity-90"
          >
            <Plus size={16} /> Add Contribution
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-heading font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════ TAB 1: OVERVIEW ═════════════════ */}
      {tab === 'overview' && canSeeAll && (
        <div className="space-y-6">
          {/* Month navigator */}
          <div className="flex items-center gap-3">
            <button onClick={() => navMonth(-1)} className="p-1.5 rounded-lg border border-border hover:bg-muted">
              <ChevronLeft size={16} />
            </button>
            <span className="font-heading text-sm font-semibold text-foreground min-w-[140px] text-center">
              {currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navMonth(1)} className="p-1.5 rounded-lg border border-border hover:bg-muted">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Metric cards */}
          {ovLoading ? (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {OVERVIEW_TYPES.map(typeName => {
                  const curr = totalByType(currAgg, typeName);
                  const prev = totalByType(prevAgg, typeName);
                  const diff = curr - prev;
                  return (
                    <div key={typeName} className="bg-card rounded-xl border border-border p-4">
                      <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{typeName}</p>
                      <p className="font-heading text-lg font-bold text-foreground">{fmt(curr)}</p>
                      <p className={`font-body text-[11px] mt-0.5 ${diff >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {diff >= 0 ? '+' : ''}{fmt(diff)} vs prev
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Department breakdown table */}
              <div className="bg-card rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Department</th>
                      {OVERVIEW_TYPES.map(t => (
                        <th key={t} className="text-right py-3 px-3 text-muted-foreground font-medium text-xs whitespace-nowrap">{t}</th>
                      ))}
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEPARTMENTS.map(dept => (
                      <tr key={dept} className="border-b border-border/50">
                        <td className="py-3 px-4 font-heading font-medium text-foreground">{dept}</td>
                        {OVERVIEW_TYPES.map(typeName => (
                          <td key={typeName} className="py-3 px-3 text-right text-muted-foreground">
                            {fmt(currAgg[typeName]?.[dept] ?? 0)}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right font-semibold text-foreground">
                          {fmt(deptTotal(currAgg, dept))}
                        </td>
                      </tr>
                    ))}
                    {/* Grand total row */}
                    <tr className="bg-muted/50 font-semibold">
                      <td className="py-3 px-4 font-heading text-foreground">Grand Total</td>
                      {OVERVIEW_TYPES.map(typeName => (
                        <td key={typeName} className="py-3 px-3 text-right text-foreground">
                          {fmt(totalByType(currAgg, typeName))}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right text-primary font-bold">
                        {fmt(grandTotal(currAgg))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════ TAB 2: MEMBER CONTRIBUTIONS ════════════ */}
      {tab === 'contributions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <input
              type="month"
              value={filterMonth ? filterMonth.slice(0, 7) : ''}
              onChange={e => setFilterMonth(e.target.value ? e.target.value + '-01' : '')}
              className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {canSeeAll && (
              <div className="relative">
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="px-3 py-1.5 pr-8 rounded-lg border border-input bg-background text-foreground font-body text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">All departments</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            )}
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 pr-8 rounded-lg border border-input bg-background text-foreground font-body text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">All types</option>
                {(types ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 pr-8 rounded-lg border border-input bg-background text-foreground font-body text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="provisional">Provisional</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {cLoading ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading…</div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs">Member</th>
                    {(canSeeAll || isHJN) && <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs hidden sm:table-cell">Dept</th>}
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Type</th>
                    <th className="text-right py-3 px-3 text-muted-foreground font-medium text-xs">Amount</th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs hidden md:table-cell">Payment Date</th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs hidden lg:table-cell">Counts For</th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(contribData ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No records found</td></tr>
                  ) : (
                    (contribData ?? []).map(c => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">{c.member_name}</td>
                        {(canSeeAll || isHJN) && (
                          <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">{c.department}</td>
                        )}
                        <td className="py-3 px-3 text-foreground">
                          {c.is_special && <Star size={11} className="inline mr-1 text-warning" />}
                          {c.contribution_type_name}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-foreground">{fmt(c.amount)}</td>
                        <td className="py-3 px-3 text-muted-foreground hidden md:table-cell">
                          {new Date(c.payment_date).toLocaleDateString('en-ZA')}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground hidden lg:table-cell">
                          {fmtMonth(c.contribution_month)}
                        </td>
                        <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ TAB 3: PROVISIONAL ═══════════════════════ */}
      {tab === 'provisional' && canSeeAll && (
        <div className="space-y-3">
          {(provData ?? []).length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Wallet size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No provisional records pending</p>
            </div>
          ) : (
            (provData ?? []).map(c => (
              <div key={c.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-sm font-semibold text-foreground">{c.member_name}</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      {c.contribution_type_name} · {fmt(c.amount)} · {c.department}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      Reported: {new Date(c.payment_date).toLocaleDateString('en-ZA')} · Counts for: {fmtMonth(c.contribution_month)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleConfirm(c.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-heading font-medium hover:opacity-90"
                    >
                      <Check size={13} /> Confirm
                    </button>
                    <button
                      onClick={() => setRejectId(c.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-heading font-medium hover:opacity-90"
                    >
                      <X size={13} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════ TAB 4: SPECIAL OFFERINGS ════════════════ */}
      {tab === 'special' && (
        <div className="space-y-4">
          {canSeeAll && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowSpecial(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:opacity-90"
              >
                <Plus size={16} /> New Special Offering
              </button>
            </div>
          )}

          {specialTypes.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Star size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No special offering campaigns</p>
            </div>
          ) : (
            specialTypes.map(st => {
              const collected = specialTotals[st.id] ?? 0;
              const pct       = st.target_amount ? Math.min(100, Math.round((collected / st.target_amount) * 100)) : null;
              const members   = specialByMember(st.id);
              return (
                <div key={st.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                        <Star size={14} className="text-warning" /> {st.name}
                      </p>
                      {st.description && (
                        <p className="font-body text-xs text-muted-foreground mt-0.5">{st.description}</p>
                      )}
                      {(st.start_date || st.end_date) && (
                        <p className="font-body text-xs text-muted-foreground mt-0.5">
                          {st.start_date && new Date(st.start_date).toLocaleDateString('en-ZA')}
                          {st.start_date && st.end_date && ' → '}
                          {st.end_date && new Date(st.end_date).toLocaleDateString('en-ZA')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-lg font-bold text-foreground">{fmt(collected)}</p>
                      {st.target_amount && (
                        <p className="font-body text-xs text-muted-foreground">of {fmt(st.target_amount)} target</p>
                      )}
                    </div>
                  </div>

                  {pct !== null && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-body text-muted-foreground mb-1">
                        <span>{pct}% raised</span>
                        <span>{fmt(st.target_amount! - collected)} remaining</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {members.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Contributions ({members.length})
                      </p>
                      <div className="space-y-1">
                        {members.slice(0, 5).map(m => (
                          <div key={m.id} className="flex justify-between text-xs font-body">
                            <span className="text-foreground">{m.member_name}</span>
                            <span className="text-muted-foreground">{fmt(m.amount)}</span>
                          </div>
                        ))}
                        {members.length > 5 && (
                          <p className="text-xs text-muted-foreground">+ {members.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showAdd && user?.memberId && (
        <AddContributionModal
          onClose={() => setShowAdd(false)}
          onSaved={cRefetch}
          capturedBy={user.memberId}
          userDept={user.department}
        />
      )}
      {showSpecial && user?.memberId && (
        <CreateSpecialModal
          onClose={() => setShowSpecial(false)}
          onSaved={() => { typesRefetch(); setShowSpecial(false); }}
          createdBy={user.memberId}
        />
      )}
      {rejectId && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setRejectId(null)}
        />
      )}
    </div>
  );
};

export default FinancePage;
