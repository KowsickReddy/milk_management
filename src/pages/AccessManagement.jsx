import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Key, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert,
  Smartphone,
  Fingerprint,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import { Card, Button, Input, Select } from '../ui';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function AccessManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');
  const [editingPin, setEditingPin] = useState(null); // { id, name, pin }
  const [newPin, setNewPin] = useState('');

  const { data: customers = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['customers-access'],
    queryFn: () => api.customers.getAll(),
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !searchTerm || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm);
      
      const hasCustomPin = c.pin && c.pin !== '';
      const matchAccess = accessFilter === 'all' || 
        (accessFilter === 'active' && hasCustomPin) || 
        (accessFilter === 'default' && !hasCustomPin);
        
      return matchSearch && matchAccess;
    });
  }, [customers, searchTerm, accessFilter]);

  const handleUpdatePin = async () => {
    if (!newPin || newPin.length < 4) {
      return toast.error('PIN must be at least 4 digits');
    }
    try {
      await api.customers.updatePin(editingPin.id, newPin);
      toast.success(`Access updated for ${editingPin.name}`);
      queryClient.invalidateQueries({ queryKey: ['customers-access'] });
      setEditingPin(null);
      setNewPin('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="pb-28">
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Portal Access</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Authentication Management</p>
            </div>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-indigo-600 transition-colors border border-slate-100"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </button>
        </div>
        {/* Onboarding Alert */}
        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Fingerprint className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Key className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">How to Onboard Customers</h2>
              <p className="text-indigo-100 text-sm mt-1 leading-relaxed">
                By default, all customers can log in using their <strong>Registered Phone Number</strong> and the default PIN <strong>1234</strong>.
                Use this page to set secure custom PINs for them.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or phone..."
              className="input pl-11 py-3.5 shadow-sm border-slate-100"
            />
          </div>
          <Select 
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Accounts' },
              { value: 'active', label: 'Secure PIN Set' },
              { value: 'default', label: 'Using Default (1234)' }
            ]}
            className="w-full sm:w-56"
          />
        </div>

        {/* PIN Editing Panel */}
        {editingPin && (
          <Card className="p-8 border-2 border-indigo-500 bg-indigo-50/10 animate-scale-in relative">
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
                <Input 
                  type="text" 
                  maxLength={6}
                  autoFocus
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 5829"
                  className="bg-white border-indigo-100 font-mono tracking-[1em] text-center text-xl py-4"
                />
              </div>
              <Button onClick={handleUpdatePin} className="px-10 h-[58px] mt-auto shadow-indigo-200 text-base uppercase font-black tracking-widest">Update PIN</Button>
            </div>
          </Card>
        )}

        {/* Customer List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 w-full" />)
          ) : isError ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <Smartphone className="w-16 h-16 mx-auto text-slate-100 mb-4" />
              <p className="font-black text-red-500 uppercase tracking-widest text-xs">Failed to load customers</p>
              <p className="text-gray-400 text-xs mt-1">{error?.message}</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <Smartphone className="w-16 h-16 mx-auto text-slate-100 mb-4" />
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No matching customers found</p>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const isDefault = !customer.pin || customer.pin === '1234';
              return (
                <Card key={customer.id} className="p-5 flex items-center justify-between hover:shadow-lg hover:border-indigo-100 transition-all group border-slate-100 bg-white">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6",
                      isDefault ? "bg-slate-100 text-slate-300 shadow-inner" : "bg-emerald-50 text-emerald-600 shadow-sm"
                    )}>
                      {isDefault ? <ShieldAlert className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">#{customer.id} {customer.name}</h3>
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-tighter",
                          isDefault ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {isDefault ? "Insecure / Default" : "Secure"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-300" />
                          {customer.phone || 'No phone'}
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          PIN: {isDefault ? '1234' : '••••••'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setEditingPin(customer); setNewPin(''); }}
                    className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90"
                  >
                    <Key className="w-5 h-5" />
                  </button>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
