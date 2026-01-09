import React from 'react';
import { BookOpen, DoorOpen, DoorClosed, Search } from 'lucide-react';
import { Card } from './ui';

interface StatsCardsProps {
  stats: {
    total: number;
    open: number;
    closed: number;
    searched: number;
  };
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  gradient: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, gradient, iconBg }) => (
  <Card variant="hover" className="relative overflow-hidden group">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <h3 className={`text-3xl font-bold ${gradient} bg-clip-text text-transparent`}>
          {value.toLocaleString()}
        </h3>
        <p className="text-sm text-zinc-400">{label}</p>
      </div>
    </div>
    {/* Decorative gradient blur */}
    <div className={`absolute -top-10 -right-10 w-24 h-24 ${iconBg} rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity`} />
  </Card>
);

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<BookOpen className="w-6 h-6 text-cyan-400" />}
        value={stats.total}
        label="Total Courses"
        gradient="bg-gradient-to-r from-cyan-400 to-blue-400"
        iconBg="bg-cyan-500/20"
      />
      <StatCard
        icon={<DoorOpen className="w-6 h-6 text-green-400" />}
        value={stats.open}
        label="Open Courses"
        gradient="bg-gradient-to-r from-green-400 to-emerald-400"
        iconBg="bg-green-500/20"
      />
      <StatCard
        icon={<DoorClosed className="w-6 h-6 text-red-400" />}
        value={stats.closed}
        label="Closed Courses"
        gradient="bg-gradient-to-r from-red-400 to-rose-400"
        iconBg="bg-red-500/20"
      />
      <StatCard
        icon={<Search className="w-6 h-6 text-amber-400" />}
        value={stats.searched}
        label="Search Results"
        gradient="bg-gradient-to-r from-amber-400 to-orange-400"
        iconBg="bg-amber-500/20"
      />
    </div>
  );
};

export default StatsCards;
