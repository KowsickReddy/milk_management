import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Truck, Receipt, BarChart3, LogOut, X, Milk,
  MessageSquare, Shield, Fingerprint, CalendarDays, Wallet, Calculator,
  ChevronLeft, Search, Info, Camera, StickyNote, Banknote
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const adminNavItems = [
  { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'customers',   label: 'Customers',       icon: Users },
  { id: 'deliveries',  label: 'Deliveries',      icon: Truck },
  { id: 'leaves',      label: 'Manage Leaves',   icon: CalendarDays },
  { id: 'expenses',    label: 'Expenses',         icon: Wallet },
  { id: 'farm-mgmt',   label: 'Farm Management', icon: Milk },
  { id: 'billing',     label: 'Billing',         icon: Receipt },
  { id: 'payments',    label: 'Payments',        icon: Banknote },
  { id: 'access-mgmt', label: 'Portal Access',   icon: Fingerprint },
  { id: 'access-logs', label: 'Access Logs',     icon: Shield },
  { id: 'reports',       label: 'Reports',          icon: BarChart3 },
  { id: 'calculator',    label: 'Calculator',       icon: Calculator },
  { id: 'admin-calendar',label: 'Delivery Calendar', icon: CalendarDays },
  { id: 'notes',         label: 'Notes',            icon: StickyNote },
  { id: 'about',         label: 'About',            icon: Info },
];

const customerNavItems = [
  { id: 'dashboard',  label: 'My Dashboard',  icon: LayoutDashboard },
  { id: 'deliveries', label: 'My Deliveries', icon: Truck },
  { id: 'bills',      label: 'My Bills',      icon: Receipt },
  { id: 'calendar',   label: 'Calendar',      icon: CalendarDays },
  { id: 'support',    label: 'Support',       icon: MessageSquare },
];

const sidebarVariants = {
  open: { width: 256, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  closed: { width: 72, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const itemVariants = {
  open: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  closed: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

export default function Sidebar({ activeTab, onTabChange, isOpen: mobileOpen, onClose, onLogout, user, collapsed: propCollapsed }) {
  const isCustomer = user?.role === 'customer';
  const navItems = isCustomer ? customerNavItems : adminNavItems;
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(propCollapsed || false);

  const filteredItems = navItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCollapse = () => setCollapsed(!collapsed);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={cn(
        'flex items-center px-5 py-6 border-b border-slate-100',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
            <Milk className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={itemVariants}
                className="min-w-0"
              >
                <h1 className="font-black text-slate-900 text-base tracking-tight leading-none truncate">Dairy MS</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Business Suite</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 md:hidden text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User Profile */}        <div className={cn(
          'px-4 py-3 border-b border-slate-100',
          collapsed && 'flex justify-center'
        )}>
          <div className={cn(
            'flex items-center gap-3',
            collapsed && 'flex-col'
          )}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shrink-0 border border-indigo-200/50 overflow-hidden">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-black text-indigo-600">
                  {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={itemVariants}
                className="min-w-0 flex-1"
              >
                <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name || user?.username || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user?.role || 'user'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search (only when expanded) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {(searchQuery ? filteredItems : navItems).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); onClose?.(); }}
              className={cn(
                'flex items-center gap-3 w-full rounded-2xl transition-all duration-200 group relative',
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                isActive
                  ? 'bg-indigo-50/80 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-transparent text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-semibold tracking-tight whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className={cn(
                    'absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-600',
                    collapsed ? 'right-auto left-1/2 -translate-x-1/2 top-1' : ''
                  )}
                />
              )}
            </button>
          );
        })}
        {searchQuery && filteredItems.length === 0 && !collapsed && (
          <p className="text-xs text-slate-400 text-center py-6">No pages found</p>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className={cn(
        'p-3 border-t border-slate-100 space-y-1',
        collapsed && 'flex flex-col items-center'
      )}>
        {/* Close button (mobile only) */}
        <button
          onClick={() => onClose?.()}
          className={cn(
            'flex md:hidden items-center gap-3 w-full rounded-2xl transition-all duration-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-3 py-2.5',
          )}
          title="Close sidebar"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Close</span>
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'hidden md:flex items-center gap-3 w-full rounded-2xl transition-all duration-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100',
            collapsed ? 'justify-center p-3' : 'px-3 py-2.5'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-3 w-full rounded-2xl transition-all duration-200',
            'text-slate-500 hover:bg-rose-50 hover:text-rose-600 group',
            collapsed ? 'justify-center p-3' : 'px-3 py-2.5'
          )}
          title="Logout"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-rose-100/50 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-semibold"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar (animated collapsible) */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={collapsed ? 'closed' : 'open'}
        className={cn(
          'fixed left-0 top-0 h-full z-50 hidden md:block',
          'bg-white border-r border-slate-200/60 shadow-sm',
          'overflow-hidden'
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar (drawer) */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 z-50 md:hidden',
          'bg-white border-r border-slate-200/60 shadow-lg',
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
