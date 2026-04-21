import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2, Calendar, RefreshCw, Users,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { cn, formatCurrency, getMonthName, getInitials } from '../lib/utils';
import { Input, Select } from '../ui';


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

  const { data, isLoading, refetch } = useQuery({
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
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="btn btn-ghost text-xs text-indigo-600"
        >Today</button>
        <button onClick={() => refetch()} className="btn btn-ghost p-2">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
        </button>
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
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No delivery records for this date</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Shift', 'Status', 'Scheduled', 'Delivered', 'Extra'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{d.delivery_shift || d.session}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge',
                        d.status === 'delivered' || d.status === 'extra' ? 'badge-success'
                        : d.status === 'leave' ? 'badge-warning' : 'badge-neutral'
                      )}>
                        {d.status}
                      </span>
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn:  () => api.reports.getMonthly(year, month),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const customers = useMemo(() => data?.customers || [], [data]);

  const totals = useMemo(() => customers.reduce((acc, c) => ({
    milk:     acc.milk     + Number(c.total_milk || 0),
    revenue:  acc.revenue  + Number(c.raw_total || 0),
    payable:  acc.payable  + Number(c.final_payable || 0),
  }), { milk: 0, revenue: 0, payable: 0 }), [customers]);


  return (
    <div className="space-y-5">
      {/* Month picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <MonthNavigator year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <button onClick={() => refetch()} className="btn btn-ghost p-2">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
        </button>
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
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-white/40 rounded-2xl border-2 border-dashed border-gray-200">
          <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No data for this period</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Days', 'Leave', 'Total Milk', 'Extra Milk', 'Rate', 'Gross', 'Wallet Adj.', 'Net Payable'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-3 py-3 font-semibold text-gray-800">{formatCurrency(c.raw_total || 0)}</td>
                    <td className="px-3 py-3">
                      {Number(c.wallet_deduction || 0) > 0
                        ? <span className="badge badge-purple text-xs">−{formatCurrency(c.wallet_deduction)}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-emerald-700">{formatCurrency(c.final_payable || 0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-indigo-50 border-t border-indigo-100">
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

// ── Main Reports Page ─────────────────────────────────────────────────────
export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');

  const tabs = [
    { id: 'daily',   label: '📅 Daily Report',   icon: Calendar },
    { id: 'monthly', label: '📊 Monthly Report',  icon: BarChart2 },
  ];

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-gradient">Reports & Analytics</h1>
        <p className="text-xs text-gray-400 mt-0.5">Daily delivery logs and monthly summaries</p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'daily'   && <DailyReport />}
        {activeTab === 'monthly' && <MonthlyReport />}
      </main>
    </div>
  );
}