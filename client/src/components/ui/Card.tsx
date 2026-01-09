import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'stats';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl',
        variant === 'hover' && 'transition-all duration-300 hover:bg-zinc-800/60 hover:border-zinc-700/60 hover:shadow-glass cursor-pointer',
        variant === 'stats' && 'flex flex-col gap-2',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  title,
  description,
  action,
  ...props
}) => {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
        {description && (
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('mt-4 pt-4 border-t border-zinc-800/50', className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
