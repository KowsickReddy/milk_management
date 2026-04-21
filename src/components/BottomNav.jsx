import React from 'react';
import { Home, Users, Truck, Receipt, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function BottomNav({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'dashboard',  icon: Home,     label: 'Home' },
    { id: 'customers',  icon: Users,    label: 'Clients' },
    { id: 'deliveries', icon: Truck,    label: 'Deliveries' },
    { id: 'billing',    icon: Receipt,  label: 'Bills' },
    { id: 'reports',    icon: BarChart3,label: 'Reports' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe z-40 md:hidden shadow-2xl shadow-black/10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 w-8 h-0.5 bg-indigo-600 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                isActive ? 'bg-indigo-50' : ''
              )}>
                <Icon className={cn('w-5 h-5', isActive ? 'stroke-[2.5px]' : 'stroke-2')} />
              </div>
              <span className={cn('text-[9px] font-semibold tracking-wide', isActive ? 'text-indigo-600' : 'text-gray-400')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}