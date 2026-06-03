import React from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  Receipt,
  BarChart3,
  LogOut,
  X,
  Milk,
  MessageSquare,
  AlertCircle,
  Shield,
  Fingerprint,
  CalendarDays
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const adminNavItems = [
  { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'customers',   label: 'Customers',       icon: Users },
  { id: 'deliveries',  label: 'Deliveries',      icon: Truck },
  { id: 'leaves',      label: 'Manage Leaves',   icon: CalendarDays },
  { id: 'farm-mgmt',   label: 'Farm Management', icon: Milk },
  { id: 'billing',     label: 'Billing',         icon: Receipt },
  { id: 'access-mgmt', label: 'Portal Access',   icon: Fingerprint },
  { id: 'reports',     label: 'Reports',         icon: BarChart3 },
  { id: 'access-logs', label: 'Access Logs',     icon: Shield },
];

const customerNavItems = [
  { id: 'dashboard',  label: 'My Dashboard',  icon: LayoutDashboard },
  { id: 'deliveries', label: 'My Deliveries', icon: Truck },
  { id: 'bills',      label: 'My Bills',      icon: Receipt },
  { id: 'support',    label: 'Support',       icon: MessageSquare },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose, onLogout, user }) {
  const isCustomer = user?.role === 'customer';
  const navItems = isCustomer ? customerNavItems : adminNavItems;
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 z-50',
          'bg-white border-r border-slate-200/60 shadow-sm',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header / Branding */}
          <div className="flex items-center justify-between px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Milk className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-base tracking-tight leading-none">Dairy MS</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1.5">Business Suite</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-50 md:hidden text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); onClose(); }}
                  className={cn(
                    'sidebar-link group',
                    isActive && 'sidebar-link-active'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  )}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 group font-semibold"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-100/50 group-hover:text-rose-600 transition-colors">
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
