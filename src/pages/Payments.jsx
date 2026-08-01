import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote, CreditCard, RefreshCw, Search, Wallet, Calendar,
  TrendingUp, TrendingDown, Download, Receipt, Phone, CheckCircle2, Clock
} from 'lucide-react';
import api from '../services/api';
import { cn, formatCurrency, getToday } from '../lib/utils';
import { Card, Button, Input, Select } from '../ui';

// ── Payment row ──────────────────────────────────────────────────────────
function PaymentRow({ p }) {
  const amount = Number(p.amount_paid || 0);
  const change = Number(p.change_amount || p.change_given || 0);
  const isPartial = !!p.is_partial;
  const isOverpay = !!p.is_full_with_change || change > 0;
  const method = p.payment_method || 'cash';

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const fmtTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  };

  const typeBadge = isPartial
    ? 'bg-amber-100 text-amber-700'
    : isOverpay
      ? 'bg-purple-100 text-purple-700'
      : 'bg-emerald-100 text-emerald-700';
  const typeLabel = isPartial ? 'Partial' : isOverpay ? 'Full + Change' : 'Full';

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{fmtDate(p.payment_date)}</p>
            <p className="text-[10px] text-gray-400">{fmtTime(p.payment_date)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
          {p.customer_name || `Customer #${p.customer_id}`}
        </p>
        {p.customer_phone && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" /> {p.customer_phone}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
        {p.bill_month && p.bill_year
          ? `${p.bill_month}/${p.bill_year}`
          : p.bill_id ? `Bill #${p.bill_id}` : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full', typeBadge)}>
          {isPartial ? <Clock className="w-3 h-3 mr-1" /> : isOverpay ? <Wallet className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
          {typeLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        {method === 'upi' || method === 'online'
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"><CreditCard className="w-3.5 h-3.5" /> UPI</span>
          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Banknote className="w-3.5 h-3.5" /> Cash</span>
        }
      </td>
      <td className="px-4 py-3 text-right">
        <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{formatCurrency(amount)}</p>
        {change > 0 && (
          <p className="text-[10px] text-purple-600 font-semibold whitespace-nowrap">+{formatCurrency(change)} wallet</p>
        )}
      </td>
    </tr>
  );
}

// ── Main Payments Page ───────────────────────────────────────────────────
export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: payments = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['payments', 'ledger', dateRange, methodFilter],
    queryFn: () => {
      // Build params conditionally — never send undefined values, since
      // URLSearchParams would serialize them as the literal string "undefined"
      // and the backend would fail casting `'undefined'::date`.
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (methodFilter !== 'all') params.method = methodFilter;
      return api.payments.getAll(params);
    },
  });

  const filtered = useMemo(() => {
    if (!searchTerm) return payments;
    const q = searchTerm.toLowerCase();
    return payments.filter(p =>
      (p.customer_name || '').toLowerCase().includes(q) ||
      (p.customer_phone || '').toLowerCase().includes(q)
    );
  }, [payments, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = getToday();
    let todayTotal = 0, monthTotal = 0, walletCredits = 0, count = 0;
    for (const p of filtered) {
      const amt = Number(p.amount_paid || 0);
      count++;
      walletCredits += Number(p.change_amount || p.change_given || 0);
      const d = p.payment_date ? new Date(p.payment_date) : null;
      if (d) {
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (ds === today) todayTotal += amt;
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthTotal += amt;
      }
    }
    const total = filtered.reduce((s, p) => s + Number(p.amount_paid || 0), 0);
    return { count, total, todayTotal, monthTotal, walletCredits };
  }, [filtered]);

  // CSV export
  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Date', 'Customer', 'Phone', 'Bill Period', 'Amount', 'Method', 'Type', 'Wallet Change'];
    const rows = filtered.map(p => [
      p.payment_date ? new Date(p.payment_date).toLocaleString('en-IN') : '',
      p.customer_name || '',
      p.customer_phone || '',
      p.bill_month && p.bill_year ? `${p.bill_month}/${p.bill_year}` : (p.bill_id ? `#${p.bill_id}` : ''),
      Number(p.amount_paid || 0).toFixed(2),
      p.payment_method || 'cash',
      p.is_partial ? 'Partial' : (Number(p.change_amount || p.change_given || 0) > 0 ? 'Full + Change' : 'Full'),
      Number(p.change_amount || p.change_given || 0).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-records-${getToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-20" />)}
    </div>
  );

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Payment Records</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Every payment · date · amount · customer</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-indigo-600 transition-colors border border-slate-100"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
            <Button variant="outline" onClick={exportCSV} className="text-xs gap-1.5" disabled={!filtered.length}>
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Collected', value: formatCurrency(stats.total), color: 'stat-card-green', icon: TrendingUp },
            { label: 'Today', value: formatCurrency(stats.todayTotal), color: 'stat-card-blue', icon: Calendar },
            { label: 'This Month', value: formatCurrency(stats.monthTotal), color: 'stat-card-purple', icon: Receipt },
            { label: 'Wallet Credits', value: formatCurrency(stats.walletCredits), color: 'stat-card-amber', icon: TrendingDown },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name or phone..."
              className="input pl-10"
            />
          </div>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Methods' },
              { value: 'cash', label: 'Cash' },
              { value: 'upi', label: 'UPI' },
              { value: 'online', label: 'Online' },
            ]}
            className="w-full sm:w-40"
          />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(r => ({ ...r, start: e.target.value }))}
            className="w-full sm:w-40"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(r => ({ ...r, end: e.target.value }))}
            className="w-full sm:w-40"
            placeholder="To"
          />
        </div>

        {/* Error / empty / table */}
        {isError ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-red-200">
            <p className="font-bold text-red-600">Failed to load payments</p>
            <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <Wallet className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No payments found</h3>
            <p className="text-gray-400 mt-1 text-sm">Payments recorded in the Billing page will appear here with date, customer and amount.</p>
          </div>
        ) : (
          <Card className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Date', 'Customer', 'Bill', 'Type', 'Method', 'Amount'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => <PaymentRow key={p.id} p={p} />)}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-bold text-gray-900">Total ({stats.count} payments)</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(stats.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
