import React from 'react';
import { cn } from './utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'accent';
}

const sizeStyles = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const variantStyles = {
  primary: 'border-zinc-700 border-t-cyan-500',
  white: 'border-zinc-600 border-t-white',
  accent: 'border-zinc-700 border-t-violet-500',
};

export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = 'md',
  variant = 'primary',
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

// Full-page loading spinner
export const PageSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <Spinner size="xl" variant="primary" />
      <p className="mt-4 text-zinc-400">{message}</p>
    </div>
  );
};

// Inline loading state
export const InlineSpinner: React.FC<SpinnerProps & { text?: string }> = ({
  text,
  size = 'sm',
  ...props
}) => {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size={size} {...props} />
      {text && <span className="text-zinc-400">{text}</span>}
    </span>
  );
};

export default Spinner;
