import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CalendarOff, 
  Trash2, 
  User, 
  Calendar, 
  Search, 
  RefreshCw,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Card, Button, ConfirmModal } from '../ui';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { format, isAfter, isBefore, isWithinInterval, startOfDay } from 'date-fns';

export default function ManageLeaves() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('active'); // 'all', 'active', 'upcoming', 'past'
  const [cancelTarget, setCancelTarget] = useState(null); // { id, name }

  const { data: leaves = [], isLoading, isError, error: _error, refetch, isFetching } = useQuery({
    queryKey: ['all-leaves'],
    queryFn: () => api.leave.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.leave.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Leave cancelled successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredLeaves = leaves.filter(leave => {
    const matchSearch = !searchTerm || 
      (leave.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const today = startOfDay(new Date());
    const start = startOfDay(new Date(leave.start_date));
    const end = leave.end_date ? startOfDay(new Date(leave.end_date)) : null;

    let matchType = true;
    if (filterType === 'active') {
      // Currently on leave (today is between start and end, or after start if no end)
      matchType = (isWithinInterval(today, { start, end: end || new Date(2099, 11, 31) })) || 
                  (isBefore(start, today) && !end) || 
                  (format(start, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
    } else if (filterType === 'upcoming') {
      matchType = isAfter(start, today);
    } else if (filterType === 'past') {
      matchType = end ? isBefore(end, today) : false;
    }

    return matchSearch && matchType;
  });

  const handleCancelLeave = (id, name) => {
    setCancelTarget({ id, name });
  };

  const confirmCancel = () => {
    if (cancelTarget) {
      deleteMutation.mutate(cancelTarget.id);
      setCancelTarget(null);
    }
  };

  return (
    <div className="pb-28">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <CalendarOff className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Manage Leaves</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Track and cancel customer trips</p>
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
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name..."
              className="input pl-11 py-3.5"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
            {[
              { id: 'active',   label: 'Current' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past',     label: 'Past' },
              { id: 'all',      label: 'All' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={cn(
                  "px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  filterType === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {isError ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-dashed border-red-200 p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-bold text-red-700 mb-2">Failed to load leaves</h3>
              <p className="text-sm text-red-500 mb-4">Something went wrong while fetching data. Please try again.</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 w-full rounded-3xl" />)
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <CalendarOff className="w-16 h-16 mx-auto text-slate-100 mb-4" />
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No leave records found</p>
            </div>
          ) : (
            filteredLeaves.map((leave) => (
              <Card key={leave.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all group border-slate-100 bg-white overflow-hidden relative">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300",
                    filterType === 'past' ? "bg-slate-100 text-slate-400" : "bg-amber-50 text-amber-600 shadow-sm"
                  )}>
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">#{leave.customer_id} {leave.customer_name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {leave.start_date ? format(new Date(leave.start_date), 'MMM dd') : 'N/A'} — {leave.end_date ? format(new Date(leave.end_date), 'MMM dd, yyyy') : <span className="text-amber-600 italic">Unknown Return</span>}
                      </div>
                      {leave.reason && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {leave.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  {filterType !== 'past' && (
                    <Button variant="ghost" onClick={() => handleCancelLeave(leave.id, leave.customer_name)} className="text-rose-500 hover:bg-rose-50 rounded-2xl gap-2 font-black text-[11px] uppercase tracking-widest px-6">
                      <Trash2 className="w-4 h-4" />
                      Cancel Trip
                    </Button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
                
                {/* Background tag */}
                {!leave.end_date && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest py-1 px-3 rounded-bl-xl shadow-sm">
                      Indefinite
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
      </main>

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel Leave?"
        message={cancelTarget ? `Are you sure you want to cancel the leave for ${cancelTarget.name}? This will resume deliveries immediately.` : ''}
        confirmText="Yes, Cancel Leave"
        cancelText="No, Keep Leave"
        variant="danger"
      />
    </div>
  );
}
