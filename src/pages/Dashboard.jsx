import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, TrendingUp, Clock, Milk, Wallet,
  Receipt, Truck, RefreshCw, CheckCircle2, AlertCircle,
  Plus, DollarSign, CalendarDays, Activity,
} from 'lucide-react';
import { cn, formatCurrency, getToday, getWeekDates, getMonthName } from '../lib/utils';
import api from '../services/api';
import { Card, StatCard, Button } from '../ui';

// ── Quick Action Button ────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, bg, onClick, index = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 rounded-3xl border border-slate-200/60 transition-all duration-300 bg-white group hover:shadow-lg hover:shadow-slate-200/40 hover:-translate-y-1 active:scale-[0.97]"
    >
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 transition-transform duration-300 group-hover:scale-110', bg)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-bold text-slate-900 text-[13px] tracking-tight">{label}</p>
        <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{desc}</p>
      </div>
    </motion.button>
  );
}

// ── Weekly milk bar chart ──────────────────────────────────────────────────
function MilkChart({ deliveries }) {
  const data = useMemo(() => {
    const weekDates = getWeekDates();
    return weekDates.map(date => {
      const dayDeliveries = deliveries.filter(d => d.date === date && !d.is_deleted);
      const milk = dayDeliveries.reduce((s, d) => s + Number(d.delivered_quantity || 0) + Number(d.extra_milk || 0), 0);
      return {
        day: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
        milk: parseFloat(milk.toFixed(2)),
      };
    });
  }, [deliveries]);

  return (
    <Card className="p-5">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Milk className="w-4 h-4 text-indigo-500" />
        Weekly Milk Delivery
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} unit="L" />
            <Tooltip
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12, padding: '8px 12px' }}
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
    </Card>
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
    <Card className="p-5">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        Monthly Revenue — {year}
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={v => `₹${Math.round(v / 1000)}k`} />
            <Tooltip
              contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12, padding: '8px 12px' }}
              formatter={(v, name) => [formatCurrency(v), name === 'billed' ? 'Billed' : 'Collected']}
            />
            <Line type="monotone" dataKey="billed"    stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Recent deliveries list ─────────────────────────────────────────────────
