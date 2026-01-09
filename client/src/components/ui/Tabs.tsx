import React from 'react';
import { cn } from './utils';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex gap-1 p-1 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-xl', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-700/50 text-zinc-400'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Vertical tabs variant
export interface VerticalTabsProps extends TabsProps {
  fullWidth?: boolean;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  fullWidth = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-2 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-xl',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-left',
            activeTab === tab.id
              ? 'text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          )}
        >
          {tab.icon}
          <span className="flex-1">{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-700/50 text-zinc-400'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
