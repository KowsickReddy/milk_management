import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, TrendingUp, Clock, Milk, Wallet,
  Receipt, Truck, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { cn, formatCurrency, getToday, getWeekDates, getMonthName } from '../lib/utils';
import api from '../services/api';

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 border border-white/60 text-left w-full transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]',
        color
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="mt-1">
          <Icon className="w-6 h-6 text-gray-600 opacity-70" />
        </div>
      </div>
    </button>
  );
}

// ── Quick Action Button ────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200',
        'hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 w-full text-center',
        'active:scale-[0.97]'
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </button>
  );
}

// ── Weekly milk bar chart ──────────────────────────────────────────────────
function MilkChart({ deliveries }) {
  const weekDates = getWeekDates();
  const data = useMemo(() => weekDates.map(date => {
    const dayDeliveries = deliveries.filter(d => d.date === date && !d.is_deleted);
    const milk = dayDeliveries.reduce((s, d) => s + Number(d.delivered_quantity || 0) + Number(d.extra_milk || 0), 0);
    return {
      day: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
      milk: parseFloat(milk.toFixed(2)),
    };
  }), [deliveries, weekDates]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Weekly Milk Delivery</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#d1d5db" />
            <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" unit="L" />
            <Tooltip
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
              formatter={(v) => [`${v} L`, 'Milk']}
            />
            <Bar dataKey="milk" fill="url(#milkGrad)" radius={[6, 6, 0, 0]} name="Milk (L)" />
            <defs>
              <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Monthly revenue line chart ─────────────────────────────────────────────
function RevenueChart({ bills, payments }) {
  const year = new Date().getFullYear();
  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthBills    = bills.filter(b => b.bill_month === m && b.bill_year === year);
      const monthPayments = payments.filter(p => {
        const d = new Date(p.payment_date);
        return d.getMonth() + 1 === m && d.getFullYear() === year;
      });
      return {
        month:    getMonthName(m).slice(0, 3),
        billed:   monthBills.reduce((s, b) => s + Number(b.total_amount || 0), 0),
        collected: monthPayments.reduce((s, p) => s + Number(p.amount_paid || 0), 0),
      };
    });
  }, [bills, payments, year]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue — {year}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#d1d5db" />
            <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" tickFormatter={v => `₹${Math.round(v / 1000)}k`} />
            <Tooltip
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
              formatter={(v, name) => [formatCurrency(v), name === 'billed' ? 'Billed' : 'Collected']}
            />
            <Line type="monotone" dataKey="billed"    stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Recent deliveries list ─────────────────────────────────────────────────
