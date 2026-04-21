import React from 'react';
import { cn } from '../lib/utils';

// Base Card
export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-100',
        hover && 'hover:shadow-md hover:border-gray-200 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('px-4 py-3 border-b border-gray-100', className)} {...props}>
      {children}
    </div>
  );
}

// Card Content
export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Stat Card
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  className,
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl', colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          <span
            className={cn(
              'text-sm font-medium',
              trend > 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trendValue)}%
          </span>
          <span className="text-sm text-gray-400">vs last month</span>
        </div>
      )}
    </Card>
  );
}

// Empty State Card
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="p-8 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-gray-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export default Card;