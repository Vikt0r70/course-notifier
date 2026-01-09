import React from 'react';
import { cn } from './utils';
import { LucideIcon } from 'lucide-react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  label, 
  description,
  icon: Icon,
  disabled = false
}) => (
  <label 
    className={cn(
      "flex items-start gap-3 cursor-pointer group",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    onClick={(e) => {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }}
  >
    <div className={cn(
      'relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5',
      checked ? 'bg-violet-600' : 'bg-zinc-700'
    )}>
      <div className={cn(
        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-1'
      )} />
    </div>
    {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', checked ? 'text-violet-400' : 'text-zinc-500')} />}
    <div className="flex flex-col">
      <span className={cn('text-sm', checked ? 'text-zinc-200' : 'text-zinc-400')}>
        {label}
      </span>
      {description && (
        <span className="text-xs text-zinc-500 mt-0.5">{description}</span>
      )}
    </div>
  </label>
);

export default Toggle;
