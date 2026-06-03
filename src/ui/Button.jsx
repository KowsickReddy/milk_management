import React from 'react';
import { cn } from '../lib/utils';

// Button variants
const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/10',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/10',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/10',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  link: 'text-indigo-600 hover:text-indigo-700 underline-offset-4',
};

// Button sizes
const sizes = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
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
        'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-4 focus:ring-indigo-500/10',
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