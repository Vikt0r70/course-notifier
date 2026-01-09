import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Star, 
  Bell,
  LogOut, 
  User, 
  Settings, 
  ChevronDown,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ReportProblemModal from '../components/ReportProblemModal';
import { cn } from '../components/ui/utils';
import { Avatar } from '../components/ui';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/watchlist', label: 'Watchlist', icon: Star },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const isActiveLink = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo & Nav Links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link 
                to="/dashboard" 
                className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition"
              >
                Course Notifier
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                      isActiveLink(link.to)
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Report Problem Button - More Obvious */}
              <button
                onClick={() => setShowReportModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 transition-all group"
                title="Report a Problem"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Report Issue</span>
              </button>

              {/* Mobile Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="md:hidden p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors group"
                title="Report a Problem"
              >
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
                    'hover:bg-zinc-800/50',
                    isUserMenuOpen && 'bg-zinc-800/50'
                  )}
                >
                  <Avatar size="sm" fallback={user?.username || 'U'} />
                  <span className="hidden sm:block text-sm font-medium text-zinc-100">
                    {user?.username}
                  </span>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-zinc-400 transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180'
                  )} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 py-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl shadow-glass animate-fade-in">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-zinc-800/50">
                      <p className="text-sm font-medium text-zinc-100">{user?.username}</p>
                      <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                      {user?.isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </Link>

                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-zinc-800/50 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/50 bg-zinc-900/95 backdrop-blur-xl animate-fade-in">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                    isActiveLink(link.to)
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content - with top padding for fixed navbar */}
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900/50 backdrop-blur-xl border-t border-zinc-800/50 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center">
          <p className="text-sm text-zinc-500">
            Made with <span className="text-red-500">❤️</span>
          </p>
        </div>
      </footer>

      {/* Report Problem Modal */}
      <ReportProblemModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
};

export default MainLayout;
