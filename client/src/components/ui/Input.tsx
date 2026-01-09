import React, { forwardRef } from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, helperText, type = 'text', autoComplete, ...props }, ref) => {
    // Auto-set autocomplete for password fields if not provided
    const effectiveAutoComplete = autoComplete ?? (type === 'password' ? 'current-password' : undefined);
    
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
          <input
            ref={ref}
            type={type}
            autoComplete={effectiveAutoComplete}
            className={cn(
              'w-full px-4 py-3',
              'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl',
              'text-zinc-100 placeholder:text-zinc-500',
              'focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
              'transition-all duration-200',
              icon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;
