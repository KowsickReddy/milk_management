import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Plus, RefreshCw, Phone, MapPin, Edit2, Trash2,
  Search, Milk, Wallet, UserCheck, UserX, Users, Key, BarChart3,
  Calendar, CheckCircle2, Clock, TrendingUp, CalendarOff
} from 'lucide-react';
import api from '../services/api';
import {
  Button, Card, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Select,
} from '../ui';
import { toast } from 'react-hot-toast';
import { getInitials, formatCurrency, cn, getMonthName } from '../lib/utils';

// ── Validation schema ─────────────────────────────────────────────────────
const schema = yup.object().shape({
  name:                yup.string().required('Name is required').min(2),
  phone:               yup.string()
    .matches(/^[0-9]{10}$/, { message: 'Must be exactly 10 digits', excludeEmptyString: true })
    .optional().nullable(),
  address:             yup.string().required('Address is required'),
  daily_milk_quantity: yup.number().typeError('Required').positive('Must be > 0').required(),
  milk_rate_per_liter: yup.number().typeError('Required').positive('Must be > 0').required(),
  shift:               yup.string().required(),
  status:              yup.string().required(),
  route_area:          yup.string().optional(),
  evening_milk_quantity: yup.number().typeError('Invalid').nullable().transform((v) => v || null),
});

// ── Customer Form Modal ───────────────────────────────────────────────────
function CustomerFormModal({ isOpen, onClose, editingCustomer }) {
  const queryClient = useQueryClient();

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: editingCustomer || {
      name: '', phone: '', address: '',
      daily_milk_quantity: '', milk_rate_per_liter: '',
      shift: 'morning', status: 'active', route_area: 'Default',
      evening_milk_quantity: '',
    },
  });

  // Watch the shift field live via RHF so evening field enables/disables reactively
  const effectiveShift = watch('shift') || 'morning';

  useEffect(() => {
    if (isOpen) {
      reset(editingCustomer || {
        name: '', phone: '', address: '',
        daily_milk_quantity: '', milk_rate_per_liter: '',
        shift: 'morning', status: 'active', route_area: 'Default',
        evening_milk_quantity: '',
      });
    }
  }, [isOpen, editingCustomer, reset]);

  const mutation = useMutation({
    mutationFn: editingCustomer
      ? (data) => api.customers.update(editingCustomer.id, data)
      : (data) => api.customers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(editingCustomer ? '✅ Customer updated' : '✅ Customer added');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen) return null;

  const field = (label, name, type = 'text', extra = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...register(name)}
        type={type}
        {...extra}
        className={cn(
          'input',
          errors[name] ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : ''
        )}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
    </div>
  );

  return (
    <ModalContent isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        {editingCustomer ? '✏️ Edit Customer' : '➕ Add New Customer'}
      </ModalHeader>
      <form onSubmit={handleSubmit(mutation.mutate)} noValidate>
        <ModalBody className="space-y-4">
          {field('Full Name', 'name')}
          {field('Phone Number', 'phone', 'tel', { placeholder: '10-digit mobile' })}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              {...register('address')}
              rows={2}
              className={cn('input resize-none', errors.address ? 'border-red-400' : '')}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Rate per Liter (₹)', 'milk_rate_per_liter', 'number', { step: '0.5', placeholder: '28' })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select {...register('shift')} className="input">
                <option value="morning">☀️ Morning Only</option>
                <option value="evening">🌙 Evening Only</option>
                <option value="both">🌗 Both (Morning & Evening)</option>
                <option value="occasional">🔄 Occasional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Morning Quantity (L)', 'daily_milk_quantity', 'number', { step: '0.5', placeholder: '2' })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evening Quantity (L)</label>
              <input
                {...register('evening_milk_quantity')}
                type="number"
                step="0.5"
                placeholder={effectiveShift === 'both' ? '1.0' : '(same as morning)'}
                className={cn('input', errors.evening_milk_quantity ? 'border-red-400' : '')}
                disabled={effectiveShift !== 'both'}
              />
              {effectiveShift === 'both' && (
                <p className="text-[10px] text-indigo-500 mt-1 font-medium">Leave empty to use morning quantity</p>
              )}
              {effectiveShift !== 'both' && (
                <p className="text-[10px] text-gray-400 mt-1 italic">Set shift to 'Both' to customize evening quantity</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Route / Area', 'route_area', 'text', { placeholder: 'Ex: Sector 14' })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className="input">
                <option value="active">✅ Active</option>
                <option value="inactive">⏸ Inactive</option>
              </select>
            </div>
          </div>


        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}

// ── Manage Access Modal ──────────────────────────────────────────────────
function ManageAccessModal({ isOpen, onClose, customer }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPin('');
  }, [isOpen]);

  const handleUpdatePin = async () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    setLoading(true);
    try {
      await api.customers.updatePin(customer.id, pin);
      toast.success('Login PIN updated successfully');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <ModalContent isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>🔐 Manage Access</ModalHeader>
      <ModalBody className="space-y-4">
        <div className="p-4 bg-indigo-50 rounded-2xl">
          <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Customer Identifier</p>
          <p className="font-bold text-indigo-900">#{customer.id} {customer.name}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">📞 {customer.phone || 'No phone registered'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Set New PIN</label>
          <input
            type="text"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Ex: 1234"
            className="input font-mono tracking-widest text-lg text-center"
          />
          <p className="text-[10px] text-gray-400 mt-2">PIN should be 4-6 digits. Provide this PIN to the customer for portal login.</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpdatePin} disabled={loading || pin.length < 4}>
          {loading ? 'Saving...' : 'Update PIN'}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}

