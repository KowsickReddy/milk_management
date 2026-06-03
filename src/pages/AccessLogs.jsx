import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  User, 
  Clock, 
  Globe, 
  Search, 
  Filter,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { Card, Badge, Button } from '../ui';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AccessLogs() {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['login-logs'],
    queryFn: () => api.admin.getLoginLogs(),
  });

  const filteredLogs = logs.filter(log => {
    const matchType = filterType === 'all' || log.user_type === filterType;
    const matchSearch = !searchTerm || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address.includes(searchTerm);
    return matchType && matchSearch;
  });

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Access Logs</h1>
              <p className="text-xs text-gray-400 mt-0.5">Track system login history</p>
            </div>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all"
          >
            <RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
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
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                  filterType === type 
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)
          ) : filteredLogs.length === 0 ? (
            <Card className="p-12 text-center text-gray-400 border-dashed border-2">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No login records found</p>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="p-4 flex items-center justify-between hover:border-slate-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    log.user_type === 'admin' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">
                        {log.user_type === 'customer' ? `#${log.user_id} ` : ''}{log.username}
                      </h3>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-tighter",
                        log.user_type === 'admin' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {log.user_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.login_time), 'MMM dd, yyyy · hh:mm a')}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                        <Globe className="w-3 h-3" />
                        {log.ip_address}
                      </div>
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-gray-400 transition-colors" />
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
