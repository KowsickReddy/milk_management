import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Calculator, User, Plus, Trash2, Calendar,
  Milk, TrendingUp, Share2, Sun
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';
import { Card, Select, Button } from '../ui';
import { motion } from 'framer-motion';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

// ── Helper: utility functions ────────────────────────────────────────────
function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function overlapDays(start, end, month, year) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  const ms = new Date(year, month - 1, 1);
  const me = new Date(year, month - 1, daysInMonth(month, year));
  const os = s < ms ? ms : s;
  const oe = e > me ? me : e;
  if (os > oe) return 0;
  return Math.ceil((oe - os) / (1000 * 60 * 60 * 24)) + 1;
}

function overlapRange(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return 0;
  const s = new Date(Math.max(new Date(aStart), new Date(bStart)));
  const e = new Date(Math.min(new Date(aEnd), new Date(bEnd)));
  if (s > e) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, subtitle, children, onAdd, addLabel }) {
  return (
    <Card className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
          </div>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="h-8 px-3 text-xs">
            <Plus className="w-3.5 h-3.5" /> {addLabel || 'Add'}
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

function EmptyState({ icon: Icon, color, message, sub }) {
  const c = color || 'blue';
  const bgColor = c === 'blue' ? 'bg-blue-50/50' : c === 'amber' ? 'bg-amber-50/50' : c === 'indigo' ? 'bg-indigo-50/50' : 'bg-blue-50/50';
  const borderColor = c === 'blue' ? 'border-blue-200' : c === 'amber' ? 'border-amber-200' : c === 'indigo' ? 'border-indigo-200' : 'border-blue-200';
  const textColor = c === 'blue' ? 'text-blue-300' : c === 'amber' ? 'text-amber-300' : c === 'indigo' ? 'text-indigo-300' : 'text-blue-300';
  return (
    <div className={`text-center py-6 ${bgColor} rounded-2xl border border-dashed ${borderColor}`}>
      <Icon className={`w-8 h-8 mx-auto ${textColor} mb-2`} />
      <p className="text-xs font-semibold text-slate-500">{message}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function PeriodRow({ index, start, end, extraField, extraLabel, extraValue, onUpdate, onDelete, rightLabel, rightValue, color }) {
  const c = color || 'blue';
  const bgRow = c === 'blue' ? 'bg-blue-50/50' : c === 'amber' ? 'bg-amber-50/50' : c === 'indigo' ? 'bg-indigo-50/50' : 'bg-blue-50/50';
  const borderRow = c === 'blue' ? 'border-blue-100' : c === 'amber' ? 'border-amber-100' : c === 'indigo' ? 'border-indigo-100' : 'border-blue-100';
  const bgCircle = c === 'blue' ? 'bg-blue-100' : c === 'amber' ? 'bg-amber-100' : c === 'indigo' ? 'bg-indigo-100' : 'bg-blue-100';
  const textCircle = c === 'blue' ? 'text-blue-700' : c === 'amber' ? 'text-amber-700' : c === 'indigo' ? 'text-indigo-700' : 'text-blue-700';
  const textValue = c === 'blue' ? 'text-blue-700' : c === 'amber' ? 'text-amber-700' : c === 'indigo' ? 'text-indigo-700' : 'text-blue-700';
  const ringColor = c === 'blue' ? 'focus:ring-blue-500/20 focus:border-blue-500' : c === 'amber' ? 'focus:ring-amber-500/20 focus:border-amber-500' : c === 'indigo' ? 'focus:ring-indigo-500/20 focus:border-indigo-500' : 'focus:ring-blue-500/20 focus:border-blue-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 ${bgRow} rounded-xl border ${borderRow}`}
    >
      <div className={`w-7 h-7 rounded-lg ${bgCircle} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-[10px] font-black ${textCircle}`}>{index + 1}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1" style={extraField ? { gridTemplateColumns: '1fr 1fr 80px' } : {}}>
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">From</label>
          <input type="date" value={start} onChange={(e) => onUpdate('start', e.target.value)}
            className={`w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 ${ringColor} transition-all`} />
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">To</label>
          <input type="date" value={end} onChange={(e) => onUpdate('end', e.target.value)}
            className={`w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 ${ringColor} transition-all`} />
        </div>
        {extraField && (
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">{extraLabel || 'L/day'}</label>
            <input type="number" step="0.1" value={extraValue} onChange={(e) => onUpdate(extraField, e.target.value)}
              className={`w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 ${ringColor} transition-all`} placeholder="0.0" />
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0 min-w-[50px]">
        <p className={`text-lg font-black ${textValue}`}>{rightValue || '—'}</p>
        <p className="text-[9px] text-slate-400 font-medium">{rightLabel || 'days'}</p>
      </div>
      <button onClick={onDelete}
        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function MilkCalculator() {
  const [customerName, setCustomerName] = useState('');
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [rate, setRate] = useState('');
  const [defaults, setDefaults] = useState([
    { start: `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-01`,
      end: `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-${daysInMonth(CURRENT_MONTH, CURRENT_YEAR)}`,
      qty: '1.0' }
  ]);
  const [leaves, setLeaves] = useState([]);
  const [extras, setExtras] = useState([]);

  // Per-period calculation: correctly deducts leaves at each period's own rate
  const periodDetails = useMemo(() =>
    defaults.map(d => {
      const periodDays = overlapDays(d.start, d.end, month, year);
      let leaveDeduction = 0;
      leaves.forEach(l => {
        leaveDeduction += overlapRange(d.start, d.end, l.start, l.end);
      });
      const clampedLeave = Math.min(leaveDeduction, periodDays);
      const qty = Number(d.qty || 0);
      return {
        periodDays,
        leaveDeduction: clampedLeave,
        activeDays: Math.max(0, periodDays - clampedLeave),
        qty,
        scheduledMilk: periodDays * qty,
        milk: Math.max(0, periodDays - clampedLeave) * qty,
      };
    }),
    [defaults, leaves, month, year]
  );

  const totalScheduledDays = useMemo(() =>
    periodDetails.reduce((s, p) => s + p.periodDays, 0),
    [periodDetails]
  );

  const totalScheduledMilk = useMemo(() =>
    periodDetails.reduce((s, p) => s + p.scheduledMilk, 0),
    [periodDetails]
  );

  const totalLeaveDays = useMemo(() =>
    periodDetails.reduce((s, p) => s + p.leaveDeduction, 0),
    [periodDetails]
  );

  const activeDays = useMemo(() =>
    periodDetails.reduce((s, p) => s + p.activeDays, 0),
    [periodDetails]
  );

  const baseMilk = useMemo(() =>
    periodDetails.reduce((s, p) => s + p.milk, 0),
    [periodDetails]
  );

  const totalExtraMilk = useMemo(() =>
    extras.reduce((s, x) => {
      const days = overlapDays(x.start, x.end, month, year);
      return s + days * Number(x.dailyQty || 0);
    }, 0),
    [extras, month, year]
  );

  const totalMilk = baseMilk + totalExtraMilk;
  const totalAmount = totalMilk * Number(rate || 0);

  const uidRef = useRef(0);
  const uid = useCallback(() => `mc_${++uidRef.current}_${Date.now()}`, []);

  // Period helpers
  const addDefault = () => {
    const total = daysInMonth(month, year);
    setDefaults(d => [...d, { _key: uid(), start: `${year}-${String(month).padStart(2, '0')}-01`, end: `${year}-${String(month).padStart(2, '0')}-${total}`, qty: '1.0' }]);
  };
  const updDefault = (i, f, v) => setDefaults(d => d.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const delDefault = (i) => {
    if (defaults.length <= 1) { toast.error('Need at least one default period'); return; }
    setDefaults(d => d.filter((_, idx) => idx !== i));
  };

  const addLeave = () => setLeaves(l => [...l, { _key: uid(), start: '', end: '' }]);
  const updLeave = (i, f, v) => setLeaves(l => l.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const delLeave = (i) => setLeaves(l => l.filter((_, idx) => idx !== i));

  const addExtra = () => setExtras(x => [...x, { _key: uid(), start: '', end: '', dailyQty: '' }]);
  const updExtra = (i, f, v) => setExtras(x => x.map((item, idx) => idx === i ? { ...item, [f]: v } : item));
  const delExtra = (i) => setExtras(x => x.filter((_, idx) => idx !== i));

  const reset = () => {
    const total = daysInMonth(month, year);
    setDefaults([{ _key: uid(), start: `${year}-${String(month).padStart(2, '0')}-01`, end: `${year}-${String(month).padStart(2, '0')}-${total}`, qty: '1.0' }]);
    setLeaves([]);
    setExtras([]);
  };

  // WhatsApp Receipt
  const shareReceipt = useCallback(() => {
    const lines = [
      '🧾 *MILK BILL RECEIPT*',
      '━━━━━━━━━━━━━━━━━',
      `*Customer:* ${customerName || 'N/A'}`,
      `*Period:* ${MONTHS.find(m => m.value === month)?.label} ${year}`,
      `*Rate:* ₹${Number(rate || 0).toFixed(2)}/L`,
      '━━━━━━━━━━━━━━━━━',
      '*Default Milk Periods:*',
    ];
    defaults.forEach((d, i) => {
      const days = overlapDays(d.start, d.end, month, year);
      const total = days * Number(d.qty || 0);
      if (days > 0) lines.push(`  ${i + 1}. ${fmt(d.start)}–${fmt(d.end)} → ${d.qty}L×${days}d = ${total.toFixed(1)}L`);
    });
    lines.push(`  *Total Scheduled:* ${totalScheduledMilk.toFixed(1)}L (${totalScheduledDays}d)`);
    if (totalLeaveDays > 0) {
      lines.push('', '*Leaves:*');
      leaves.forEach((l, i) => {
        const d = overlapDays(l.start, l.end, month, year);
        if (d > 0) lines.push(`  ${i + 1}. ${fmt(l.start)}–${fmt(l.end)} → ${d}d`);
      });
      lines.push(`  *Total Leave:* ${totalLeaveDays}d`);
    }
    if (totalExtraMilk > 0) {
      lines.push('', '*Extra Milk:*');
      extras.forEach((x, i) => {
        const days = overlapDays(x.start, x.end, month, year);
        const total = days * Number(x.dailyQty || 0);
        if (total > 0) lines.push(`  ${i + 1}. ${fmt(x.start)}–${fmt(x.end)} → ${x.dailyQty}L×${days}d = ${total.toFixed(1)}L`);
      });
    }
    lines.push(
      '━━━━━━━━━━━━━━━━━',
      `*Base Milk:* ${baseMilk.toFixed(1)}L (${activeDays} active days)`,
      `*Extra Milk:* +${totalExtraMilk.toFixed(1)}L`,
      `*Total Milk:* ${totalMilk.toFixed(1)}L`,
      `*Total Amount:* ₹${totalAmount.toFixed(2)}`,
      '━━━━━━━━━━━━━━━━━',
      '_Generated by Dairy MS-Kowsick Reddy_',
    );
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [customerName, month, year, rate, defaults, leaves, extras, baseMilk, totalExtraMilk, totalMilk, totalAmount, totalScheduledMilk, totalScheduledDays, totalLeaveDays, activeDays]);

  return (
    <div className="pb-28">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Milk Calculator</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly bill estimator</p>
            </div>
          </div>
          <Button variant="outline" onClick={reset} className="h-9 px-3 text-xs">
            Reset
          </Button>
        </div>
        {/* Customer & Period */}
        <Card className="glass-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Customer Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Month</label>
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                options={MONTHS.map(m => ({ value: m.value, label: m.label }))} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Year</label>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}
                options={years.map(y => ({ value: y, label: String(y) }))} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Milk Rate (₹/L)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="0.00" />
              </div>
            </div>
          </div>
        </Card>

        {/* Default Milk Periods */}
        <SectionCard icon={Milk} iconBg="bg-blue-100" iconColor="text-blue-600"
          title="Default Milk Periods" subtitle="Daily quantity — add multiple if rate changes mid-month"
          onAdd={addDefault} addLabel="Period">
          {defaults.length === 0 ? (
            <EmptyState icon={Milk} color="blue" message="No default milk periods" sub="Add your daily milk quantity for different date ranges" />
          ) : (
            <div className="space-y-2">
              {defaults.map((d, i) => (
                <PeriodRow key={d._key} index={i} color="blue"
                  start={d.start} end={d.end}
                  extraField="qty" extraLabel="L/day" extraValue={d.qty}
                  onUpdate={(f, v) => updDefault(i, f, v)}
                  onDelete={() => delDefault(i)}
                  rightLabel="in month" rightValue={`${overlapDays(d.start, d.end, month, year)}d`} />
              ))}
              <div className="pt-2 px-1 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Scheduled:</span>
                <span className="font-bold text-slate-900">{totalScheduledMilk.toFixed(1)}L over {totalScheduledDays} days</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Leave Periods */}
        <SectionCard icon={Sun} iconBg="bg-amber-100" iconColor="text-amber-600"
          title="Leave Periods" subtitle="Days without delivery" onAdd={addLeave} addLabel="Leave">
          {leaves.length === 0 ? (
            <EmptyState icon={Sun} color="amber" message="No leave periods" sub="Add leave ranges to deduct from active days" />
          ) : (
            <div className="space-y-2">
              {leaves.map((l, i) => (
                <PeriodRow key={l._key} index={i} color="amber"
                  start={l.start} end={l.end}
                  onUpdate={(f, v) => updLeave(i, f, v)}
                  onDelete={() => delLeave(i)}
                  rightLabel="leave days" rightValue={`${overlapDays(l.start, l.end, month, year)}d`} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Extra Milk Periods */}
        <SectionCard icon={TrendingUp} iconBg="bg-indigo-100" iconColor="text-indigo-600"
          title="Extra Milk Periods" subtitle="Additional milk beyond default" onAdd={addExtra} addLabel="Extra">
          {extras.length === 0 ? (
            <EmptyState icon={TrendingUp} color="indigo" message="No extra milk periods" sub="Add extra milk ranges with daily quantity" />
          ) : (
            <div className="space-y-2">
              {extras.map((x, i) => {
                const days = overlapDays(x.start, x.end, month, year);
                const total = days * Number(x.dailyQty || 0);
                return (
                  <PeriodRow key={x._key} index={i} color="indigo"
                    start={x.start} end={x.end}
                    extraField="dailyQty" extraLabel="L/day" extraValue={x.dailyQty}
                    onUpdate={(f, v) => updExtra(i, f, v)}
                    onDelete={() => delExtra(i)}
                    rightLabel="total extra" rightValue={total > 0 ? `${total.toFixed(1)}L` : '0L'} />
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Results */}
        {rate && Number(rate) > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              {[
                { label: 'Scheduled Days', value: `${totalScheduledDays}d`, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Calendar },
                { label: 'Active Days', value: `${activeDays}d`, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: Sun },
                { label: 'Base Milk', value: `${baseMilk.toFixed(1)}L`, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Milk },
                { label: 'Extra Milk', value: `${totalExtraMilk.toFixed(1)}L`, color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', icon: TrendingUp },
                { label: 'Total Milk', value: `${totalMilk.toFixed(1)}L`, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: Calculator },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className={`${s.color} border rounded-2xl p-4`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{s.label}</span>
                    </div>
                    <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
                  </div>
                );
              })}
            </div>

            <Card className="glass-card p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Bill</p>
                    <h2 className="text-4xl md:text-5xl font-black text-emerald-700 mt-1 tracking-tight">
                      {formatCurrency(totalAmount)}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {customerName || 'Customer'} — {MONTHS.find(m => m.value === month)?.label} {year}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 md:text-right">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-slate-500">Rate:</span>
                        <span className="font-bold text-slate-900">₹{Number(rate || 0).toFixed(2)}/L</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-slate-500">Base Milk:</span>
                        <span className="font-bold text-slate-900">{baseMilk.toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-slate-500">Extra Milk:</span>
                        <span className="font-bold text-slate-900">+{totalExtraMilk.toFixed(1)}L</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-slate-500">Active Days:</span>
                        <span className="font-bold text-slate-900">{activeDays}/{totalScheduledDays}</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-1.5 mt-1.5 flex justify-between gap-8">
                        <span className="font-bold text-slate-700">Total:</span>
                        <span className="font-black text-emerald-700">{totalMilk.toFixed(1)}L × ₹{Number(rate || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={shareReceipt}
                  className="mt-5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                  <Share2 className="w-4 h-4" />
                  Share Receipt via WhatsApp
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {(!rate || Number(rate) <= 0) && (
          <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <Calculator className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Enter a rate to begin</h3>
            <p className="text-gray-400 mt-1 text-sm">Set the milk rate per liter and configure your periods below</p>
          </div>
        )}
      </main>
    </div>
  );
}
