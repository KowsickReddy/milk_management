import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, User, Clock, Globe, Search, RefreshCw,
  ChevronRight, Plus, Trash2, Key, Smartphone,
  ShieldCheck, ShieldAlert, UserCheck, Eye, EyeOff, Fingerprint
} from 'lucide-react';
import api from '../services/api';
import { Card, Button, Input, Select, ConfirmModal } from '../ui';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import FingerprintManager from '../components/FingerprintManager';

const TABS = [
  { id: 'logs',    label: 'Login Logs',   icon: Clock },
  { id: 'staff',   label: 'Staff Accounts', icon: User },
  { id: 'portal',  label: 'Customer Access', icon: Key },
];

export default function AccessLogs() {
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <div className="pb-28">
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Access Control</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage users, portal access & login history</p>
            </div>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                    activeTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {activeTab === 'logs' && <LoginLogsPanel />}
        {activeTab === 'staff' && <StaffAccountsPanel />}
        {activeTab === 'portal' && <CustomerAccessPanel />}
      </main>
    </div>
  );
}

// ── Tab 1: Login Logs ────────────────────────────────────────────────────
function LoginLogsPanel() {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['login-logs'],
    queryFn: () => api.admin.getLoginLogs(),
  });

  const filteredLogs = logs.filter(log => {
    const matchType = filterType === 'all' || log.user_type === filterType;
    const matchSearch = !searchTerm ||
      (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip_address || '').includes(searchTerm);
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or IP..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'admin', 'customer'].map((type) => (
            <button key={type} onClick={() => setFilterType(type)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                filterType === type ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
              )}>
              {type}
            </button>
          ))}
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
            <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)
        ) : isError ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-red-200">
            <Shield className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="font-bold text-red-600">Failed to load logs</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-12 text-center text-gray-400 border-dashed border-2">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No login records found</p>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="p-4 flex items-center justify-between hover:border-slate-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center",
                  log.user_type === 'admin' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600")}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      {log.user_type === 'customer' ? `#${log.user_id} ` : ''}{log.username}
                    </h3>
                    <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-tighter",
                      log.user_type === 'admin' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700")}>
                      {log.user_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {log.login_time ? format(new Date(log.login_time), 'MMM dd, yyyy · hh:mm a') : '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                      <Globe className="w-3 h-3" />
                      {log.ip_address}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-gray-400 transition-colors" />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Staff Accounts ─────────────────────────────────────────────────
function StaffAccountsPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', pin: '', role: 'worker', full_name: '', phone: '' });
  const [bioUser, setBioUser] = useState(null); // { id, username } to show fingerprint manager
  const [showPin, setShowPin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, username }

  const { data: users = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setForm({ username: '', pin: '', role: 'worker', full_name: '', phone: '' });
      toast.success('Staff account created');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Account deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!form.username || !form.pin) return toast.error('Username and PIN are required');
    if (form.pin.length < 4) return toast.error('PIN must be at least 4 characters');
    createMutation.mutate(form);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">{users.length} staff account{users.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={() => refetch()} disabled={isFetching}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
              <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
            </button>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2 text-xs">
              <Plus className="w-4 h-4" /> Add Staff
            </Button>
          </div>
        </div>

      {showForm && (
        <Card className="p-6 border-2 border-indigo-500 bg-indigo-50/10 animate-scale-in space-y-4">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">New Staff Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Username *" />
            <div className="relative">
              <Input type={showPin ? 'text' : 'password'} value={form.pin} onChange={(e) => setForm(p => ({ ...p, pin: e.target.value }))} placeholder="PIN *" className="pr-10" />
              <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
              options={[
                { value: 'worker', label: 'Worker' },
                { value: 'admin', label: 'Admin' },
              ]} />
            <Input value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name" />
            <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>Create Account</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)
        ) : isError ? (
          <div className="text-center py-16 bg-white/40 rounded-3xl border-2 border-dashed border-red-200">
            <p className="font-bold text-red-600">Failed to load staff accounts</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : users.length === 0 ? (
          <Card className="p-12 text-center text-gray-400 border-dashed border-2">
            <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No staff accounts yet</p>
          </Card>
        ) : (
          users.map((user) => (
            <div key={user.id}>
              <Card className="p-4 flex items-center justify-between group border-slate-100">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                    {(user.full_name || user.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 truncate">{user.full_name || user.username}</h3>
                      <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-tighter",
                        user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600")}>
                        {user.role}
                      </span>
                      {!user.is_active && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-red-100 text-red-600">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>@{user.username}</span>
                      {user.phone && <span>{user.phone}</span>}
                      {user.last_login && <span>Last login: {format(new Date(user.last_login), 'MMM dd')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setBioUser(bioUser?.id === user.id ? null : { id: user.id, username: user.username })}
                    className={cn("p-2 rounded-xl transition-all",
                      bioUser?.id === user.id ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 opacity-0 group-hover:opacity-100")}>
                    <Fingerprint className="w-4 h-4" />
                  </button>
                  {user.username !== 'admin' && (
                    <button onClick={() => setDeleteTarget({ id: user.id, username: user.username })}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
              {bioUser?.id === user.id && (
                <div className="pl-4 pr-4 pb-4 -mt-2 bg-white rounded-b-2xl border border-t-0 border-slate-100 shadow-sm">
                  <div className="pt-4">
                    <FingerprintManager userId={user.id} username={user.username} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Staff Account"
        message={`Are you sure you want to delete account "${deleteTarget?.username}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
  // ── Tab 3: Customer Portal Access ─────────────────────────────────────────
}

// ── Tab 3: Customer Portal Access ─────────────────────────────────────────
function CustomerAccessPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');
  const [editingPin, setEditingPin] = useState(null);
  const [newPin, setNewPin] = useState('');

  const { data: customers = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['customers-access'],
    queryFn: () => api.customers.getAll(),
  });

  const filteredCustomers = customers.filter(c => {
    const matchSearch = !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    const hasCustomPin = c.pin && c.pin !== '';
    const matchAccess = accessFilter === 'all' ||
      (accessFilter === 'active' && hasCustomPin) ||
      (accessFilter === 'default' && !hasCustomPin);
    return matchSearch && matchAccess;
  });

  const handleUpdatePin = async () => {
    if (!newPin || newPin.length < 4) return toast.error('PIN must be at least 4 digits');
    try {
      await api.customers.updatePin(editingPin.id, newPin);
      toast.success(`Access updated for ${editingPin.name}`);
      refetch();
      setEditingPin(null);
      setNewPin('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or phone..." className="input pl-11 py-3.5 shadow-sm border-slate-100" />
        </div>
        <Select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Accounts' },
            { value: 'active', label: 'Secure PIN Set' },
            { value: 'default', label: 'Insecure / Default' }
          ]} className="w-full sm:w-56" />
        <button onClick={() => refetch()} disabled={isFetching}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
          <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
        </button>
      </div>

      {editingPin && (
        <Card className="p-8 border-2 border-indigo-500 bg-indigo-50/10 animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="font-black text-indigo-900 text-base tracking-tight uppercase">Update Access: {editingPin.name}</h2>
            </div>
            <button onClick={() => setEditingPin(null)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1 block">New 4-6 Digit Security PIN</label>
              <Input type="text" maxLength={6} autoFocus value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 5829" className="bg-white border-indigo-100 font-mono tracking-[1em] text-center text-xl py-4" />
            </div>
            <Button onClick={handleUpdatePin} className="px-10 h-[58px] mt-auto shadow-indigo-200 text-base uppercase font-black tracking-widest">Update PIN</Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 w-full" />)
        ) : isError ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Smartphone className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="font-black text-red-500 uppercase tracking-widest text-xs">Failed to load customers</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Smartphone className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No matching customers found</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const isDefault = !customer.pin || customer.pin === '';
            return (
              <Card key={customer.id} className="p-5 flex items-center justify-between hover:shadow-lg hover:border-indigo-100 transition-all group border-slate-100 bg-white">
                <div className="flex items-center gap-5">
                  <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6",
                    isDefault ? "bg-slate-100 text-slate-300 shadow-inner" : "bg-emerald-50 text-emerald-600 shadow-sm")}>
                    {isDefault ? <ShieldAlert className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg tracking-tight">#{customer.id} {customer.name}</h3>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter",
                        isDefault ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                        {isDefault ? 'No PIN Set' : 'Secure'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                        {customer.phone || 'No phone'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setEditingPin(customer); setNewPin(''); }}
                  className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90">
                  <Key className="w-5 h-5" />
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
