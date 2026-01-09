import React from 'react';
import { useQuery } from 'react-query';
import { Users, BookOpen, Star, CheckCircle, DoorOpen, DoorClosed, Clock, TrendingUp } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, Badge, Spinner } from '../../components/ui';
import { cn } from '../../components/ui/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, gradient, iconBg }) => (
  <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
    <div className={cn('absolute inset-0 opacity-20', gradient)} />
    <div className="relative flex items-center gap-4">
      <div className={cn('p-3 rounded-xl', iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="text-3xl font-bold text-zinc-100">{value}</p>
      </div>
    </div>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery('adminStats', adminService.getDashboardStats);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of system statistics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6 text-white" />}
          label="Total Users"
          value={stats?.totalUsers || 0}
          gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
          iconBg="bg-gradient-to-br from-blue-600 to-cyan-600"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          label="Verified Users"
          value={stats?.verifiedUsers || 0}
          gradient="bg-gradient-to-br from-emerald-600 to-green-600"
          iconBg="bg-gradient-to-br from-emerald-600 to-green-600"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-white" />}
          label="Total Courses"
          value={stats?.totalCourses || 0}
          gradient="bg-gradient-to-br from-violet-600 to-purple-600"
          iconBg="bg-gradient-to-br from-violet-600 to-purple-600"
        />
        <StatCard
          icon={<Star className="w-6 h-6 text-white" />}
          label="Watchlist Items"
          value={stats?.totalWatchlists || 0}
          gradient="bg-gradient-to-br from-amber-600 to-orange-600"
          iconBg="bg-gradient-to-br from-amber-600 to-orange-600"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Status Card */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Course Status</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <DoorOpen className="w-5 h-5 text-emerald-400" />
                <span className="text-zinc-300">Open Courses</span>
              </div>
              <Badge variant="success">
                {stats?.openCourses || 0}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <DoorClosed className="w-5 h-5 text-red-400" />
                <span className="text-zinc-300">Closed Courses</span>
              </div>
              <Badge variant="danger">
                {stats?.closedCourses || 0}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>Open Rate</span>
                <span>
                  {stats?.totalCourses 
                    ? Math.round((stats.openCourses / stats.totalCourses) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats?.totalCourses ? (stats.openCourses / stats.totalCourses) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Users Card */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Recent Users</h3>
          </div>
          
          <div className="space-y-3">
            {stats?.recentUsers?.length > 0 ? (
              stats.recentUsers.map((user: any) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-zinc-200 font-medium">{user.username}</p>
                      <p className="text-zinc-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.isEmailVerified ? 'success' : 'warning'} size="sm">
                    {user.isEmailVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500">
                No recent users
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Last Scraper Run */}
      {stats?.lastScraperRun && (
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Last Data Update</p>
              <p className="text-lg font-semibold text-zinc-100">
                {new Date(stats.lastScraperRun).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
