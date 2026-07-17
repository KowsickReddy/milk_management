import React, { useEffect, useState, useRef } from 'react';
import { cn } from '../lib/utils';

export function Card({ children, className, hover = false, glass = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 md:p-6',
        hover && 'card-hover',
        glass && 'glass',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Animated counter hook
function useCountUp(end, duration = 1000, enabled = true) {
  const [count, setCount] = useState(0);
  const startTime = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    if (!enabled || end === undefined || end === null) {
      setCount(end || 0);
      return;
    }
    const start = performance.now();
    const initial = count || 0;
    const delta = end - initial;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(initial + delta * eased));
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    }
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration, enabled]);

  return count;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  className,
  animate = true,
  prefix = '',
  suffix = '',
}) {
  const animatedValue = useCountUp(Number(value), 800, animate && value);

  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const iconColors = colors;

  return (
    <Card className={cn('p-5 relative overflow-hidden group', className)}>
      {/* Subtle gradient background */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        color === 'primary' && 'bg-gradient-to-br from-primary-50/30 to-transparent',
        color === 'indigo' && 'bg-gradient-to-br from-indigo-50/30 to-transparent',
        color === 'amber' && 'bg-gradient-to-br from-amber-50/30 to-transparent',
        color === 'red' && 'bg-gradient-to-br from-red-50/30 to-transparent',
        color === 'emerald' && 'bg-gradient-to-br from-emerald-50/30 to-transparent',
        color === 'rose' && 'bg-gradient-to-br from-rose-50/30 to-transparent',
      )} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {prefix}{animate ? animatedValue.toLocaleString() : value}{suffix}
            </p>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
              iconColors[color] || iconColors.primary
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-3">
            <span
              className={cn(
                'text-xs font-bold flex items-center gap-0.5',
                trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {trend >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
              {Math.abs(trendValue || trend)}%
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card className={cn('p-8 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-slate-500 mt-1.5 text-sm max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export default Card;
