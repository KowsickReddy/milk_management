import React from 'react';
import { Home, Users, Truck, Receipt, BarChart3, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function BottomNav({ activeTab, onTabChange, user }) {
  const isCustomer = user?.role === 'customer';
  
  const navItems = isCustomer ? [
    { id: 'dashboard',  icon: Home,          label: 'Home' },
    { id: 'deliveries', icon: Truck,         label: 'Logs' },
    { id: 'bills',      icon: Receipt,       label: 'Bills' },
    { id: 'support',    icon: MessageSquare, label: 'Support' },
  ] : [
    { id: 'dashboard',  icon: Home,     label: 'Home' },
    { id: 'customers',  icon: Users,    label: 'Clients' },
    { id: 'deliveries', icon: Truck,    label: 'Delivery' },
    { id: 'billing',    icon: Receipt,  label: 'Bills' },
    { id: 'reports',    icon: BarChart3,label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 pb-safe z-40 md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 group"
            >
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300',
                isActive ? 'bg-indigo-50 text-indigo-600 scale-105 shadow-sm shadow-indigo-100/50' : 'text-slate-400 group-hover:text-slate-600'
              )}>
                <Icon className={cn('w-5 h-5', isActive ? 'stroke-[2.5px]' : 'stroke-2')} />
              </div>
              <span className={cn(
                'text-[10px] font-bold tracking-tight transition-colors duration-300',
                isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabDot"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