function RecentDeliveries({ deliveries, customers }) {
  const today = getToday();
  const todayDeliveries = deliveries
    .filter(d => d.date === today && !d.is_deleted)
    .slice(0, 6);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-500" />
          Today's Deliveries
        </h3>
        <span className="badge badge-info">{todayDeliveries.length} entries</span>
      </div>
      {todayDeliveries.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">No deliveries recorded today</p>
      ) : (
        <div className="space-y-2">
          {todayDeliveries.map((d, i) => {
            const c = customers.find(cu => cu.id === d.customer_id);
            const isDelivered = d.delivered || d.extra_milk > 0;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
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
                    <p className="text-sm font-semibold text-slate-900">#{c?.id} {c?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{Number(d.delivered_quantity || 0).toFixed(1)} L delivered</p>
                  </div>
                </div>
                <span className={cn('badge', isDelivered ? 'badge-success' : 'badge-warning')}>
                  {isDelivered ? (d.extra_milk > 0 ? 'Extra' : 'Delivered') : (d.leave ? 'Leave' : 'Pending')}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
  const today = getToday();

  const { data: stats, isLoading: statsLoading, isError: statsIsError, error: _statsError, refetch: refetchStats } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn:  () => api.analytics.getDashboard(),
    refetchInterval: 60 * 1000,
  });

  const { data: deliveries = [], isError: deliveriesIsError, error: _deliveriesError, refetch: refetchDeliveries } = useQuery({
    queryKey: ['deliveries', today],
    queryFn:  () => api.deliveries.getAll({ date: today }),
  });

  const { data: allDeliveries = [], isError: allDeliveriesIsError, error: _allDeliveriesError, refetch: refetchAllDeliveries } = useQuery({
    queryKey: ['deliveries-week'],
    queryFn:  () => api.deliveries.getAll({}),
  });

  const { data: bills = [], isError: billsIsError, error: _billsError, refetch: refetchBills } = useQuery({
    queryKey: ['bills'],
    queryFn:  () => api.bills.getAll(),
  });

  const { data: payments = [], isError: paymentsIsError, error: _paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ['payments'],
    queryFn:  () => api.payments.getAll(),
  });

  const { data: customers = [], isError: customersIsError, error: _customersError, refetch: refetchCustomers } = useQuery({
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
    const active     = customers.filter(c => c.status === 'active').length;
    const todayDeliv = deliveries.filter(d => !d.is_deleted && (d.delivered || d.extra_milk > 0));
    const milk       = todayDeliv.reduce((s, d) => s + Number(d.delivered_quantity || 0) + Number(d.extra_milk || 0), 0);
    const unpaid     = bills.filter(b => !b.paid);
    const pending    = unpaid.reduce((s, b) => s + Number(b.balance || 0), 0);
    return {
      milkToday: milk, activeCustomers: active, delivered: todayDeliv.length,
      monthlyBilled: 0, monthlyCollected: 0, unpaidBills: unpaid.length, pendingAmount: pending, monthMilk: 0,
    };
  }, [stats, customers, deliveries, bills]);

  const kpiCards = [
    { title: 'Milk Today',      value: Number(kpis.milkToday).toFixed(1),      subtitle: `${kpis.delivered} deliveries done`,    icon: Milk,        color: 'indigo', suffix: ' L', nav: 'deliveries' },
    { title: 'Monthly Revenue', value: kpis.monthlyBilled,                     subtitle: `${formatCurrency(kpis.monthlyCollected)} collected`, icon: TrendingUp,  color: 'emerald', prefix: '₹', nav: 'billing' },
    { title: 'Active Customers',value: kpis.activeCustomers,                   subtitle: `${kpis.onLeave} on leave today`,        icon: Users,       color: 'purple', nav: 'customers' },
    { title: 'Pending Bills',   value: kpis.unpaidBills,                       subtitle: `₹${Number(kpis.pendingAmount).toLocaleString()} pending`, icon: Clock, color: 'amber', nav: 'billing' },
  ];

  const quickActions = [
    { icon: Users,   label: 'Add Customer',  desc: 'Register new', bg: 'bg-indigo-500',  nav: 'customers' },
    { icon: Truck,   label: 'Deliveries',    desc: "Today's milk",  bg: 'bg-emerald-500', nav: 'deliveries' },
    { icon: Receipt, label: 'Generate Bill', desc: 'Create invoice', bg: 'bg-blue-500',   nav: 'billing' },
    { icon: Wallet,  label: 'Payments',      desc: 'Record payment', bg: 'bg-amber-500',  nav: 'billing' },
  ];

  const hasError = statsIsError || deliveriesIsError || allDeliveriesIsError || billsIsError || paymentsIsError || customersIsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Failed to load dashboard</h3>
          <p className="text-sm text-red-500 mb-4">Something went wrong while fetching data. Please try again.</p>
          <Button onClick={() => { refetchStats(); refetchDeliveries(); refetchAllDeliveries(); refetchBills(); refetchPayments(); refetchCustomers(); }}>
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((k, i) => (
          <motion.div
            key={k.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <StatCard
              title={k.title}
              value={k.value}
              subtitle={k.subtitle}
              icon={k.icon}
              color={k.color}
              animate={true}
              prefix={k.prefix || ''}
              suffix={k.suffix || ''}
            />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((qa, i) => (
            <QuickAction key={qa.label} {...qa} index={i} onClick={() => onNavigate(qa.nav)} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MilkChart deliveries={allDeliveries} />
        <RevenueChart bills={bills} payments={payments} />
      </div>

      {/* Recent + Monthly summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentDeliveries deliveries={deliveries} customers={customers} />

        {/* This month summary */}
        <Card className="p-5 space-y-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            This Month
          </h3>
          {[
            { label: 'Total Billed',   value: formatCurrency(kpis.monthlyBilled),   bg: 'bg-indigo-50', text: 'text-indigo-700', icon: Receipt },
            { label: 'Collected',      value: formatCurrency(kpis.monthlyCollected), bg: 'bg-emerald-50', text: 'text-emerald-700', icon: TrendingUp },
            { label: 'Milk Delivered', value: `${Number(kpis.monthMilk).toFixed(1)} L`, bg: 'bg-blue-50', text: 'text-blue-700', icon: Milk },
            { label: 'Pending',        value: formatCurrency(kpis.pendingAmount),   bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
          ].map(({ label, value, bg, text, icon: Icon }) => (
            <div key={label} className={cn('flex items-center justify-between p-3 rounded-xl', bg)}>
              <div className="flex items-center gap-2">
                <Icon className={cn('w-4 h-4', text)} />
                <p className={cn('text-sm font-medium', text)}>{label}</p>
              </div>
              <p className={cn('text-base font-bold', text)}>{value}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