function RecentDeliveries({ deliveries, customers }) {
  const today = getToday();
  const todayDeliveries = deliveries
    .filter(d => d.date === today && !d.is_deleted)
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Today's Deliveries</h3>
        <span className="badge badge-info">{todayDeliveries.length} entries</span>
      </div>
      {todayDeliveries.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">No deliveries recorded today</p>
      ) : (
        <div className="space-y-2">
          {todayDeliveries.map((d) => {
            const c = customers.find(cu => cu.id === d.customer_id);
            const isDelivered = d.status === 'delivered' || d.status === 'extra';
            return (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isDelivered ? 'bg-emerald-100' : 'bg-amber-100'
                  )}>
                    {isDelivered
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <Clock className="w-4 h-4 text-amber-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{Number(d.delivered_quantity || 0).toFixed(1)} L delivered</p>
                  </div>
                </div>
                <span className={cn('badge', isDelivered ? 'badge-success' : 'badge-warning')}>
                  {d.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
  const today = getToday();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn:  () => api.analytics.getDashboard(),
    refetchInterval: 60 * 1000, // auto-refresh every minute
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries', today],
    queryFn:  () => api.deliveries.getAll({ date: today }),
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['deliveries-week'],
    queryFn:  () => api.deliveries.getAll({}),
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn:  () => api.bills.getAll(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn:  () => api.payments.getAll(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => api.customers.getAll(),
  });

  const kpis = useMemo(() => {
    if (stats) {
      return {
        milkToday:     stats.total_milk_today || 0,
        activeCustomers: stats.total_customers || 0,
        delivered:     stats.delivered || 0,
        onLeave:       stats.on_leave || 0,
        monthlyBilled: stats.monthly_income || 0,
        monthlyCollected: stats.monthly_collected || 0,
        unpaidBills:   stats.unpaid_bills || 0,
        pendingAmount: stats.pending_amount || 0,
        monthMilk:     stats.month_milk_total || 0,
      };
    }
    // Fallback from local data
    const active     = customers.filter(c => c.status === 'active').length;
    const todayDeliv = deliveries.filter(d => !d.is_deleted && (d.status === 'delivered' || d.status === 'extra'));
    const milk       = todayDeliv.reduce((s, d) => s + Number(d.delivered_quantity || 0) + Number(d.extra_milk || 0), 0);
    const unpaid     = bills.filter(b => !b.paid);
    const pending    = unpaid.reduce((s, b) => s + Number(b.balance || 0), 0);
    return {
      milkToday: milk, activeCustomers: active, delivered: todayDeliv.length,
      monthlyBilled: 0, monthlyCollected: 0, unpaidBills: unpaid.length, pendingAmount: pending, monthMilk: 0,
    };
  }, [stats, customers, deliveries, bills]);

  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const kpiCards = [
    { title: 'Milk Today',      value: `${Number(kpis.milkToday).toFixed(1)} L`,   subtitle: `${kpis.delivered} deliveries done`,    icon: Milk,        color: 'stat-card-blue',   nav: 'deliveries' },
    { title: 'Monthly Revenue', value: formatCurrency(kpis.monthlyBilled),           subtitle: `${formatCurrency(kpis.monthlyCollected)} collected`, icon: TrendingUp,  color: 'stat-card-green',  nav: 'billing' },
    { title: 'Active Customers',value: kpis.activeCustomers,                         subtitle: `${kpis.onLeave} on leave today`,        icon: Users,       color: 'stat-card-purple', nav: 'customers' },
    { title: 'Pending Bills',   value: kpis.unpaidBills,                             subtitle: formatCurrency(kpis.pendingAmount),      icon: Clock,       color: 'stat-card-amber',  nav: 'billing' },
  ];

  const quickActions = [
    { icon: Users,   label: 'Add Customer',  desc: 'Register new', bg: 'bg-indigo-500',  nav: 'customers' },
    { icon: Truck,   label: 'Deliveries',    desc: "Today's milk",  bg: 'bg-emerald-500', nav: 'deliveries' },
    { icon: Receipt, label: 'Generate Bill', desc: 'Create invoice', bg: 'bg-blue-500',   nav: 'billing' },
    { icon: Wallet,  label: 'Payments',      desc: 'Record payment', bg: 'bg-amber-500',  nav: 'billing' },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'} 👋</h1>
            <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
          </div>
          <button
            onClick={() => refetchStats()}
            disabled={statsLoading}
            className="btn btn-ghost p-2"
          >
            <RefreshCw className={cn('w-5 h-5 text-indigo-500', statsLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((k) => (
            <StatCard
              key={k.title}
              title={k.title}
              value={k.value}
              subtitle={k.subtitle}
              icon={k.icon}
              color={k.color}
              onClick={() => onNavigate(k.nav)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((qa) => (
              <QuickAction key={qa.label} {...qa} onClick={() => onNavigate(qa.nav)} />
            ))}
          </div>
        </div>

        {/* Charts — desktop */}
        <div className="hidden lg:grid grid-cols-2 gap-5">
          <MilkChart deliveries={allDeliveries} />
          <RevenueChart bills={bills} payments={payments} />
        </div>

        {/* Recent + Monthly summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RecentDeliveries deliveries={deliveries} customers={customers} />

          {/* This month summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900">This Month</h3>
            {[
              { label: 'Total Billed',   value: formatCurrency(kpis.monthlyBilled),   bg: 'bg-indigo-50', text: 'text-indigo-900', icon: Receipt },
              { label: 'Collected',      value: formatCurrency(kpis.monthlyCollected), bg: 'bg-emerald-50', text: 'text-emerald-900', icon: TrendingUp },
              { label: 'Milk Delivered', value: `${Number(kpis.monthMilk).toFixed(1)} L`, bg: 'bg-blue-50', text: 'text-blue-900', icon: Milk },
              { label: 'Pending',        value: formatCurrency(kpis.pendingAmount),   bg: 'bg-amber-50', text: 'text-amber-900', icon: Clock },
            ].map(({ label, value, bg, text, icon: Icon }) => (
              <div key={label} className={cn('flex items-center justify-between p-3 rounded-xl', bg)}>
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', text)} />
                  <p className={cn('text-sm font-medium', text)}>{label}</p>
                </div>
                <p className={cn('text-base font-bold', text)}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile chart */}
        <div className="lg:hidden">
          <MilkChart deliveries={allDeliveries} />
        </div>
      </main>
    </div>
  );
}
