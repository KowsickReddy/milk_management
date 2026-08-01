import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, RefreshCw, Edit2, Trash2, Search,
  Wallet, TrendingUp, TrendingDown, Calendar
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { cn, formatCurrency, getToday } from '../lib/utils';
import { ModalContent, ModalHeader, ModalBody, ModalFooter, ConfirmModal, Button, Input, Select } from '../ui';

const CATEGORIES = ['Feed', 'Veterinary', 'Transport', 'Labour', 'Electricity', 'Packaging', 'Maintenance', 'Other'];

const defaultForm = { category: 'Feed', amount: '', description: '', expense_date: getToday() };

function ExpenseFormModal({ isOpen, onClose, editingExpense }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  React.useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setForm({
          category: editingExpense.category || 'Feed',
          amount: String(editingExpense.amount || ''),
          description: editingExpense.description || '',
          expense_date: editingExpense.expense_date ? editingExpense.expense_date.split('T')[0] : getToday(),
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [isOpen, editingExpense]);

  const mutation = useMutation({
    mutationFn: editingExpense
      ? (data) => api.expenses.update(editingExpense.id, data)
      : (data) => api.expenses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(editingExpense ? 'Expense updated' : 'Expense added');
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');
    mutation.mutate({
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description,
      expense_date: form.expense_date,
    });
  };

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  if (!isOpen) return null;

  return (
    <ModalContent isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        {editingExpense ? 'Edit Expense' : 'Add Expense'}
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <Input
              type="date"
              value={form.expense_date}
              onChange={(e) => update('expense_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Optional notes..."
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}

export default function Expenses() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: expenses = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['expenses', dateRange],
    queryFn: () => api.expenses.getAll(dateRange.start || dateRange.end ? { startDate: dateRange.start, endDate: dateRange.end } : {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.expenses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !searchTerm ||
        (e.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totalAmount = useMemo(() =>
    filtered.reduce((s, e) => s + Number(e.amount || 0), 0),
  [filtered]);

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24" />)}
    </div>
  );

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Expenses</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{expenses.length} entries · ₹{totalAmount.toFixed(2)} total</p>
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
              onClick={() => { setEditingExpense(null); setShowModal(true); }}
              className="h-10"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden text-xs">Add</span>
            </Button>
          </div>
        </div>
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Entries', value: filtered.length, color: 'stat-card-blue', icon: Wallet },
            { label: 'Total Amount', value: formatCurrency(totalAmount), color: 'stat-card-rose', icon: TrendingDown },
            { label: 'This Month', value: formatCurrency(
              expenses.filter(e => {
                const d = new Date(e.expense_date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).reduce((s, e) => s + Number(e.amount || 0), 0)
            ), color: 'stat-card-amber', icon: Calendar },
            { label: 'Avg/Entry', value: formatCurrency(filtered.length ? totalAmount / filtered.length : 0), color: 'stat-card-purple', icon: TrendingUp },
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
              placeholder="Search category or description..."
              className="input pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[{ value: 'all', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]}
            className="w-full sm:w-44"
          />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(r => ({ ...r, start: e.target.value }))}
            className="w-full sm:w-36"
            placeholder="Start date"
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(r => ({ ...r, end: e.target.value }))}
            className="w-full sm:w-36"
            placeholder="End date"
          />
        </div>

        {/* Error state */}
        {isError ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-red-200">
            <p className="font-bold text-red-600">Failed to load expenses</p>
            <p className="text-gray-400 text-sm mt-1">{error?.message}</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <Wallet className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-900">No expenses found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first expense to start tracking costs</p>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Date', 'Category', 'Description', 'Amount', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp) => (
                    <tr key={exp.id}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-neutral">{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{exp.description || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-red-700 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingExpense(exp); setShowModal(true); }}
                            className="p-2.5 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-4 py-3 font-bold text-red-700">{formatCurrency(totalAmount)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ExpenseFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingExpense={editingExpense}
      />
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete Expense?"
        message={deleteTarget ? `Remove ${deleteTarget.description || deleteTarget.category} — ₹${deleteTarget.amount}? This cannot be undone.` : ''}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
