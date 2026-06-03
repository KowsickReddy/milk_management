import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';

// Input
export const Input = forwardRef(function Input(
  { className, label, error, icon: Icon, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white',
            'focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500',
            'transition-all duration-200',
            'placeholder:text-slate-400 text-sm font-medium',
            'disabled:bg-slate-50 disabled:cursor-not-allowed',
            Icon && 'pl-10',
            error && 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-bold text-rose-500 mt-1.5 ml-1">{error}</p>}
    </div>
  );
});

// Textarea
export const Textarea = forwardRef(function Textarea(
  { className, label, error, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white',
          'focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500',
          'transition-all duration-200',
          'placeholder:text-slate-400 text-sm font-medium',
          'min-h-[100px] resize-y',
          error && 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-bold text-rose-500 mt-1.5 ml-1">{error}</p>}
    </div>
  );
});

// Select
export const Select = forwardRef(function Select(
  { className, label, error, options, placeholder, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white',
          'focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500',
          'transition-all duration-200',
          'disabled:bg-slate-50 disabled:cursor-not-allowed text-sm font-medium',
          error && 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
});

// Search Input
export function SearchInput({ className, ...props }) {
  return (
    <Input
      icon={SearchIcon}
      className={className}
      placeholder="Search..."
      {...props}
    />
  );
}

function SearchIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export default Input;