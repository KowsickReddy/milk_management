import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Plus, RefreshCw, Phone, MapPin, Edit2, Trash2,
  Search, Milk, Wallet, UserCheck, UserX, Users,
} from 'lucide-react';
import api from '../services/api';
import {
  Button, Card, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Select,
} from '../ui';
import { toast } from 'react-hot-toast';
import { getInitials, formatCurrency, cn } from '../lib/utils';

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
});

// ── Customer Form Modal ───────────────────────────────────────────────────
function CustomerFormModal({ isOpen, onClose, editingCustomer }) {
  const queryClient = useQueryClient();

  const {
    register, handleSubmit, reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: editingCustomer || {
      name: '', phone: '', address: '',
      daily_milk_quantity: '', milk_rate_per_liter: '',
      shift: 'morning', status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) reset(editingCustomer || {
      name: '', phone: '', address: '',
      daily_milk_quantity: '', milk_rate_per_liter: '',
      shift: 'morning', status: 'active',
    });
  }, [isOpen, editingCustomer, reset]);

  const mutation = useMutation({
    mutationFn: editingCustomer
      ? (data) => api.customers.update(editingCustomer.id, data)
      : api.customers.create,
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
      <form onSubmit={handleSubmit(mutation.mutate)}>
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
            {field('Quantity (L/day)', 'daily_milk_quantity', 'number', { step: '0.5', placeholder: '2' })}
            {field('Rate per Liter (₹)', 'milk_rate_per_liter', 'number', { step: '0.5', placeholder: '28' })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select {...register('shift')} className="input">
                <option value="morning">☀️ Morning</option>
                <option value="evening">🌙 Evening</option>
                <option value="occasional">🔄 Occasional</option>
              </select>
            </div>
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
          <Button type="submit" disabled={!isValid || mutation.isPending}>
            {mutation.isPending ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
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
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Customer Card ─────────────────────────────────────────────────────────
function CustomerCard({ customer, onEdit, onDelete }) {
  const isActive = customer.status === 'active';
  const walletBalance = Number(customer.credit_balance || 0);

  const shiftColors = {
    morning:    'badge-warning',
    evening:    'badge-info',
    occasional: 'badge-neutral',
  };

  return (
    <Card className={cn(
      'glass-card p-5 animate-slide-up group hover:-translate-y-0.5 transition-all duration-300',
      !isActive && 'opacity-70'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0',
            isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
          )}>
            {getInitials(customer.name)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">{customer.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Phone className="w-3 h-3" />
              <span>{customer.phone || 'No phone'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('badge', isActive ? 'badge-success' : 'badge-neutral')}>
            {isActive ? <UserCheck className="w-3 h-3 mr-1 inline" /> : <UserX className="w-3 h-3 mr-1 inline" />}
            {customer.status}
          </span>
          <span className={cn('badge', shiftColors[customer.shift] || 'badge-neutral')}>
            {customer.shift === 'morning' ? '☀️' : customer.shift === 'evening' ? '🌙' : '🔄'} {customer.shift}
          </span>
        </div>
      </div>

      {/* Address */}
      {customer.address && (
        <div className="flex items-start gap-1.5 mt-3 text-xs text-gray-400">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="truncate">{customer.address}</span>
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
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(customer)}
            className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
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
  const [searchTerm,      setSearchTerm]      = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [shiftFilter,     setShiftFilter]     = useState('all');

  const { data: customers = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => api.customers.getAll(),
  });

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
      const matchShift  = shiftFilter  === 'all' || c.shift  === shiftFilter;
      return matchSearch && matchStatus && matchShift;
    });
  }, [customers, searchTerm, statusFilter, shiftFilter]);

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
    <div className="p-6 text-center text-red-500">
      Failed to load customers.
      <button onClick={() => refetch()} className="btn btn-primary ml-2">Retry</button>
    </div>
  );

  return (
    <div className="pb-28">
      {/* Sticky header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gradient">Customers</h1>
            <p className="text-xs text-gray-400 mt-0.5">{stats.active} active · {stats.total} total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} disabled={isFetching} className="btn btn-ghost p-2">
              <RefreshCw className={cn('w-5 h-5 text-indigo-500', isFetching && 'animate-spin')} />
            </button>
            <button
              onClick={() => { setEditingCustomer(null); setShowModal(true); }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add New
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',    value: stats.total,    color: 'stat-card-blue'  },
            { label: 'Active',   value: stats.active,   color: 'stat-card-green' },
            { label: 'Inactive', value: stats.inactive, color: 'stat-card-amber' },
          ].map(({ label, value, color }) => (
            <div key={label} className={cn('rounded-2xl p-3 border border-white/50', color)}>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
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
              { value: 'occasional',label: '🔄 Occasional' },
            ]}
            className="w-full sm:w-40"
          />
        </div>

        {/* Customer count */}
        {searchTerm || statusFilter !== 'all' || shiftFilter !== 'all' ? (
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
                onEdit={(c) => { setEditingCustomer(c); setShowModal(true); }}
                onDelete={setDeleteTarget}
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
      <DeleteModal
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
