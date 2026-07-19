import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  BarChart2, Calendar, RefreshCw, Users,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet,
  Download
} from 'lucide-react';
import api from '../services/api';
import { cn, formatCurrency, getMonthName, getInitials } from '../lib/utils';
import { Input, Select, Card, Button } from '../ui';


// ── Month navigator ───────────────────────────────────────────────────────
function MonthNavigator({ year, month, onChange }) {
  const navigate = (delta) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1;  y += 1; }
    if (m < 1)  { m = 12; y -= 1; }
    onChange(y, m);
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex gap-2">
        <Select
          value={month}
          onChange={(e) => onChange(year, Number(e.target.value))}
          options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))}
          className="w-36"
        />
        <Input
          type="number"
          value={year}
          onChange={(e) => onChange(Number(e.target.value), month)}
          className="w-24 text-center"
        />
      </div>
      <button onClick={() => navigate(1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}

// ── Daily Report Tab ──────────────────────────────────────────────────────
function DailyReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'daily', selectedDate],
    queryFn:  () => api.reports.getDaily(selectedDate),
    enabled:  !!selectedDate,
  });

  const navigateDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const summary = data?.summary || {};
  const deliveries = data?.deliveries || [];

  // CSV Export for Daily
  const exportToCSV = () => {
    if (deliveries.length === 0) return;
    const headers = ['Customer', 'Shift', 'Status', 'Scheduled (L)', 'Delivered (L)', 'Extra (L)'];
    const rows = deliveries.map(d => [
      d.customer_name,
      d.delivery_shift || d.session || '',
      d.delivered ? (d.extra_milk > 0 ? 'Extra' : 'Delivered') : d.leave ? 'Leave' : 'Pending',
      Number(d.scheduled_quantity || 0).toFixed(1),
      Number(d.delivered_quantity || 0).toFixed(1),
      Number(d.extra_milk || 0).toFixed(1),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigateDate(-1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-44 text-center font-semibold"
        />
        <button onClick={() => navigateDate(1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
          <ChevronRight className="w-5 h-5" />
        </button>
        <Button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          variant="ghost" className="text-xs text-indigo-600"
        >Today</Button>
        <Button variant="ghost" onClick={() => refetch()} className="p-2">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
        </Button>
        {deliveries.length > 0 && (
          <Button variant="outline" onClick={exportToCSV} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: summary.total_deliveries || 0,           color: 'stat-card-blue' },
          { label: 'Delivered',     value: summary.delivered_count || 0,             color: 'stat-card-green' },
          { label: 'On Leave',      value: summary.leave_count || 0,                 color: 'stat-card-amber' },
          { label: 'Milk Collected',value: `${Number(summary.total_milk || 0).toFixed(1)} L`, color: 'stat-card-purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className={cn('rounded-2xl p-4 border border-white/50', color)}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Deliveries table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-red-200">
          <p className="font-bold text-red-600">Failed to load daily report</p>
          <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No delivery records for this date</p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Customer', 'Shift', 'Status', 'Scheduled', 'Delivered', 'Extra'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{d.delivery_shift || d.session}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const st = d.delivered ? (d.extra_milk > 0 ? 'extra' : 'delivered') : d.leave ? 'leave' : 'pending';
                        const cls = st === 'delivered' || st === 'extra' ? 'bg-green-100 text-green-700'
                                  : st === 'leave' ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-700';
                        const lbl = st === 'delivered' ? 'Delivered' : st === 'extra' ? 'Extra' : st === 'leave' ? 'Leave' : 'Pending';
                        return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{lbl}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{Number(d.scheduled_quantity || 0).toFixed(1)} L</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{Number(d.delivered_quantity || 0).toFixed(1)} L</td>
                    <td className="px-4 py-3 text-indigo-600">{Number(d.extra_milk || 0) > 0 ? `+${Number(d.extra_milk).toFixed(1)} L` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Monthly Report Tab ────────────────────────────────────────────────────
function MonthlyReport() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn:  () => api.reports.getMonthly(year, month),
  });

  const customers = useMemo(() => data?.customers || [], [data]);

  // CSV Export for Monthly
  const exportMonthlyCSV = () => {
    if (customers.length === 0) return;
    const headers = ['Customer', 'Days', 'Leave', 'Total Milk (L)', 'Extra Milk (L)', 'Rate (₹/L)', 'Gross (₹)', 'Wallet Adj. (₹)', 'Net Payable (₹)'];
    const rows = customers.map(c => [
      c.customer_name,
      c.delivered_days || 0,
      c.leave_days || 0,
      Number(c.total_milk || 0).toFixed(1),
      Number(c.total_extra_milk || 0).toFixed(1),
      c.milk_rate_per_liter || 0,
      Number(c.total_amount || 0).toFixed(2),
      Number(c.wallet_deduction || c.credit_used || 0).toFixed(2),
      (Number(c.total_amount || 0) - Number(c.wallet_deduction || c.credit_used || 0)).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${year}-${String(month).padStart(2,'0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => customers.reduce((acc, c) => {
    const rawTotal     = Number(c.total_amount || 0);
    // Use server-computed wallet_deduction/credit_used instead of recalculating from credit_balance
    const walletDed    = Number(c.wallet_deduction || c.credit_used || 0);
    const finalPayable = rawTotal - walletDed;
    return {
      milk:     acc.milk     + Number(c.total_milk || 0),
      revenue:  acc.revenue  + rawTotal,
      payable:  acc.payable  + finalPayable,
    };
  }, { milk: 0, revenue: 0, payable: 0 }), [customers]);


  return (
    <div className="space-y-5">
      {/* Month picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <Button variant="ghost" onClick={() => refetch()} className="p-2">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
        </Button>
        {customers.length > 0 && (
          <Button variant="outline" onClick={exportMonthlyCSV} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        )}
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Milk',  value: `${totals.milk.toFixed(1)} L`,       color: 'stat-card-blue' },
          { label: 'Gross Revenue', value: formatCurrency(totals.revenue),     color: 'stat-card-green' },
          { label: 'Net Payable', value: formatCurrency(totals.payable),       color: 'stat-card-purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className={cn('rounded-2xl p-4 border border-white/50', color)}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-gray-900 text-sm">
        Customer-wise Breakdown — {getMonthName(month)} {year}
      </h3>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : isError ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-red-200">
          <p className="font-bold text-red-600">Failed to load monthly report</p>
          <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-gray-200">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No data for this period</p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Customer', 'Days', 'Leave', 'Total Milk', 'Extra Milk', 'Rate', 'Gross', 'Wallet Adj.', 'Net Payable'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {customers.map((c) => {
                    const rawTotal = Number(c.total_amount || 0);
                    // Use server-computed wallet_deduction/credit_used instead of recalculating from credit_balance
                    const walletDed = Number(c.wallet_deduction || c.credit_used || 0);
                    const finalPayable = rawTotal - walletDed;
                    return (
                    <tr key={c.customer_id}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(c.customer_name)}
                          </div>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">{c.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{c.delivered_days || 0}</td>
                      <td className="px-3 py-3">
                        {Number(c.leave_days || 0) > 0
                          ? <span className="badge badge-warning">{c.leave_days} days</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800">{Number(c.total_milk || 0).toFixed(1)} L</td>
                      <td className="px-3 py-3 text-indigo-600">
                        {Number(c.total_extra_milk || 0) > 0 ? `+${Number(c.total_extra_milk).toFixed(1)} L` : '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600">₹{c.milk_rate_per_liter}/L</td>
                      <td className="px-3 py-3 font-semibold text-gray-800">{formatCurrency(rawTotal)}</td>
                      <td className="px-3 py-3">
                        {walletDed > 0
                          ? <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">−{formatCurrency(walletDed)}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-emerald-700">{formatCurrency(finalPayable)}</span>
                      </td>
                    </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-3 py-3 font-bold text-indigo-900">Total</td>
                  <td className="px-3 py-3 font-bold text-indigo-900">{totals.milk.toFixed(1)} L</td>
                  <td colSpan={2}></td>
                  <td className="px-3 py-3 font-bold text-indigo-900">{formatCurrency(totals.revenue)}</td>
                  <td></td>
                  <td className="px-3 py-3 font-bold text-emerald-700">{formatCurrency(totals.payable)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profit & Loss Tab ─────────────────────────────────────────────────────
function ProfitLossReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics', 'earnings', year, month],
    queryFn: () => api.analytics.getEarnings(year, month),
  });

  const earnings = data || {};
  const billed = Number(earnings.total_billed || 0);
  const paid = Number(earnings.total_paid || 0);
  const pending = Number(earnings.total_pending || 0);
  const expenses = Number(earnings.total_expenses || 0);
  const profit = Number(earnings.profit || 0);
  const profitMargin = billed > 0 ? ((profit / billed) * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Billed', amount: billed, fill: '#6366f1' },
    { name: 'Collected', amount: paid, fill: '#10b981' },
    { name: 'Expenses', amount: expenses, fill: '#f59e0b' },
    { name: 'Profit', amount: profit > 0 ? profit : 0, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <Button variant="ghost" onClick={() => refetch()} className="p-2">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {isError ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-red-200">
          <p className="font-bold text-red-600">Failed to load P&L</p>
          <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
      <>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Billed', value: formatCurrency(billed), color: 'stat-card-blue', icon: TrendingUp },
          { label: 'Amount Collected', value: formatCurrency(paid), color: 'stat-card-green', icon: TrendingUp },
          { label: 'Total Expenses', value: formatCurrency(expenses), color: 'stat-card-amber', icon: TrendingDown },
          { label: 'Pending', value: formatCurrency(pending), color: 'stat-card-rose', icon: Wallet },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={cn('rounded-2xl p-4 border border-white/50', color)}>
            <div className="flex items-center gap-1">
              <Icon className="w-4 h-4" />
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Profit highlight */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</p>
            <p className={cn('text-3xl font-black mt-1', profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profit Margin</p>
            <p className={cn('text-2xl font-black mt-1', profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {profitMargin}%
            </p>
          </div>
        </div>
        <div className="mt-4 bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">How it's calculated:</span>{' '}
            Collected (₹{paid.toFixed(2)}) − Expenses (₹{expenses.toFixed(2)}) = Net Profit
          </p>
        </div>
      </Card>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Monthly Overview — {getMonthName(month)} {year}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#d1d5db" />
              <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" tickFormatter={v => `₹${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => [formatCurrency(v), 'Amount']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>)}
    </div>
  );
}

// ── Main Reports Page ─────────────────────────────────────────────────────
export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');

  const tabs = [
    { id: 'daily',   label: 'Daily',    fullLabel: ' Daily Report',  icon: Calendar },
    { id: 'monthly', label: 'Monthly',  fullLabel: ' Monthly Report', icon: BarChart2 },
    { id: 'pnl',     label: 'P&L',      fullLabel: ' P&L Statement', icon: TrendingUp },
  ];

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Daily delivery logs, monthly summaries and profit & loss</p>
          </div>
        </div>
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {tabs.map(({ id, label, fullLabel }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                activeTab === id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <span className="sm:hidden">{label}</span>
              <span className="hidden sm:inline">{fullLabel}</span>
            </button>
          ))}
        </div>

        {activeTab === 'daily'   && <DailyReport />}
        {activeTab === 'monthly' && <MonthlyReport />}
        {activeTab === 'pnl'     && <ProfitLossReport />}
      </main>
    </div>
  );
}
