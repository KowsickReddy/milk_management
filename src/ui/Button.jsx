import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-600 shadow-lg shadow-brand/20 focus:ring-brand/20',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 focus:ring-slate-500/20',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10 focus:ring-emerald-500/20',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/10 focus:ring-rose-500/20',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/10 focus:ring-amber-500/20',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-100',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-200',
  link: 'text-brand hover:text-brand-600 underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-7 py-3.5 text-base rounded-2xl',
  icon: 'p-2.5 rounded-xl',
};

const LoadingSpinner = ({ className }) => (
  <svg className={cn('animate-spin h-4 w-4', className)} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12z" />
  </svg>
);

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
    <motion.button
      type={type}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-4',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
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
        <LoadingSpinner />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </motion.button>
  );
}

export function IconButton({ children, variant = 'ghost', size = 'icon', className, ...props }) {
  return (
    <Button variant={variant} size={size} className={className} {...props}>
      {children}
    </Button>
  );
}

export default Button;
