import React from 'react';
import { FileX, Search, Inbox } from 'lucide-react';
import { cn } from './utils';
import Button from './Button';

export type EmptyStateVariant = 'default' | 'search' | 'error';

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox className="w-16 h-16" />,
  search: <Search className="w-16 h-16" />,
  error: <FileX className="w-16 h-16" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="text-zinc-600 mb-4">
        {icon || defaultIcons[variant]}
      </div>
      <h3 className="text-xl font-semibold text-zinc-400 mb-2">{title}</h3>
      {description && (
        <p className="text-zinc-500 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
