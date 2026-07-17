import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export const Input = forwardRef(function Input(
  { className, label, error, icon: Icon, floating = false, ...props },
  ref
) {
  const [focused, setFocused] = useState(false);
  const hasValue = props.value || props.defaultValue || props.placeholder;

  return (
    <div className="w-full">
      {label && !floating && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className={cn(
            'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white',
            'transition-all duration-200',
            'placeholder:text-slate-400 text-sm font-medium text-slate-900',
            'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400',
            'hover:border-slate-300',
            'focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand',
            Icon && 'pl-10',
            error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
            floating && label && (focused || hasValue) && 'pt-5 pb-2',
            className
          )}
          {...props}
        />
        {floating && label && (
          <label className={cn(
            'absolute left-4 transition-all duration-200 pointer-events-none',
            'text-slate-400 font-medium',
            Icon && 'left-10',
            (focused || hasValue)
              ? 'text-[10px] -translate-y-1 top-2'
              : 'text-sm top-1/2 -translate-y-1/2',
            focused && 'text-brand'
          )}>
            {label}
          </label>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-rose-500 mt-1.5 ml-1">{error}</p>}
    </div>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={show ? 'text' : 'password'} {...props} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});

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
          'transition-all duration-200',
          'placeholder:text-slate-400 text-sm font-medium text-slate-900',
          'min-h-[100px] resize-y',
          'hover:border-slate-300',
          'focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand',
          error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-rose-500 mt-1.5 ml-1">{error}</p>}
    </div>
  );
});

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
          'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white appearance-none cursor-pointer',
          'transition-all duration-200',
          'text-sm font-medium text-slate-900',
          'disabled:bg-slate-50 disabled:cursor-not-allowed',
          'hover:border-slate-300',
          'focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand',
          error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
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
      {error && <p className="text-xs font-semibold text-rose-500 mt-1.5 ml-1">{error}</p>}
    </div>
  );
});

export function SearchInput({ className, ...props }) {
  return (
    <Input
      icon={SearchIcon}
      className={cn('pl-10', className)}
      placeholder="Search..."
      {...props}
    />
  );
}

function SearchIcon(props) {
  return <Search className="w-4 h-4" {...props} />;
}

export default Input;
