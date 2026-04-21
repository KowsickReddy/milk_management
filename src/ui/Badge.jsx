import React from 'react';
import { cn } from '../lib/utils';

// Badge variants
const variants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

// Badge sizes
const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

// Badge
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'secondary' && 'bg-secondary-500',
            variant === 'info' && 'bg-blue-500',
            !['success', 'warning', 'danger', 'primary', 'secondary', 'info'].includes(variant) && 'bg-gray-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Status Badge
export function StatusBadge({ status }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    delivered: { variant: 'success', label: 'Delivered' },
    pending: { variant: 'warning', label: 'Pending' },
    leave: { variant: 'danger', label: 'Leave' },
    paid: { variant: 'success', label: 'Paid' },
    unpaid: { variant: 'danger', label: 'Unpaid' },
    partial: { variant: 'warning', label: 'Partial' },
    morning: { variant: 'primary', label: 'Morning' },
    evening: { variant: 'secondary', label: 'Evening' },
    occasional: { variant: 'info', label: 'Occasional' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

// Avatar Badge
export function AvatarBadge({ count, className }) {
  if (!count) return null;

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 w-5 h-5 rounded-full',
        'bg-red-500 text-white text-xs font-bold',
        'flex items-center justify-center',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default Badge;