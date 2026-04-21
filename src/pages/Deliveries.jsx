import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check, X, Plus, Package, ChevronLeft, ChevronRight,
  RefreshCw, Undo2, Repeat2, Milk, Coffee, Moon, CalendarOff,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { cn, getToday, getInitials } from '../lib/utils';
import { Card, ConfirmModal, Input, Select } from '../ui';


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
        <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <p className="text-xs text-gray-500 font-medium">{label}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      ))}
      {/* Progress bar spanning full width */}
      <div className="col-span-2 md:col-span-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Delivery Progress</span>
          <span className="font-semibold">{deliveredPct}% done</span>
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
function DeliveryCard({ customer, delivery, onAction }) {
  const [extraQty,   setExtraQty]   = useState('');
  const [showExtra,  setShowExtra]  = useState(false);

  const status       = getDeliveryStatus(delivery);
  const isDelivered  = status === 'delivered' || status === 'extra';
  const isLeave      = status === 'leave';
  const isPending    = status === 'pending';
  const isLongLeave  = delivery?.source === 'leave_request';
  const scheduledQty = parseFloat(customer.default_milk_quantity || customer.daily_milk_quantity || 0);
  const extraMilk    = parseFloat(delivery?.extra_milk || 0);

  const shiftIcon = customer.shift === 'evening'
    ? <Moon className="w-3 h-3 text-indigo-500" />
    : <Coffee className="w-3 h-3 text-amber-500" />;

  return (
    <Card className={cn(
      'glass-card p-4 transition-all duration-300',
      isDelivered && 'border-l-4 border-l-emerald-500',
      isLeave     && 'border-l-4 border-l-amber-400',
      isPending   && 'border-l-4 border-l-gray-200',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
            isDelivered ? 'bg-emerald-100 text-emerald-700'
            : isLeave   ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-600'
          )}>
            {getInitials(customer.name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{customer.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {shiftIcon}
              <span className="text-xs text-gray-400">{customer.shift}</span>
              {customer.phone && (
                <span className="text-xs text-gray-300">· {customer.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div className={cn(
          'badge',
          isDelivered ? 'badge-success' : isLeave ? 'badge-warning' : 'badge-neutral'
        )}>
          {isDelivered ? '✓ Done' : isLeave ? '🏖 Leave' : '⏳ Pending'}
        </div>
      </div>

      {/* Long leave banner */}
      {isLongLeave && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
          <CalendarOff className="w-3.5 h-3.5" />
          On scheduled long leave
        </div>
      )}

      {/* Quantities row */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
          <span className="text-gray-400">Scheduled </span>
          <span className="font-bold text-gray-700">{scheduledQty}L</span>
        </div>
        {isDelivered && delivery?.delivered_quantity != null && (
          <div className="bg-emerald-50 px-3 py-1.5 rounded-lg">
            <span className="text-emerald-600">Delivered </span>
            <span className="font-bold text-emerald-700">{delivery.delivered_quantity}L</span>
          </div>
        )}
        {extraMilk > 0 && (
          <div className="bg-indigo-50 px-3 py-1.5 rounded-lg">
            <span className="text-indigo-600">Extra </span>
            <span className="font-bold text-indigo-700">+{extraMilk}L</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isLongLeave && (
        <div className="mt-4 space-y-2">
          {isPending ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAction(customer, 'delivered', scheduledQty, 0)}
                  className="btn btn-success text-xs py-2.5"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Delivered
                </button>
                <button
                  onClick={() => onAction(customer, 'leave', 0, 0)}
                  className="btn btn-amber text-xs py-2.5"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" /> Leave
                </button>
              </div>
              <button
                className="btn btn-ghost text-xs w-full text-indigo-600"
                onClick={() => setShowExtra(!showExtra)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Extra Milk
              </button>
              {showExtra && (
                <div className="flex gap-2 animate-slide-up">
                  <Input
                    type="number" step="0.5" min="0"
                    placeholder="Extra Qty (L)"
                    value={extraQty}
                    onChange={(e) => setExtraQty(e.target.value)}
                    className="flex-1 h-10 text-sm"
                  />
                  <button
                    className="btn btn-primary text-xs px-4"
                    onClick={() => {
                      const parsed = parseFloat(extraQty);
                      if (parsed > 0) {
                        onAction(customer, 'extra', scheduledQty, parsed);
                        setExtraQty('');
                        setShowExtra(false);
                      }
                    }}
                  >Add</button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn btn-ghost text-xs py-2"
                  onClick={() => onAction(customer,
                    isLeave ? 'delivered' : 'leave',
                    isLeave ? scheduledQty : 0, 0
                  )}
                >
                  <Repeat2 className="w-3.5 h-3.5 mr-1" />
                  {isLeave ? 'Mark Delivered' : 'Mark Leave'}
                </button>
                <button
                  className="btn btn-ghost text-xs py-2 text-indigo-600"
                  onClick={() => { setShowExtra(!showExtra); setExtraQty(extraMilk ? String(extraMilk) : ''); }}
                  disabled={isLeave}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Edit Extra
                </button>
              </div>
              {showExtra && !isLeave && (
                <div className="flex gap-2 animate-slide-up">
                  <Input
                    type="number" step="0.5" min="0"
                    placeholder="Extra Qty (L)"
                    value={extraQty}
                    onChange={(e) => setExtraQty(e.target.value)}
                    className="flex-1 h-10 text-sm"
                  />
                  <button
                    className="btn btn-primary text-xs px-4"
                    onClick={() => {
                      const parsed = parseFloat(extraQty || 0);
                      onAction(customer, parsed > 0 ? 'extra' : 'delivered', scheduledQty, parsed);
                      setShowExtra(false);
                    }}
                  >Save</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Deliveries Page ─────────────────────────────────────────────────
export default function Deliveries() {
  const queryClient        = useQueryClient();
  const [selectedDate,    setSelectedDate]    = useState(getToday());
  const [selectedShift,   setSelectedShift]   = useState('all');
  const [modalState,      setModalState]      = useState({ isOpen: false, customer: null, action: null, payload: null });
  const [leaveForm,       setLeaveForm]       = useState({ customer_id: '', start_date: '', end_date: '', reason: '' });
  const [showLeaveForm,   setShowLeaveForm]   = useState(false);
  const [optimisticDeliveries, setOptimisticDeliveries] = useState([]);
  const undoTimeouts = useRef({});

  const { data: customers  = [], isLoading: loadingCust } = useQuery({
    queryKey: ['customers'],
    queryFn:  api.customers.getAll,
  });

  const { data: deliveries = [], isLoading: loadingDel, refetch, isFetching } = useQuery({
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
    return result;
  }, [customers, selectedShift]);

  const visibleDeliveries = useMemo(() => {
    const merged = deliveries.filter(d => !d.is_deleted);
    optimisticDeliveries.forEach((pending) => {
      const idx = merged.findIndex(d =>
        d.customer_id === pending.customer_id &&
        d.date        === pending.date &&
        d.delivery_shift === pending.delivery_shift
      );
      if (idx >= 0) merged[idx] = pending;
      else merged.push(pending);
    });
    return merged;
  }, [deliveries, optimisticDeliveries]);

  const { deliveredList, pendingList, leaveList, totalMilk } = useMemo(() => {
    const dList = [], pList = [], lList = [];
    let milk = 0;
    activeCustomers.forEach(customer => {
      const delivery = visibleDeliveries.find(d => d.customer_id === customer.id && !d.is_deleted);
      const status   = getDeliveryStatus(delivery);
      if (status === 'delivered' || status === 'extra') {
        dList.push({ customer, delivery });
        milk += parseFloat(delivery?.delivered_quantity || 0) + parseFloat(delivery?.extra_milk || 0);
      } else if (status === 'leave') lList.push({ customer, delivery });
      else pList.push({ customer, delivery: null });
    });
    return { deliveredList: dList, pendingList: pList, leaveList: lList, totalMilk: milk };
  }, [activeCustomers, visibleDeliveries]);

  const buildPayload = (customer, status, baseQuantity, extraMilk) => ({
    customer_id:        customer.id,
    customer_name:      customer.name,
    date:               selectedDate,
    scheduled_quantity: parseFloat(customer.default_milk_quantity || customer.daily_milk_quantity || 0),
    delivered_quantity: status === 'leave' ? 0 : parseFloat(baseQuantity || 0),
    status,
    delivered:          status !== 'leave',
    leave:              status === 'leave',
    extra_milk:         status === 'leave' ? 0 : parseFloat(extraMilk || 0),
    delivery_shift:     customer.shift || 'morning',
    is_deleted:         false,
  });

  const handleActionClick = (customer, status, baseQuantity, extraMilk) => {
    setModalState({
      isOpen: true,
      customer,
      action:  status,
      payload: buildPayload(customer, status, baseQuantity, extraMilk),
    });
  };

  const closeModal = () => setModalState({ isOpen: false, customer: null, action: null, payload: null });

  const confirmAction = () => {
    if (!modalState.payload) return;
    const payload  = modalState.payload;
    const tempId   = `pending-${Date.now()}-${payload.customer_id}`;
    const optimistic = { ...payload, id: tempId, pending_sync: true };
    closeModal();
    setOptimisticDeliveries(prev => [...prev, optimistic]);

    const timeoutId = setTimeout(async () => {
      try {
        await api.deliveries.create(payload);
        setOptimisticDeliveries(prev => prev.filter(d => d.id !== tempId));
        queryClient.invalidateQueries({ queryKey: ['deliveries'] });
        toast.success('✅ Delivery saved');
      } catch (error) {
        setOptimisticDeliveries(prev => prev.filter(d => d.id !== tempId));
        toast.error(error.message || 'Failed to save delivery');
      } finally {
        delete undoTimeouts.current[tempId];
      }
    }, 5000);

    undoTimeouts.current[tempId] = timeoutId;

    toast((t) => (
      <span className="flex items-center gap-3 text-sm">
        <span>Marked: <strong>{payload.customer_name}</strong></span>
        <button
          className="text-red-500 font-bold text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
          onClick={() => {
            clearTimeout(undoTimeouts.current[tempId]);
            delete undoTimeouts.current[tempId];
            setOptimisticDeliveries(prev => prev.filter(d => d.id !== tempId));
            toast.dismiss(t.id);
            toast.success('↩ Action undone');
          }}
        >
          <Undo2 className="w-3 h-3 inline mr-1" />UNDO
        </button>
      </span>
    ), { duration: 5000 });
  };

  const submitLongLeave = async () => {
    if (!leaveForm.customer_id || !leaveForm.start_date || !leaveForm.end_date) {
      toast.error('Select customer and date range');
      return;
    }
    try {
      await api.leave.create({
        customer_id: Number(leaveForm.customer_id),
        start_date:  leaveForm.start_date,
        end_date:    leaveForm.end_date,
        reason:      leaveForm.reason,
      });
      toast.success('📅 Long leave saved');
      setLeaveForm({ customer_id: '', start_date: '', end_date: '', reason: '' });
      setShowLeaveForm(false);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    } catch (error) {
      toast.error(error.message || 'Failed to save leave');
    }
  };

  const navigateDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
    setOptimisticDeliveries([]);
  };

  if (loadingCust || loadingDel) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44" />)}
    </div>
  );

  return (
    <div className="pb-28">
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gradient">Deliveries</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching} className="btn btn-ghost p-2">
            <RefreshCw className={cn('w-5 h-5 text-indigo-500', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* Date navigator + shift filter */}
        <Card className="glass-card p-3 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigateDate(-1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setOptimisticDeliveries([]); }}
              className="flex-1 text-center font-semibold text-gray-800"
            />
            <button onClick={() => navigateDate(1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
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
          <button
            onClick={() => { setSelectedDate(getToday()); setOptimisticDeliveries([]); }}
            className="btn btn-ghost text-xs text-indigo-600 whitespace-nowrap"
          >
            Today
          </button>
        </Card>

        {/* Daily summary */}
        <DailySummaryBar
          deliveredList={deliveredList}
          pendingList={pendingList}
          leaveList={leaveList}
          totalMilk={totalMilk}
        />

        {/* Long Leave panel (collapsible) */}
        <Card className="glass-card">
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <p className="font-bold text-gray-900 text-sm">📅 Mark Long Leave</p>
              <p className="text-xs text-gray-400 mt-0.5">Block deliveries for a date range</p>
            </div>
            <ChevronLeft className={cn('w-5 h-5 text-gray-400 transition-transform', showLeaveForm ? '-rotate-90' : 'rotate-180')} />
          </button>
          {showLeaveForm && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-5 gap-3 animate-slide-down">
              <Select
                value={leaveForm.customer_id}
                onChange={(e) => setLeaveForm(p => ({ ...p, customer_id: e.target.value }))}
                options={[
                  { value: '', label: 'Select customer' },
                  ...activeCustomers.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
              <Input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} placeholder="Start date" />
              <Input type="date" value={leaveForm.end_date}   onChange={(e) => setLeaveForm(p => ({ ...p, end_date:   e.target.value }))} placeholder="End date" />
              <Input value={leaveForm.reason} onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (optional)" />
              <button onClick={submitLongLeave} className="btn btn-amber">
                Save Leave
              </button>
            </div>
          )}
        </Card>

        {/* Delivery sections */}
        {activeCustomers.length === 0 ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <Package className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-900">No active customers</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingList.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <h2 className="text-base font-bold text-gray-700">Pending ({pendingList.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingList.map(({ customer }) => (
                    <DeliveryCard key={customer.id} customer={customer} delivery={null} onAction={handleActionClick} />
                  ))}
                </div>
              </section>
            )}

            {deliveredList.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-bold text-emerald-700">Delivered ({deliveredList.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  {deliveredList.map(({ customer, delivery }) => (
                    <DeliveryCard key={customer.id} customer={customer} delivery={delivery} onAction={handleActionClick} />
                  ))}
                </div>
              </section>
            )}

            {leaveList.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h2 className="text-base font-bold text-amber-700">On Leave ({leaveList.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                  {leaveList.map(({ customer, delivery }) => (
                    <DeliveryCard key={customer.id} customer={customer} delivery={delivery} onAction={handleActionClick} />
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
  );
}
