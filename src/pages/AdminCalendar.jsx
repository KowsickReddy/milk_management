import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, ChevronLeft, ChevronRight, Milk, Users, Truck,
  TrendingUp, Calendar, RefreshCw, List, Grid3X3, ChevronDown,
  CheckCircle2, XCircle, Plus, Clock, Download, User, Search,
} from 'lucide-react';
import api from '../services/api';
import { Card, Button, Select } from '../ui';
import { toast } from 'react-hot-toast';
import { cn, getMonthName, toLocalDateString } from '../lib/utils';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}));

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null); // null = all customers
  const [customerSearch, setCustomerSearch] = useState('');

  // ── Date calculations ────────────────────────────────────────────
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // ── Fetch customers ──────────────────────────────────────────────
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.getAll(),
  });
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((c) => (map[c.id] = c));
    return map;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        (c.phone || '').includes(q)
    );
  }, [customers, customerSearch]);

  const selectedCustomer = selectedCustomerId
    ? customerMap[selectedCustomerId] || null
    : null;

  // ── Shared navigation ────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };
  const goToToday = () => {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth() + 1);
    setSelectedDay(null);
  };

  // ═══════════════════════════════════════════════════════════════════
  // MODE 1: INDIVIDUAL CUSTOMER VIEW
  // ═══════════════════════════════════════════════════════════════════
  const {
    data: customerCalendar,
    isLoading: custCalLoading,
  } = useQuery({
    queryKey: ['customer-calendar', selectedCustomerId, year, month],
    queryFn: () => api.portal.getCalendar(selectedCustomerId, year, month),
    enabled: !!selectedCustomerId,
  });

  const custCalEntries = customerCalendar?.calendar || [];
  const custCalMap = {};
  custCalEntries.forEach((d) => { custCalMap[d.day] = d; });

  // Customer-specific stats
  const custStats = useMemo(() => {
    const delivered = custCalEntries.filter((e) => e.summary?.delivered).length;
    const leaves = custCalEntries.filter((e) => e.summary?.leave && !e.summary?.delivered).length;
    const extra = custCalEntries.filter((e) => e.summary?.extra).length;
    const totalQty = custCalEntries.reduce((s, e) => s + (e.summary?.totalQuantity || 0), 0);
    return { delivered, leaves, extra, totalQty, totalDays: daysInMonth };
  }, [custCalEntries, daysInMonth]);

  const getCustDayColor = (daySummary) => {
    if (!daySummary) return 'bg-slate-50 text-slate-300 border-slate-100';
    if (daySummary.extra) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (daySummary.delivered) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (daySummary.leave) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-slate-50 text-slate-300 border-slate-100';
  };

  const getCustDayIndicator = (daySummary) => {
    if (!daySummary) return null;
    if (daySummary.extra) return <Plus className="w-2.5 h-2.5 text-blue-500" />;
    if (daySummary.delivered) return <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />;
    if (daySummary.leave) return <XCircle className="w-2.5 h-2.5 text-red-500" />;
    return null;
  };

  // ═══════════════════════════════════════════════════════════════════
  // MODE 2: ALL CUSTOMERS (AGGREGATED VIEW)
  // ═══════════════════════════════════════════════════════════════════
  const {
    data: deliveries = [],
    isLoading: allLoading,
    isError: allError,
    refetch: allRefetch,
    isFetching: allFetching,
  } = useQuery({
    queryKey: ['admin-calendar-deliveries', year, month],
    queryFn: () => api.deliveries.getAll({ startDate, endDate }),
    enabled: !selectedCustomerId,
  });

  const dayMap = useMemo(() => {
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      map[dateStr] = {
        date: dateStr, day: d, deliveries: [],
        totalQuantity: 0, customerCount: 0,
        deliveredCount: 0, leaveCount: 0, extraCount: 0,
        customerIds: new Set(),
      };
    }
    (deliveries || []).forEach((d) => {
      const dStr = d.date
        ? typeof d.date === 'string' ? d.date.split('T')[0] : toLocalDateString(new Date(d.date))
        : null;
      if (!dStr || !map[dStr]) return;
      const qty = parseFloat(d.delivered_quantity || 0) + parseFloat(d.extra_milk || 0);
      map[dStr].deliveries.push(d);
      map[dStr].totalQuantity += qty;
      if (d.customer_id) map[dStr].customerIds.add(d.customer_id);
      if (d.status === 'delivered' || d.status === 'extra') map[dStr].deliveredCount++;
      if (d.status === 'leave') map[dStr].leaveCount++;
      if (parseFloat(d.extra_milk || 0) > 0) map[dStr].extraCount++;
    });
    Object.values(map).forEach((entry) => { entry.customerCount = entry.customerIds.size; });
    return map;
  }, [deliveries, year, month, daysInMonth]);

  const calGrid = useMemo(() => {
    const grid = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
  }, [firstDayOfWeek, daysInMonth]);

  const stats = useMemo(() => {
    const entries = Object.values(dayMap);
    const activeDays = entries.filter((e) => e.totalQuantity > 0);
    return {
      totalDeliveries: entries.reduce((s, e) => s + e.deliveries.length, 0),
      totalMilk: entries.reduce((s, e) => s + e.totalQuantity, 0),
      totalCustomers: entries.reduce((s, e) => s + e.customerCount, 0),
      avgPerDay: activeDays.length > 0
        ? (entries.reduce((s, e) => s + e.totalQuantity, 0) / activeDays.length).toFixed(1)
        : '0',
      activeDays: activeDays.length,
      totalLeaves: entries.reduce((s, e) => s + e.leaveCount, 0),
    };
  }, [dayMap]);

  const selectedDayData = selectedDay
    ? dayMap[`${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`]
    : null;

  const getDayIntensity = (dayEntry) => {
    if (!dayEntry || dayEntry.deliveries.length === 0) return 'empty';
    if (dayEntry.totalQuantity > 20) return 'high';
    if (dayEntry.totalQuantity > 10) return 'medium';
    return 'low';
  };

  const dayColors = {
    empty: 'bg-slate-50 text-slate-300 border-slate-100',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    high: 'bg-emerald-200 text-emerald-900 border-emerald-400',
  };

  // ── Export CSV ────────────────────────────────────────────────────
  const exportCSV = () => {
    if (selectedCustomer && selectedCustomerId) {
      // Customer-specific CSV
      const rows = [['Date', 'Day', 'Status', 'Total Quantity (L)', 'Delivered', 'Extra Milk', 'Shift']];
      custCalEntries
        .sort((a, b) => a.day - b.day)
        .forEach((e) => {
          const s = e.summary || {};
          rows.push([
            e.date, e.day,
            s.delivered ? 'Delivered' : s.leave ? 'Leave' : s.extra ? 'Extra' : 'None',
            (s.totalQuantity || 0).toFixed(1),
            (e.entries?.reduce((sum, en) => sum + (en.deliveredQuantity || 0), 0) || 0).toFixed(1),
            (e.entries?.reduce((sum, en) => sum + (en.extraMilk || 0), 0) || 0).toFixed(1),
            e.entries?.map((en) => en.shift || 'morning').join('; ') || '',
          ]);
        });
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-${selectedCustomerId}-calendar-${year}-${String(month).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Customer calendar exported as CSV');
    } else {
      // All customers CSV (existing)
      const rows = [['Date', 'Day', 'Customers', 'Deliveries', 'Total Milk (L)', 'Leaves', 'Extra']];
      Object.values(dayMap)
        .sort((a, b) => a.day - b.day)
        .forEach((e) => {
          rows.push([e.date, e.day, e.customerCount, e.deliveries.length, e.totalQuantity.toFixed(1), e.leaveCount, e.extraCount]);
        });
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-calendar-${year}-${String(month).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Calendar exported as CSV');
    }
  };

  const isLoading = selectedCustomerId ? custCalLoading : allLoading;
  const isError = !selectedCustomerId && allError;
  const isFetching = allFetching;
  const refetch = allRefetch;

  if (isLoading && selectedCustomerId) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-12 w-64 rounded-2xl" />
        <div className="skeleton h-8 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-red-600 mb-2">Failed to load calendar</h3>
          <p className="text-sm text-gray-500 mb-4">Could not fetch delivery data for this month.</p>
          <Button onClick={() => refetch()}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Delivery Calendar</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {selectedCustomer
                  ? `${selectedCustomer.name} · ${getMonthName(month)} ${year}`
                  : `${getMonthName(month)} ${year} · ${stats.activeDays} active days`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="h-9 px-4 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
            >Today</button>
            <button
              onClick={exportCSV}
              className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
              title="Export CSV"
            ><Download className="w-3.5 h-3.5" /></button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-3 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-slate-50 transition-colors border border-slate-100"
            ><RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} /></button>
          </div>
        </div>

        {/* ── Customer Selector ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Customer</span>
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value ? Number(e.target.value) : null);
                  setSelectedDay(null);
                }}
                className="input w-full sm:w-56 text-sm font-medium"
              >
                <option value="">All Customers (Aggregated View)</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} {c.title ? c.title + ' ' : ''}{c.name} {c.phone ? `· ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedCustomer && (
              <button
                onClick={() => { setSelectedCustomerId(null); setCustomerSearch(''); setSelectedDay(null); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                Clear Selection
              </button>
            )}
          </div>
          {selectedCustomer && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                {(selectedCustomer.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-900 truncate">
                  #{selectedCustomer.id} {selectedCustomer.title ? selectedCustomer.title + ' ' : ''}{selectedCustomer.name}
                </p>
                <p className="text-[10px] text-indigo-500 font-medium">
                  {selectedCustomer.daily_milk_quantity || 0}L/day · ₹{selectedCustomer.milk_rate_per_liter || 0}/L · {selectedCustomer.shift || 'morning'} shift
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────── */}
        {selectedCustomer ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Delivered Days', value: `${custStats.delivered} / ${custStats.totalDays}`, icon: CheckCircle2, color: 'stat-card-green' },
              { label: 'Total Milk', value: `${custStats.totalQty.toFixed(1)} L`, icon: Milk, color: 'stat-card-blue' },
              { label: 'Leaves', value: custStats.leaves, icon: XCircle, color: 'stat-card-amber' },
              { label: 'Extra Days', value: custStats.extra, icon: Plus, color: 'stat-card-purple' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-xl font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Deliveries', value: stats.totalDeliveries, icon: Truck, color: 'stat-card-blue' },
              { label: 'Total Milk', value: `${stats.totalMilk.toFixed(1)} L`, icon: Milk, color: 'stat-card-green' },
              { label: 'Avg/Day', value: `${stats.avgPerDay} L`, icon: TrendingUp, color: 'stat-card-purple' },
              { label: 'Active Customers', value: stats.totalCustomers, icon: Users, color: 'stat-card-amber' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-xl font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Month Selector ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <Select
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setSelectedDay(null); }}
              options={MONTHS}
              className="w-32"
            />
            <input
              type="number"
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setSelectedDay(null); }}
              className="input w-20 text-center font-bold"
              min={2020} max={2099}
            />
            <button onClick={nextMonth} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
              title="Grid View"
            ><Grid3X3 className="w-4 h-4" /></button>
            <button
              onClick={() => { setViewMode('list'); setSelectedDay(null); }}
              className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
              title="List View"
            ><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* ── Legend ──────────────────────────────────────────────── */}
        {selectedCustomer ? (
          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-2xl text-[10px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Delivered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Not Delivered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> Extra Milk</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-200" /> No Record</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-2xl text-[10px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" /> High (&gt;20L)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Medium (10-20L)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Low (&lt;10L)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-50 border border-slate-200" /> No deliveries</span>
            <span className="ml-auto text-[9px] text-slate-400"><Clock className="w-3 h-3 inline mr-1" />{stats.totalLeaves} leave days</span>
          </div>
        )}

        {/* ── Calendar / List View ───────────────────────────────── */}
        {viewMode === 'grid' ? (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest py-1">{d}</div>
              ))}
            </div>

            {selectedCustomer ? (
              /* ── CUSTOMER-SPECIFIC CALENDAR GRID (green/red/blue) ── */
              <div className="grid grid-cols-7 gap-1">
                {calGrid.map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} />;
                  const ds = custCalMap[day]?.summary;
                  const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                  const isSel = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSel ? null : day)}
                      className={cn(
                        'relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all text-xs font-bold min-h-[60px] border',
                        getCustDayColor(ds),
                        isToday && 'ring-2 ring-indigo-500',
                        isSel && 'ring-2 ring-indigo-600 scale-105 z-10 shadow-lg',
                        ds && 'cursor-pointer hover:scale-105'
                      )}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      {ds?.totalQuantity > 0 && (
                        <span className="text-[8px] font-bold opacity-80 mt-0.5">{ds.totalQuantity.toFixed(1)}L</span>
                      )}
                      <span className="absolute -bottom-0.5">
                        {getCustDayIndicator(ds)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* ── AGGREGATED CALENDAR GRID (green intensity) ── */
              <div className="grid grid-cols-7 gap-1">
                {calGrid.map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} />;
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const entry = dayMap[dateStr];
                  const intensity = getDayIntensity(entry);
                  const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                  const isSel = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSel ? null : day)}
                      className={cn(
                        'relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all text-xs font-bold min-h-[60px] border',
                        dayColors[intensity],
                        isToday && 'ring-2 ring-indigo-500',
                        isSel && 'ring-2 ring-indigo-600 scale-105 z-10 shadow-lg',
                        entry?.deliveries.length > 0 && 'cursor-pointer hover:scale-105'
                      )}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      {entry?.deliveries.length > 0 && (
                        <>
                          <span className="text-[8px] font-bold opacity-80 mt-0.5 leading-tight">{entry.totalQuantity.toFixed(1)}L</span>
                          <span className="text-[7px] font-medium opacity-60 leading-tight">{entry.customerCount} cust</span>
                          {entry.extraCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
                              <Plus className="w-2 h-2 text-white" />
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── LIST VIEW ────────────────────────────────────────── */
          <div className="space-y-1">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const entry = selectedCustomerId ? { deliveries: custCalMap[day]?.entries || [], totalQuantity: custCalMap[day]?.summary?.totalQuantity || 0, customerCount: 1, leaveCount: custCalMap[day]?.summary?.leave ? 1 : 0, extraCount: custCalMap[day]?.summary?.extra ? 1 : 0 } : dayMap[dateStr];
              const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
              const ds = selectedCustomerId ? custCalMap[day]?.summary : null;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all border border-transparent hover:border-slate-200',
                    isToday && 'bg-indigo-50 border-indigo-200',
                    !isToday && 'hover:bg-slate-50',
                    selectedDay === day && 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold',
                      selectedCustomerId
                        ? ds ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        : entry?.deliveries?.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    )}>
                      {day}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">
                        {selectedCustomerId
                          ? ds ? (ds.delivered ? 'Delivered' : ds.leave ? 'On Leave' : ds.extra ? 'Extra Milk' : 'No Record') : 'No Record'
                          : `${entry?.deliveries?.length || 0} deliveries`}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {selectedCustomerId
                          ? `${ds?.totalQuantity?.toFixed(1) || '0.0'}L`
                          : `${entry?.customerCount || 0} customers · ${entry?.totalQuantity?.toFixed(1) || '0.0'}L`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedCustomerId && entry?.leaveCount > 0 && <span className="badge badge-danger text-[9px]">{entry.leaveCount} leaves</span>}
                    {!selectedCustomerId && entry?.extraCount > 0 && <span className="badge badge-info text-[9px]">+{entry.extraCount} extra</span>}
                    {selectedCustomerId && ds?.extra && <span className="badge badge-info text-[9px]">Extra</span>}
                    {selectedCustomerId && ds?.leave && !ds?.delivered && <span className="badge badge-danger text-[9px]">Leave</span>}
                    <ChevronDown className={cn('w-4 h-4 text-slate-300 transition-transform duration-200', selectedDay === day && 'rotate-180')} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Day Detail Panel ───────────────────────────────────── */}
        {selectedCustomer && selectedDay && custCalMap[selectedDay] && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-elevated animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {selectedCustomer.name} — {getMonthName(month)} {selectedDay}, {year}
              </h3>
              <span className="text-sm font-bold text-indigo-600">
                {custCalMap[selectedDay]?.summary?.totalQuantity?.toFixed(1) || '0.0'}L
              </span>
            </div>
            <div className="space-y-2">
              {(custCalMap[selectedDay]?.entries || []).length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CalendarDays className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No deliveries on this day</p>
                </div>
              ) : (
                custCalMap[selectedDay].entries.map((en, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center',
                        en.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        en.status === 'leave' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      )}>
                        {en.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> :
                         en.status === 'leave' ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 capitalize">{en.shift || 'Morning'} Shift</p>
                        <p className="text-[10px] text-slate-400">Status: {en.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{en.quantity?.toFixed(1) || '0.0'}L</p>
                      {en.extraMilk > 0 && <p className="text-[9px] text-blue-600 font-bold">+{en.extraMilk} extra</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!selectedCustomer && selectedDayData && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-elevated animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Details — {getMonthName(month)} {selectedDay}, {year}
              </h3>
              <span className="text-sm font-bold text-indigo-600">{selectedDayData.totalQuantity.toFixed(1)}L total</span>
            </div>
            {selectedDayData.deliveries.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">No deliveries on this day</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedDayData.deliveries.map((d, i) => {
                  const cust = customerMap[d.customer_id];
                  const qty = parseFloat(d.delivered_quantity || 0) + parseFloat(d.extra_milk || 0);
                  return (
                    <div key={d.id || i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold',
                          d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                          d.status === 'leave' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        )}>
                          {d.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> :
                           d.status === 'leave' ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">#{d.customer_id} {cust?.name || d.customer_name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span className={cn('badge text-[8px]', d.delivery_shift === 'morning' ? 'badge-warning' : d.delivery_shift === 'evening' ? 'badge-info' : 'badge-neutral')}>
                              {d.delivery_shift || 'morning'}
                            </span>
                            <span>Status: {d.status}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{qty.toFixed(1)}L</p>
                        {parseFloat(d.extra_milk || 0) > 0 && <p className="text-[9px] text-blue-600 font-bold">+{d.extra_milk} extra</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Month Summary ──────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-5 border border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> {getMonthName(month)} {year} Summary
            {selectedCustomer && <span className="text-indigo-500 font-medium">— {selectedCustomer.name}</span>}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(selectedCustomer ? [
              { label: 'Delivered Days', value: `${custStats.delivered} / ${custStats.totalDays}`, icon: CheckCircle2 },
              { label: 'Total Milk', value: `${custStats.totalQty.toFixed(1)} L`, icon: Milk },
              { label: 'Leave Days', value: custStats.leaves, icon: XCircle },
              { label: 'Delivery Rate', value: `${custStats.totalDays > 0 ? Math.round((custStats.delivered / custStats.totalDays) * 100) : 0}%`, icon: TrendingUp },
            ] : [
              { label: 'Total Deliveries', value: stats.totalDeliveries, icon: Truck },
              { label: 'Total Milk', value: `${stats.totalMilk.toFixed(1)} L`, icon: Milk },
              { label: 'Avg Daily Milk', value: `${stats.avgPerDay} L`, icon: TrendingUp },
              { label: 'Active Days', value: `${stats.activeDays} / ${daysInMonth}`, icon: Calendar },
            ]).map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/70 rounded-xl p-3 border border-indigo-100/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-indigo-500" />
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-lg font-black text-indigo-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
