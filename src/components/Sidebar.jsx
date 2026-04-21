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
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'customers',  label: 'Customers',   icon: Users },
  { id: 'deliveries', label: 'Deliveries',  icon: Truck },
  { id: 'billing',    label: 'Billing',     icon: Receipt },
  { id: 'reports',    label: 'Reports',     icon: BarChart3 },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose, onLogout }) {
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
          'bg-white/95 backdrop-blur-xl border-r border-gray-100 shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header / Branding */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Milk className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm leading-tight">Dairy Manager</h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Business Suite</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
