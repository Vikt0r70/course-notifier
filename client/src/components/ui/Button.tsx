import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40 focus-visible:ring-violet-500',
  secondary: 'bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600 focus-visible:ring-zinc-500',
  ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 focus-visible:ring-zinc-500',
  success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:from-green-500 hover:to-emerald-500 hover:shadow-green-500/40 focus-visible:ring-green-500',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:from-red-500 hover:to-rose-500 hover:shadow-red-500/40 focus-visible:ring-red-500',
  outline: 'bg-transparent border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 focus-visible:ring-cyan-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-base px-4 py-2.5 rounded-xl',
  lg: 'text-lg px-6 py-3 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
