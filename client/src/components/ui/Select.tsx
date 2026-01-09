import React, { forwardRef } from 'react';
import { cn } from './utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  helperText?: string;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon, options, placeholder, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 appearance-none cursor-pointer',
              'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl',
              'text-zinc-100',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon ? 'pl-11 pr-10' : 'pr-10',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              backgroundRepeat: 'no-repeat'
            }}
            {...props}
          >
            {/* Support both children and options prop */}
            {children ? (
              children
            ) : (
              <>
                {placeholder && (
                  <option value="" className="bg-zinc-900">
                    {placeholder}
                  </option>
                )}
                {options?.map((option) => (
                  <option key={option.value} value={option.value} className="bg-zinc-900 text-zinc-100">
                    {option.label}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        {error && (
          <p className="text-sm text-red-400 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-zinc-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