// ── Customer Summary Modal ───────────────────────────────────────────────
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));

function CustomerSummaryModal({ isOpen, onClose, customer }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data: report, isLoading: reportLoading, isError: reportError, refetch: refetchReport } = useQuery({
    queryKey: ['customer-report', customer?.id, startDate, endDate],
    queryFn: () => api.reports.getCustomer(customer.id, startDate, endDate),
    enabled: !!customer,
  });

  const { data: bills = [], isError: billsError, refetch: refetchBills } = useQuery({
    queryKey: ['customer-bills', customer?.id],
    queryFn: () => api.bills.getAll({ customerId: customer.id }),
    enabled: !!customer,
  });

  const { data: leaves = [], isError: leavesError, refetch: refetchLeaves } = useQuery({
    queryKey: ['customer-leaves', customer?.id],
    queryFn: () => api.leave.getAll({ customerId: customer.id }),
    enabled: !!customer,
  });

  if (!isOpen || !customer) return null;
  const hasError = reportError || billsError || leavesError;
  if (hasError) {
    return (
      <ModalContent isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalHeader onClose={onClose}>Error Loading Customer Summary</ModalHeader>
        <ModalBody>
          <div className="text-center py-8 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
            <p className="font-bold text-red-600">Failed to load customer data</p>
            <div className="flex gap-2 justify-center mt-3">
              <Button onClick={() => refetchReport()} size="sm">Retry Report</Button>
              <Button onClick={() => refetchBills()} size="sm">Retry Bills</Button>
              <Button onClick={() => refetchLeaves()} size="sm">Retry Leaves</Button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    );
  }
  const summary = report?.summary || {};
  const bill = report?.bill;
  const totalDaysInPeriod = lastDay;

  // Bill payment status
  const allBills = bills || [];
  const totalBilled = allBills.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const totalPaid = allBills.reduce((s, b) => s + Number(b.amount_paid || 0), 0);
  const totalPending = allBills.reduce((s, b) => s + Number(b.balance || 0), 0);
  // Long leaves calculation  
  const longLeaves = leaves || [];
  const totalLongLeaveDays = longLeaves.reduce((s, l) => {
    const sd = new Date(l.start_date);
    const ed = new Date(l.end_date);
    const days = Math.max(0, Math.ceil((ed - sd) / (1000 * 60 * 60 * 24)) + 1);
    return s + days;
  }, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {getInitials(customer.name)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">#{customer.id} {customer.name}</h2>
              <p className="text-xs text-gray-400">{customer.phone || 'No phone'} · {customer.route_area || 'No route'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={MONTHS}
              className="w-28 sm:w-36"
            />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input w-20 sm:w-24 text-center"
            />
            <span className="text-[10px] sm:text-xs text-gray-400">{startDate} → {endDate}</span>
          </div>

          {reportLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}
            </div>
          ) : (
            <>
              {/* Delivery summary */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Milk className="w-4 h-4 text-indigo-500" /> Delivery Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Active Days', value: `${summary.total_delivered_days || 0} / ${totalDaysInPeriod}`, color: 'stat-card-blue' },
                    { label: 'Leave Days', value: summary.total_leave_days || 0, color: 'stat-card-amber' },
                    { label: 'Milk Delivered', value: `${Number(summary.total_milk || 0).toFixed(1)} L`, color: 'stat-card-green' },
                    { label: 'Extra Milk', value: `${Number(summary.total_extra_milk || 0).toFixed(1)} L`, color: 'stat-card-purple' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
                      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-500" /> Financial Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Gross Amount', value: formatCurrency(summary.gross_amount || 0), color: 'stat-card-blue' },
                    { label: 'Rate', value: `₹${summary.milk_rate_per_liter || 0}/L`, color: 'stat-card-purple' },
                    { label: 'Total Billed', value: formatCurrency(totalBilled), color: 'stat-card-green' },
                    { label: 'Total Paid', value: formatCurrency(totalPaid), color: 'stat-card-amber' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
                      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current bill status */}
              {bill && (
                <div className={cn(
                  'rounded-2xl p-4 border',
                  bill.paid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {bill.paid
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        : <Clock className="w-5 h-5 text-amber-600" />
                      }
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {getMonthName(bill.bill_month)} {bill.bill_year} — {bill.paid ? 'Paid' : 'Unpaid'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {bill.total_quantity}L · ₹{bill.total_amount} · Balance: ₹{bill.balance}
                        </p>
                      </div>
                    </div>
                    <span className={cn('text-lg font-black', bill.paid ? 'text-emerald-600' : 'text-amber-600')}>
                      ₹{bill.final_amount || bill.total_amount || 0}
                    </span>
                  </div>
                </div>
              )}

              {/* All bills history */}
              {allBills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Bill History</h3>
                  <div className="space-y-2">
                    {allBills.slice(0, 6).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{getMonthName(b.bill_month)} {b.bill_year}</span>
                          <span className={cn('badge text-[10px]', b.paid ? 'badge-success' : 'badge-warning')}>
                            {b.paid ? 'Paid' : `₹${b.balance} due`}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(b.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long Leaves / Holidays */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" /> Long Leaves / Holidays
                </h3>
                {longLeaves.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No long leaves recorded</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      {longLeaves.length} leave period(s) · <strong>{totalLongLeaveDays} total days</strong>
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {longLeaves.map(l => {
                        const sd = new Date(l.start_date);
                        const ed = new Date(l.end_date);
                        const days = Math.max(0, Math.ceil((ed - sd) / (1000 * 60 * 60 * 24)) + 1);
                        return (
                          <div key={l.id} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-xl text-sm">
                            <div>
                              <p className="font-medium text-amber-900">{sd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {ed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              {l.reason && <p className="text-xs text-amber-600">{l.reason}</p>}
                            </div>
                            <span className="badge badge-warning text-[10px]">{days} day{days > 1 ? 's' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Smart calculations */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Smart Calculations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Avg Daily Milk',
                      value: `${(summary.total_delivered_days > 0 ? (Number(summary.total_milk || 0) / summary.total_delivered_days) : 0).toFixed(2)} L`,
                      icon: Milk,
                    },
                    {
                      label: 'Delivery Rate',
                      value: `${totalDaysInPeriod > 0 ? Math.round(((summary.total_delivered_days || 0) / totalDaysInPeriod) * 100) : 0}%`,
                      icon: CheckCircle2,
                    },
                    {
                      label: 'Leave Rate',
                      value: `${totalDaysInPeriod > 0 ? Math.round((((summary.total_leave_days || 0) + totalLongLeaveDays) / totalDaysInPeriod) * 100) : 0}%`,
                      icon: Calendar,
                    },
                    {
                      label: 'Est. Monthly Revenue',
                      value: formatCurrency(Number(customer.daily_milk_quantity || 0) * Number(customer.milk_rate_per_liter || 0) * 30),
                      icon: TrendingUp,
                    },
                    {
                      label: 'Pending Amount',
                      value: formatCurrency(totalPending),
                      icon: Clock,
                    },
                    {
                      label: 'Wallet Balance',
                      value: formatCurrency(customer.credit_balance || 0),
                      icon: Wallet,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white/70 rounded-xl p-3 border border-indigo-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{label}</p>
                      </div>
                      <p className="text-base font-black text-indigo-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────
function DeleteModal({ customer, onClose, onConfirm }) {
  if (!customer) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center">Delete Customer?</h3>
        <p className="text-sm text-gray-500 text-center mt-2">
          This will permanently remove <strong>{customer.name}</strong> and all their data. This cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Yes, Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── Customer Card ─────────────────────────────────────────────────────────
function CustomerCard({ customer, onLeave, onEdit, onDelete, onManageAccess, onViewSummary }) {
  const isActive = customer.status === 'active';
  const walletBalance = Number(customer.credit_balance || 0);

  const shiftColors = {
    morning:    'badge-warning',
    evening:    'badge-info',
    both:       'badge-purple',
    occasional: 'badge-neutral',
  };

  return (
    <Card className={cn(
      'glass-card p-5 animate-slide-up group hover:-translate-y-0.5 transition-all duration-300',
      (!isActive || onLeave) && 'opacity-70'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
            isActive ? (onLeave ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700') : 'bg-gray-100 text-gray-500'
          )}>
            {getInitials(customer.name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">#{customer.id} {customer.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Phone className="w-3 h-3" />
              <span>{customer.phone || 'No phone'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {onLeave && (
            <span className="badge badge-danger">
              <CalendarOff className="w-3 h-3 mr-1 inline" />
              On Leave
            </span>
          )}
          <span className={cn('badge', isActive ? 'badge-success' : 'badge-neutral')}>
            {isActive ? <UserCheck className="w-3 h-3 mr-1 inline" /> : <UserX className="w-3 h-3 mr-1 inline" />}
            {customer.status}
          </span>
          <span className={cn('badge', shiftColors[customer.shift] || 'badge-neutral')}>
            {customer.shift === 'morning' ? '☀️ Morning' : customer.shift === 'evening' ? '🌙 Evening' : customer.shift === 'both' ? '🌗 Both' : '🔄 Occasional'}
          </span>
        </div>
      </div>

      {/* Address */}
      {(customer.address || customer.route_area) && (
        <div className="mt-3 space-y-1">
          {customer.route_area && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-tight">
              <MapPin className="w-3 h-3" />
              <span>Route: {customer.route_area}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-start gap-1.5 text-xs text-gray-400">
              <span className="truncate">{customer.address}</span>
            </div>
          )}
        </div>
      )}

      {/* Milk info */}
      <div className="mt-3 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
        <Milk className="w-4 h-4 text-indigo-600 shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-indigo-600 font-medium">Daily Milk</p>
          <p className="text-sm font-bold text-indigo-900">
            {customer.daily_milk_quantity} L @ ₹{customer.milk_rate_per_liter}/L
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-600">Monthly Est.</p>
          <p className="text-sm font-bold text-indigo-900">
            {formatCurrency(Number(customer.daily_milk_quantity) * Number(customer.milk_rate_per_liter) * 30)}
          </p>
        </div>
      </div>

      {/* Wallet */}
      <div className="mt-2 flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium',
          walletBalance > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'
        )}>
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet: {walletBalance > 0 ? formatCurrency(walletBalance) : '₹0'}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewSummary(customer)}
            className="p-2.5 rounded-xl text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
            title="View Summary"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onManageAccess(customer)}
            className="p-2.5 rounded-xl text-amber-600 hover:bg-amber-50 active:bg-amber-100 transition-colors"
            title="Manage Access"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="p-2.5 rounded-xl text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Main Customers Page ───────────────────────────────────────────────────
export default function Customers() {
  const queryClient = useQueryClient();
  const [showModal,       setShowModal]       = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [accessTarget,    setAccessTarget]    = useState(null);
  const [summaryTarget,   setSummaryTarget]   = useState(null);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [shiftFilter,     setShiftFilter]     = useState('all');
  const [routeFilter,     setRouteFilter]     = useState('all');

  const { data: customers = [], isLoading, isError, refetch, isFetching } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (id) => api.customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchShift  = shiftFilter  === 'all' || c.shift  === shiftFilter || (shiftFilter === 'both' && c.shift === 'both');
      const matchRoute  = routeFilter  === 'all' || c.route_area === routeFilter;
      return matchSearch && matchStatus && matchShift && matchRoute;
    });
  }, [customers, searchTerm, statusFilter, shiftFilter, routeFilter]);

  const routes = useMemo(() => {
    const uniqueRoutes = [...new Set(customers.map(c => c.route_area).filter(Boolean))];
    return ['all', ...uniqueRoutes];
  }, [customers]);

  const stats = useMemo(() => ({
    total:    customers.length,
    active:   customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
  }), [customers]);

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}
    </div>
  );
  if (isError) return (
    <div className="p-6 text-center">
      <Card className="max-w-md mx-auto p-6 text-center">
        <p className="font-bold text-rose-600 mb-3">Failed to load customers.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    </div>
  );

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Actions bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Customers</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.active} Active · {stats.total} Total</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => refetch()} 
              disabled={isFetching} 
              className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-indigo-600 transition-colors border border-slate-100"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
            <Button
              onClick={() => { setEditingCustomer(null); setShowModal(true); }}
              className="h-10"
            >
              <Plus className="w-4 h-4" /> 
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden text-xs">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Total',    value: stats.total,    color: 'stat-card-blue'  },
            { label: 'Active',   value: stats.active,   color: 'stat-card-green' },
            { label: 'Inactive', value: stats.inactive, color: 'stat-card-amber' },
          ].map(({ label, value, color }) => (
            <div key={label} className={cn('rounded-2xl p-2 sm:p-3 border border-white/50', color)}>
              <p className="text-[10px] text-gray-500 font-medium">{label}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or phone..."
              className="input pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all',      label: 'All Status' },
              { value: 'active',   label: '✅ Active' },
              { value: 'inactive', label: '⏸ Inactive' },
            ]}
            className="w-full sm:w-40"
          />
          <Select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            options={[
              { value: 'all',       label: 'All Shifts' },
              { value: 'morning',   label: '☀️ Morning' },
              { value: 'evening',   label: '🌙 Evening' },
              { value: 'both',      label: '🌗 Both' },
              { value: 'occasional',label: '🔄 Occasional' },
            ]}
            className="w-full sm:w-40"
          />
          <Select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            options={routes.map(r => ({ value: r, label: r === 'all' ? '🚩 All Routes' : `📍 ${r}` }))}
            className="w-full sm:w-40"
          />
        </div>

        {/* Customer count */}
        {searchTerm || statusFilter !== 'all' || shiftFilter !== 'all' || routeFilter !== 'all' ? (
          <p className="text-xs text-gray-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        ) : null}

        {/* Cards grid */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <Users className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-900">No customers found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onLeave={onLeaveCustomerIds.has(customer.id)}
                onEdit={(c) => { setEditingCustomer(c); setShowModal(true); }}
                onDelete={setDeleteTarget}
                onManageAccess={setAccessTarget}
                onViewSummary={setSummaryTarget}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CustomerFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingCustomer={editingCustomer}
      />
      <ManageAccessModal
        isOpen={!!accessTarget}
        onClose={() => setAccessTarget(null)}
        customer={accessTarget}
      />
      <CustomerSummaryModal
        isOpen={!!summaryTarget}
        onClose={() => setSummaryTarget(null)}
        customer={summaryTarget}
      />
      <DeleteModal
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
