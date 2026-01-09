import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from './utils';

export type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  success: 'border-green-500/30 bg-green-500/10',
  danger: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  info: 'border-cyan-500/30 bg-cyan-500/10',
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-400" />,
  danger: <AlertCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
};

const variantTextColors: Record<AlertVariant, string> = {
  success: 'text-green-300',
  danger: 'text-red-300',
  warning: 'text-yellow-300',
  info: 'text-cyan-300',
};

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative p-4 flex items-start gap-3 rounded-2xl border backdrop-blur-xl',
        variantStyles[variant],
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex-shrink-0">
        {icon || variantIcons[variant]}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className={cn('font-semibold mb-1', variantTextColors[variant])}>
            {title}
          </h5>
        )}
        <div className={cn('text-sm', variantTextColors[variant], 'opacity-90')}>
          {children}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg transition-colors',
            'hover:bg-white/10',
            variantTextColors[variant]
          )}
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
