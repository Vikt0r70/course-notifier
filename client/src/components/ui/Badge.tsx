import React from 'react';
import { cn } from './utils';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  neutral: 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  icon,
  size = 'md',
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
};

// Predefined status badges for course availability
export const StatusBadge: React.FC<{ status: 'open' | 'closed'; size?: 'sm' | 'md' }> = ({ 
  status, 
  size = 'md' 
}) => {
  return (
    <Badge variant={status === 'open' ? 'success' : 'danger'} size={size}>
      {status === 'open' ? 'مفتوح' : 'مغلق'}
    </Badge>
  );
};

export default Badge;
