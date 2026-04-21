import React from 'react';
import { cn } from '../lib/utils';

// Button variants
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-secondary text-white hover:bg-secondary-700 active:bg-secondary-800',
  success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700',
  outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  link: 'text-primary hover:text-primary-700 underline-offset-4',
};

// Button sizes
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
  icon: 'p-2.5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  fullWidth = false,
  type = 'button',
  onClick,
  icon: Icon,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        fullWidth && 'w-full',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12z" />
        </svg>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
}

// Icon Button - Simple wrapper that renders children
export function IconButton({ children, variant = 'ghost', size = 'icon', className, ...props }) {
  return (
    <Button variant={variant} size={size} className={className} {...props}>
      {children}
    </Button>
  );
}

export default Button;