import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check, Plus, Package, ChevronLeft, ChevronRight,
  RefreshCw, Milk, Coffee, Moon, CalendarOff, AlertCircle, Truck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { cn, getToday, getInitials } from '../lib/utils';
import { Card, Button, ConfirmModal, Input, Select } from '../ui';
import { motion } from 'framer-motion';

// ── Delivery status helper ───────────────────────────────────────────────
function getDeliveryStatus(delivery) {
  if (!delivery) return 'pending';
  if (delivery.status) return delivery.status;
  if (delivery.leave) return 'leave';
  if (delivery.delivered) return parseFloat(delivery.extra_milk || 0) > 0 ? 'extra' : 'delivered';
  return 'pending';
}

// ── Summary bar at top ───────────────────────────────────────────────────
function DailySummaryBar({ deliveredList, pendingList, leaveList, totalMilk }) {
  const total = deliveredList.length + pendingList.length + leaveList.length;
  const deliveredPct = total > 0 ? Math.round((deliveredList.length / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Delivered', value: deliveredList.length, color: 'stat-card-green', icon: <Check className="w-4 h-4 text-emerald-600" /> },
        { label: 'Pending',   value: pendingList.length,   color: 'stat-card-amber', icon: <Package className="w-4 h-4 text-amber-600" /> },
        { label: 'On Leave',  value: leaveList.length,     color: 'stat-card-rose',  icon: <CalendarOff className="w-4 h-4 text-rose-500" /> },
        { label: 'Total Milk',value: `${totalMilk.toFixed(1)} L`, color: 'stat-card-blue', icon: <Milk className="w-4 h-4 text-indigo-600" /> },
      ].map(({ label, value, color, icon }) => (
        <div key={label} className={cn('rounded-3xl p-4 border border-slate-100 shadow-sm bg-white', color)}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center">
              {icon}
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{label}</p>
          </div>
          <p className="text-xl font-black text-slate-900">{value}</p>
        </div>
      ))}
      {/* Progress bar */}
      <div className="col-span-2 md:col-span-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
          <span>Delivery Progress</span>
          <span className="text-indigo-600">{deliveredPct}% Complete</span>
        </div>
        <div className="progress-bar-track">
          <div
            className={cn('progress-bar-fill', deliveredPct === 100 ? 'progress-bar-green' : 'progress-bar-blue')}
            style={{ width: `${deliveredPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Delivery Card ──────────────────────────────────────────────────────-─
function DeliveryCard({ customer, delivery, onAction, onQuickDeliver, onReset }) {
  const [extraQty,   setExtraQty]   = useState('');
  const [showExtra,  setShowExtra]  = useState(false);
  const [deliverQty, setDeliverQty] = useState('');

  const status       = getDeliveryStatus(delivery);
  const isDelivered  = status === 'delivered' || status === 'extra';
  const isLeave      = status === 'leave';
  const isPending    = status === 'pending';
  const isLongLeave  = delivery?.source === 'leave_request';
  const defaultQty   = parseFloat(customer.default_milk_quantity || customer.daily_milk_quantity || 0);
  const scheduledQty = defaultQty;
  const extraMilk    = parseFloat(delivery?.extra_milk || 0);

  const shiftIcon = customer.shift === 'evening'
    ? <Moon className="w-3 h-3 text-indigo-500" />
    : <Coffee className="w-3 h-3 text-amber-500" />;

  return (
    <Card className={cn(
      'p-5 transition-all duration-300 relative overflow-hidden group',
      isDelivered && 'border-l-4 border-l-emerald-500 bg-emerald-50/10',
      isLeave     && 'border-l-4 border-l-rose-400 bg-rose-50/10',
      isPending   && 'border-l-4 border-l-slate-200',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform duration-300 group-hover:scale-110',
            isDelivered ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100'
            : isLeave   ? 'bg-rose-100 text-rose-700 shadow-rose-100'
            : 'bg-slate-100 text-slate-500 shadow-slate-100 shadow-inner'
          )}>
            {getInitials(customer.name)}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-[15px] tracking-tight leading-none">#{customer.id} {customer.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                {shiftIcon} {customer.shift}
              </span>
              {customer.phone && (
                <span className="text-[10px] font-bold text-slate-300 tracking-tighter">📞 {customer.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div className={cn(
          'badge',
          isDelivered ? 'badge-success' : isLeave ? 'badge-danger' : 'badge-neutral'
        )}>
          {isDelivered ? '✓ Delivered' : isLeave ? 'On Leave' : 'Pending'}
        </div>
      </div>

      {/* Long leave banner */}
      {isLongLeave && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-700 font-bold">
          <CalendarOff className="w-4 h-4" />
          SYSTEM BLOCKED: CUSTOMER ON LONG LEAVE
        </div>
      )}

      {/* Quantities row */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard</p>
          <p className="text-sm font-black text-slate-700">{scheduledQty}L</p>
        </div>
        {isDelivered ? (
          <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Delivered</p>
            <p className="text-sm font-black text-emerald-700">{parseFloat(delivery.delivered_quantity || 0) + extraMilk}L</p>
          </div>
        ) : (
          <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 border-dashed">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-black text-slate-400 italic">Waiting...</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isLongLeave && (
        <div className="mt-5 pt-5 border-t border-slate-50 space-y-2.5">
          {isPending ? (
            <>
              {/* Quantity adjuster */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Milk className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={defaultQty}
                  onChange={(e) => setDeliverQty(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-xs font-bold text-slate-400">L</span>
              </div>
              <button
                onClick={() => {
                  const qty = parseFloat(deliverQty || defaultQty);
                  onQuickDeliver(customer, qty);
                }}
                className="w-full btn btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Check className="w-5 h-5 stroke-[3px]" />
                MARK AS DELIVERED
              </button>
              <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => onAction(customer, 'leave', 0, 0)} className="border-slate-100 text-slate-500 py-3.5 bg-slate-50/30">
                <CalendarOff className="w-4 h-4" />
                Leave
              </Button>
              <Button variant="outline" onClick={() => setShowExtra(!showExtra)} className="border-slate-100 text-slate-500 py-3.5 bg-slate-50/30">
                <Plus className="w-4 h-4" />
                Extra
              </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onReset(delivery)} className="flex-1 text-[11px] py-3 text-rose-500 hover:bg-rose-50 rounded-xl font-black uppercase tracking-tighter">
                Reset to Pending
              </Button>
              <Button variant="ghost" onClick={() => setShowExtra(!showExtra)} className="flex-1 text-[11px] py-3 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold">
                {extraMilk > 0 ? 'Update Extra' : 'Add Extra Milk'}
              </Button>
            </div>
          )}

          {showExtra && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 mt-2">
              <input
                type="number"
                step="0.1"
                autoFocus
                placeholder="Liters"
                value={extraQty}
                onChange={(e) => setExtraQty(e.target.value)}
                className="w-full bg-white border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-indigo-200"
              />
              <button
                onClick={() => {
                  onAction(customer, 'extra', scheduledQty, parseFloat(extraQty || 0));
                  setExtraQty('');
                  setShowExtra(false);
                }}
                className="btn btn-primary px-6 py-2 text-xs uppercase tracking-widest font-black"
              >
                Save
              </button>
            </motion.div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Deliveries Page ─────────────────────────────────────────────────
export default function Deliveries() {
  const queryClient = useQueryClient();
  const [selectedDate,    setSelectedDate]    = useState(getToday());
  const [selectedShift,   setSelectedShift]   = useState('all');
  const [selectedRoute,   setSelectedRoute]   = useState('all');
  const [modalState,      setModalState]      = useState({ isOpen: false, customer: null, action: null, payload: null });
  const [leaveForm,       setLeaveForm]       = useState({ customer_id: '', start_date: '', end_date: '', reason: '' });
  const [showLeaveForm,   setShowLeaveForm]   = useState(false);
  const [resetTarget,     setResetTarget]     = useState(null); // delivery object
  const undoTimeouts = useRef({});

  const { data: customers = [], isLoading: loadingCust, isError: custIsError, error: _custError, refetch: refetchCust } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => api.customers.getAll(),
  });

  const { data: allLeaves = [] } = useQuery({
    queryKey: ['all-leaves'],
    queryFn:  () => api.leave.getAll(),
  });

  const onLeaveCustomerIds = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const ids = new Set();
    allLeaves.forEach(l => {
      if (l.start_date <= today && (!l.end_date || l.end_date >= today)) {
        ids.add(l.customer_id);
      }
    });
    return ids;
  }, [allLeaves]);

  const { data: deliveries = [], isLoading: loadingDel, isError: delIsError, error: _delError, refetch, isFetching } = useQuery({
    queryKey: ['deliveries', selectedDate],
    queryFn:  () => api.deliveries.getAll({ date: selectedDate }),
  });

  // Cleanup on unmount
  useEffect(() => {
    const timeouts = undoTimeouts.current;
    return () => Object.values(timeouts).forEach(clearTimeout);
  }, []);

  const activeCustomers = useMemo(() => {
    let result = customers.filter(c => c.status === 'active');
    if (selectedShift !== 'all') result = result.filter(c => c.shift === selectedShift);
    if (selectedRoute !== 'all') result = result.filter(c => c.route_area === selectedRoute);
    return result;
  }, [customers, selectedShift, selectedRoute]);

  const routes = useMemo(() => {
    const uniqueRoutes = [...new Set(customers.map(c => c.route_area).filter(Boolean))];
    return ['all', ...uniqueRoutes];
  }, [customers]);

  const { deliveredList, pendingList, leaveList, totalMilk } = useMemo(() => {
    const dList = [], pList = [], lList = [];
    let milk = 0;
    
    activeCustomers.forEach(customer => {
      // Robust matching: prioritize explicit delivery entries
      const delivery = deliveries.find(d => 
        Number(d.customer_id) === Number(customer.id)
      );
      
      const status   = getDeliveryStatus(delivery);
      if (status === 'delivered' || status === 'extra') {
        dList.push({ customer, delivery });
        milk += parseFloat(delivery?.delivered_quantity || 0) + parseFloat(delivery?.extra_milk || 0);
      } else if (status === 'leave') {
        lList.push({ customer, delivery });
      } else {
        pList.push({ customer, delivery: null });
      }
    });
    
    return { deliveredList: dList, pendingList: pList, leaveList: lList, totalMilk: milk };
  }, [activeCustomers, deliveries]);

  const buildPayload = (customer, status, baseQuantity, extraMilk) => ({
    customer_id:        Number(customer.id),
    customer_name:      customer.name,
    date:               selectedDate,
    scheduled_quantity: parseFloat(customer.default_milk_quantity || customer.daily_milk_quantity || 0),
    delivered_quantity: status === 'leave' ? 0 : parseFloat(baseQuantity || 0),
    status,
    delivered:          status === 'delivered' || status === 'extra',
    leave:              status === 'leave',
    extra_milk:         status === 'leave' ? 0 : parseFloat(extraMilk || 0),
    delivery_shift:     customer.shift || 'morning',
    is_deleted:         false,
  });

  const handleQuickDeliver = async (customer, customQty) => {
    const qty = customQty || parseFloat(customer.default_milk_quantity || customer.daily_milk_quantity || 0);
    const payload = buildPayload(customer, 'delivered', qty, 0);
    
    // 1. Instant Cache Update
    queryClient.setQueryData(['deliveries', selectedDate], (old = []) => {
      const entry = { 
        ...payload, 
        id: `temp-${Date.now()}`, 
        delivered: true, 
        leave: false,
        status: 'delivered',
        session: customer.shift || 'morning',
        delivery_shift: customer.shift || 'morning'
      };
      const idx = old.findIndex(d => Number(d.customer_id) === Number(customer.id));
      if (idx > -1) {
        const next = [...old];
        next[idx] = entry;
        return next;
      }
      return [...old, entry];
    });

    try {
      await api.deliveries.create(payload);
      toast.success(`Marked #${customer.id} ${customer.name}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      queryClient.invalidateQueries({ queryKey: ['deliveries', selectedDate] });
    }
  };

  const handleReset = async (delivery) => {
    if (!delivery?.id) return;
    if (String(delivery.id).startsWith('temp-')) return;
    setResetTarget(delivery);
  };

  const confirmReset = async () => {
    if (!resetTarget?.id) return;
    const deliveryId = resetTarget.id;
    setResetTarget(null);
    try {
      await api.deliveries.softDelete(deliveryId);
      queryClient.invalidateQueries({ queryKey: ['deliveries', selectedDate] });
      toast.success('Reset to pending');
    } catch (err) {
      toast.error('Failed to reset: ' + err.message);
    }
  };

  const handleActionClick = (customer, status, baseQuantity, extraMilk) => {
    setModalState({
      isOpen: true,
      customer,
      action:  status,
      payload: buildPayload(customer, status, baseQuantity, extraMilk),
    });
  };

  const closeModal = () => setModalState({ isOpen: false, customer: null, action: null, payload: null });

  const confirmAction = async () => {
    if (!modalState.payload) return;
    const payload = modalState.payload;
    const customerId = payload.customer_id;
    
    closeModal();

    // 1. Instant Cache Update
    queryClient.setQueryData(['deliveries', selectedDate], (old = []) => {
      const entry = { 
        ...payload, 
        id: `temp-${Date.now()}`, 
        delivered: payload.status !== 'leave',
        leave: payload.status === 'leave',
        status: payload.status
      };
      const idx = old.findIndex(d => Number(d.customer_id) === Number(customerId));
      if (idx > -1) {
        const next = [...old];
        next[idx] = entry;
        return next;
      }
      return [...old, entry];
    });

    try {
      await api.deliveries.create(payload);
      toast.success('✅ Saved');
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally {
      queryClient.invalidateQueries({ queryKey: ['deliveries', selectedDate] });
    }
  };

  const submitLongLeave = async () => {
    if (!leaveForm.customer_id || !leaveForm.start_date) {
      toast.error('Select customer and start date');
      return;
    }
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (leaveForm.start_date < today) {
      toast.error('Leave cannot be applied for past dates');
      return;
    }
    try {
      await api.leave.create({
        customer_id: Number(leaveForm.customer_id),
        start_date:  leaveForm.start_date,
        end_date:    leaveForm.end_date || null,
        reason:      leaveForm.reason || null,
      });
      toast.success('📅 Long leave saved');
      setLeaveForm({ customer_id: '', start_date: '', end_date: '', reason: '' });
      setShowLeaveForm(false);
      // Wait for cache to clear so UI updates
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['all-leaves'] });
    } catch (error) {
      toast.error(error.message || 'Failed to save leave');
    }
  };

  const navigateDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (custIsError || delIsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Failed to load deliveries</h3>
          <p className="text-sm text-red-500 mb-4">Something went wrong while fetching data. Please try again.</p>
          <Button onClick={() => { refetchCust(); refetch(); }}>
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (loadingCust || loadingDel) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44" />)}
    </div>
  );

  return (
    <>
      {/* Reset confirmation modal */}
      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={confirmReset}
        title="Reset Delivery?"
        message="Reset this delivery to pending? This will remove the current status."
        confirmText="Yes, Reset"
        cancelText="Cancel"
        variant="danger"
      />

    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Deliveries</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching} 
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-indigo-600 transition-colors border border-slate-100"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
        </div>

        {/* Date navigator + shift filter */}
        <Card className="p-3 flex flex-col sm:flex-row gap-3 border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigateDate(-1)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); }}
              className="flex-1 text-center font-black text-slate-800 border-none bg-transparent focus:ring-0"
            />
            <button onClick={() => navigateDate(1)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <Select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            options={[
              { value: 'all',     label: '🌅 All Shifts' },
              { value: 'morning', label: '☀️ Morning' },
              { value: 'evening', label: '🌙 Evening' },
            ]}
            className="w-full sm:w-40"
          />
          <Select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            options={routes.map(r => ({ value: r, label: r === 'all' ? '🚩 All Routes' : `📍 ${r}` }))}
            className="w-full sm:w-40"
          />
          <Button variant="ghost" onClick={() => { setSelectedDate(getToday()); }} className="text-xs font-black text-indigo-600 whitespace-nowrap uppercase tracking-widest">
            Today
          </Button>
        </Card>

        {/* Daily summary */}
        <DailySummaryBar
          deliveredList={deliveredList}
          pendingList={pendingList}
          leaveList={leaveList}
          totalMilk={totalMilk}
        />

        {/* Long Leave panel (collapsible) */}
        <Card className="border-slate-100 p-0 overflow-hidden shadow-sm">
          <button
            onClick={() => { setShowLeaveForm(!showLeaveForm); if (showLeaveForm) setLeaveForm({ customer_id: '', start_date: '', end_date: '', reason: '' }); }}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
          >
            <div>
              <p className="font-black text-slate-900 text-sm tracking-tight">📅 MARK LONG LEAVE</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Block deliveries for a date range</p>
            </div>
            <ChevronLeft className={cn('w-5 h-5 text-slate-300 transition-transform duration-300', showLeaveForm ? '-rotate-90' : 'rotate-180')} />
          </button>
          {showLeaveForm && (
            <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-5 gap-3 animate-slide-down">
              <Select
                value={leaveForm.customer_id}
                onChange={(e) => setLeaveForm(p => ({ ...p, customer_id: e.target.value }))}
                options={[
                  { value: '', label: 'Select customer' },
                  ...activeCustomers.map(c => ({ value: c.id, label: onLeaveCustomerIds.has(c.id) ? `🏖️ #${c.id} ${c.name} - ${c.phone} (On Leave)` : `#${c.id} ${c.name} - ${c.phone}` })),
                ]}
              />
              <Input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} placeholder="Start date" />
              <div className="flex flex-col gap-1">
                <Input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} placeholder="End date" />
                <p className="text-[9px] text-slate-400 ml-1 font-bold italic">* Optional if unknown</p>
              </div>
              <Input value={leaveForm.reason} onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (optional)" />
          <Button variant="warning" onClick={submitLongLeave} className="py-3 shadow-amber-100">
            SAVE LEAVE
          </Button>
            </div>
          )}
        </Card>

        {/* Delivery sections */}
        {activeCustomers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Package className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No active customers found</p>
          </div>
        ) : (
          <div className="space-y-10">
            {pendingList.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5 ml-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse" />
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Pending ({pendingList.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingList.map(({ customer }) => (
                    <DeliveryCard key={customer.id} customer={customer} delivery={null} onAction={handleActionClick} onQuickDeliver={handleQuickDeliver} onReset={handleReset} />
                  ))}
                </div>
              </section>
            )}

            {deliveredList.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5 ml-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Delivered ({deliveredList.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {deliveredList.map(({ customer, delivery }) => (
                    <DeliveryCard key={customer.id} customer={customer} delivery={delivery} onAction={handleActionClick} onQuickDeliver={handleQuickDeliver} onReset={handleReset} />
                  ))}
                </div>
              </section>
            )}

            {leaveList.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5 ml-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h2 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em]">On Leave ({leaveList.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80">
                  {leaveList.map(({ customer, delivery }) => (
                    <DeliveryCard key={customer.id} customer={customer} delivery={delivery} onAction={handleActionClick} onQuickDeliver={handleQuickDeliver} onReset={handleReset} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={confirmAction}
        title={`Confirm ${modalState.action === 'leave' ? 'Leave' : modalState.action === 'extra' ? 'Extra Milk' : 'Delivery'}?`}
        message={modalState.customer
          ? `Mark ${modalState.customer.name} as ${modalState.action}?`
          : ''}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
    </>
  );
}
