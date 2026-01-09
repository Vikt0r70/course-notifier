import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Star, 
  Settings, 
  ArrowLeft,
  Menu,
  AlertCircle
} from 'lucide-react';
import { cn } from '../components/ui/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { to: '/admin/watchlists', icon: Star, label: 'Watchlists' },
  { to: '/admin/reports', icon: AlertCircle, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800/50 transform transition-transform duration-200 ease-in-out lg:transform-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-800/50">
            <div>
              <h2 className="text-xl font-bold text-white">
                Admin Panel
              </h2>
              <p className="text-xs text-zinc-400">Course Notifier</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label, exact }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                  isActive(to, exact)
                    ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive(to, exact) ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Back to site */}
          <div className="p-4 border-t border-zinc-800/50">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Site</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100">Admin Panel</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
