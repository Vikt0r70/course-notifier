import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { 
  Play, 
  Clock, 
  RefreshCw, 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Database,
  Server,
  Settings,
  Terminal,
  Eye,
  EyeOff,
  Trash2,
  Users,
  BookOpen,
  Bell,
  Activity,
  Loader2,
  Filter
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, Button, Input, Badge, Spinner } from '../../components/ui';
import { cn } from '../../components/ui/utils';

type TabType = 'scraper' | 'smtp' | 'server-logs' | 'database';

const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('scraper');
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');
  
  // SMTP form state
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    user: '',
    password: '',
    from: '',
    secure: false,
  });

  // Queries
  const { data: settings, isLoading: settingsLoading } = useQuery('adminSettings', adminService.getSettings);
  const { data: scraperLogs, isLoading: logsLoading } = useQuery('scraperLogs', () => adminService.getScraperLogs(5));
  const { data: _smtpSettings, isLoading: smtpLoading } = useQuery('smtpSettings', adminService.getSmtpSettings, {
    onSuccess: (data) => {
      if (data) {
        // Backend returns keys with 'smtp_' prefix
        setSmtpForm({
          host: data.smtp_host || '',
          port: parseInt(data.smtp_port) || 587,
          user: data.smtp_user || '',
          password: data.smtp_pass || '',
          from: data.smtp_from || '',
          secure: data.smtp_secure === 'true',
        });
      }
    }
  });
  
  const { data: serverLogs, isLoading: serverLogsLoading, refetch: refetchServerLogs } = useQuery(
    ['serverLogs', logFilter],
    () => adminService.getServerLogs(200, logFilter === 'all' ? undefined : logFilter),
    { refetchInterval: 10000 } // Auto-refresh every 10 seconds
  );
  
  const { data: databaseStats, isLoading: databaseLoading } = useQuery('databaseStats', adminService.getDatabaseLogs);
  
  const { data: scraperStatus, refetch: refetchScraperStatus } = useQuery(
    'scraperStatus', 
    adminService.getScraperStatus,
    { refetchInterval: 5000 } // Auto-refresh every 5 seconds when scraper running
  );

  // Watch All Courses query
  const { data: watchAllStatus, isLoading: watchAllLoading } = useQuery(
    'watchAllStatus',
    adminService.getWatchAllCoursesStatus
  );

  // Mutations
  const runScraperMutation = useMutation(adminService.runScraper, {
    onSuccess: () => {
      toast.success('Scraper started. This will take 10-15 minutes.');
      queryClient.invalidateQueries('scraperLogs');
      refetchScraperStatus();
    },
    onError: () => {
      toast.error('Failed to start scraper');
    }
  });

  const updateSettingMutation = useMutation(
    ({ key, value }: { key: string; value: string }) => adminService.updateSettings(key, value),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSettings');
        toast.success('Setting updated');
      },
      onError: () => {
        toast.error('Failed to update setting');
      }
    }
  );

  const updateSmtpMutation = useMutation(adminService.updateSmtpSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('smtpSettings');
      toast.success('SMTP settings saved successfully!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to save SMTP settings';
      toast.error(message);
    }
  });

  const sendTestEmailMutation = useMutation(
    (email: string) => adminService.sendTestEmail(email),
    {
      onSuccess: () => {
        toast.success('Test email sent successfully! Check your inbox.');
        setTestEmail('');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || error?.message || 'Failed to send test email';
        toast.error(`Email failed: ${message}`);
      }
    }
  );

  const clearLogsMutation = useMutation(adminService.clearServerLogs, {
    onSuccess: () => {
      queryClient.invalidateQueries('serverLogs');
      toast.success('Server logs cleared');
    },
    onError: () => {
      toast.error('Failed to clear logs');
    }
  });

  const toggleWatchAllMutation = useMutation(adminService.toggleWatchAllCourses, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('watchAllStatus');
      toast.success(data.data?.watchAllCourses 
        ? 'Watch All Courses enabled - You will receive notifications for all course changes'
        : 'Watch All Courses disabled');
    },
    onError: () => {
      toast.error('Failed to toggle Watch All Courses');
    }
  });

  const tabs = [
    { id: 'scraper' as TabType, label: 'Scraper', icon: RefreshCw },
    { id: 'smtp' as TabType, label: 'SMTP', icon: Mail },
    { id: 'server-logs' as TabType, label: 'Server Logs', icon: Terminal },
    { id: 'database' as TabType, label: 'Database', icon: Database },
  ];

  if (settingsLoading) {
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
        <h1 className="text-3xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-400 mt-1">Configure scraper, email, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'scraper' && (
        <div className="space-y-6">
          {/* Scraper Status */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Activity className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Scraper Status</h2>
              {scraperStatus?.isRunning && (
                <Badge variant="warning" className="animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Running
                </Badge>
              )}
            </div>

            <div className="space-y-6">
              {/* Current Status */}
              {scraperStatus?.isRunning ? (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-3 text-amber-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Scraper is currently running...</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2">
                    The scraper is actively fetching course data. This may take 10-15 minutes.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Scraper is idle</span>
                  </div>
                  {scraperStatus?.lastRun && scraperStatus.lastRun.completedAt && (
                    <p className="text-sm text-zinc-400 mt-2">
                      Last run: {new Date(scraperStatus.lastRun.completedAt).toLocaleString('en-US')} 
                      {' - '}{scraperStatus.lastRun.coursesScraped} courses scraped
                    </p>
                  )}
                </div>
              )}

              {/* Run Scraper Button */}
              <div>
                <Button
                  variant="success"
                  onClick={() => runScraperMutation.mutate()}
                  disabled={runScraperMutation.isLoading || scraperStatus?.isRunning}
                  icon={scraperStatus?.isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                >
                  {scraperStatus?.isRunning ? 'Scraper Running...' : 'Run Scraper Now'}
                </Button>
                <p className="text-sm text-zinc-500 mt-2">
                  Manually trigger a course data scrape from the university system
                </p>
              </div>

              {/* Scraper Interval */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    Auto-Scrape Interval
                  </div>
                </label>
                <select
                  className="w-full sm:w-64 px-4 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  value={settings?.scraper_interval_minutes || '60'}
                  onChange={(e) =>
                    updateSettingMutation.mutate({
                      key: 'scraper_interval_minutes',
                      value: e.target.value,
                    })
                  }
                >
                  <option value="0">Disabled</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="60">Every hour</option>
                  <option value="120">Every 2 hours</option>
                  <option value="240">Every 4 hours</option>
                </select>
              </div>

              {/* Auto Sync Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div 
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                      settings?.scraper_auto_sync === 'true' ? 'bg-violet-600' : 'bg-zinc-700'
                    )}
                    onClick={() =>
                      updateSettingMutation.mutate({
                        key: 'scraper_auto_sync',
                        value: settings?.scraper_auto_sync === 'true' ? 'false' : 'true',
                      })
                    }
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                      settings?.scraper_auto_sync === 'true' ? 'translate-x-7' : 'translate-x-1'
                    )} />
                  </div>
                  <div>
                    <span className="text-zinc-200">Enable Auto-Sync</span>
                    <p className="text-sm text-zinc-500">Automatically scrape courses at the set interval</p>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {/* Scraper Logs */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <RefreshCw className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Recent Scraper Logs</h2>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : scraperLogs?.length > 0 ? (
              <div className="space-y-3">
                {scraperLogs.map((log: any) => (
                  <div 
                    key={log.id} 
                    className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <Badge variant={log.status === 'completed' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'}>
                        {log.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {log.status === 'failed' && <XCircle className="w-3 h-3" />}
                        {log.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-zinc-500">
                        {new Date(log.startedAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Scraped:</span>
                        <span className="ml-2 text-zinc-200">{log.coursesScraped}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Added:</span>
                        <span className="ml-2 text-emerald-400">+{log.coursesAdded}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Updated:</span>
                        <span className="ml-2 text-cyan-400">{log.coursesUpdated}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Removed:</span>
                        <span className="ml-2 text-red-400">-{log.coursesRemoved}</span>
                      </div>
                    </div>
                    {log.errorMessage && (
                      <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          {log.errorMessage}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                No scraper logs available
              </div>
            )}
          </Card>

          {/* Watch All Courses - Admin Alert Feature */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-fuchsia-500/20">
                <Bell className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Admin Course Alerts</h2>
            </div>

            {watchAllLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div 
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 mt-1',
                        watchAllStatus?.watchAllCourses ? 'bg-fuchsia-600' : 'bg-zinc-700'
                      )}
                      onClick={() => toggleWatchAllMutation.mutate()}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                        watchAllStatus?.watchAllCourses ? 'translate-x-7' : 'translate-x-1'
                      )} />
                    </div>
                    <div className="flex-1">
                      <span className="text-zinc-200 font-medium">Watch All Courses</span>
                      <p className="text-sm text-zinc-500 mt-1">
                        Receive notifications whenever any course is added, opened, closed, or removed from the system.
                      </p>
                    </div>
                  </label>
                </div>

                {watchAllStatus?.watchAllCourses && (
                  <div className="p-4 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30">
                    <p className="text-sm text-fuchsia-300 font-medium mb-2">You will be notified when:</p>
                    <ul className="text-sm text-zinc-400 list-disc list-inside space-y-1">
                      <li><span className="text-violet-400">New courses</span> are added to the system</li>
                      <li>Courses <span className="text-emerald-400">open</span> (seats become available)</li>
                      <li>Courses <span className="text-red-400">close</span> (no more seats)</li>
                      <li>Courses are <span className="text-zinc-400">removed</span> from the schedule</li>
                    </ul>
                    <p className="text-xs text-zinc-500 mt-3">
                      Notifications will be sent via email and shown in your notification center.
                    </p>
                  </div>
                )}

                {!watchAllStatus?.watchAllCourses && (
                  <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                    <p className="text-sm text-zinc-500">
                      Enable this feature to monitor all course changes across the system. 
                      This is useful for administrators who want to stay informed about the overall course availability.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'smtp' && (
        <div className="space-y-6">
          {/* SMTP Configuration */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">SMTP Configuration</h2>
            </div>

            {smtpLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SMTP Host */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      SMTP Host
                    </label>
                    <Input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      icon={<Server className="w-4 h-4" />}
                    />
                  </div>

                  {/* SMTP Port */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      SMTP Port
                    </label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={smtpForm.port.toString()}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                    />
                  </div>

                  {/* SMTP User */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      SMTP Username
                    </label>
                    <Input
                      type="email"
                      placeholder="your-email@gmail.com"
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      icon={<Mail className="w-4 h-4" />}
                    />
                  </div>

                  {/* SMTP Password */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      SMTP Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="App password or SMTP password"
                        value={smtpForm.password}
                        onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* From Address */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      From Address
                    </label>
                    <Input
                      type="email"
                      placeholder="noreply@coursenotifier.com"
                      value={smtpForm.from}
                      onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                      icon={<Send className="w-4 h-4" />}
                    />
                  </div>

                  {/* Secure Toggle */}
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div 
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                          smtpForm.secure ? 'bg-violet-600' : 'bg-zinc-700'
                        )}
                        onClick={() => setSmtpForm({ ...smtpForm, secure: !smtpForm.secure })}
                      >
                        <div className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                          smtpForm.secure ? 'translate-x-7' : 'translate-x-1'
                        )} />
                      </div>
                      <div>
                        <span className="text-zinc-200">Use SSL/TLS</span>
                        <p className="text-sm text-zinc-500">Enable for port 465, disable for port 587</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Gmail Configuration Tip */}
                <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-4">
                  <p className="text-sm text-cyan-300 font-medium mb-2">Gmail Configuration Tips:</p>
                  <ul className="text-sm text-zinc-400 list-disc list-inside space-y-1">
                    <li>Use <code className="text-cyan-400">smtp.gmail.com</code> as host</li>
                    <li>Port <code className="text-cyan-400">587</code> with SSL/TLS <span className="text-amber-400">OFF</span> (recommended)</li>
                    <li>Port <code className="text-cyan-400">465</code> with SSL/TLS <span className="text-emerald-400">ON</span></li>
                    <li>Use a <span className="text-amber-400">Gmail App Password</span>, not your regular password</li>
                    <li>From address should match your Gmail (or use your email)</li>
                  </ul>
                </div>

                {/* Port/SSL Mismatch Warning */}
                {((smtpForm.port === 587 && smtpForm.secure) || (smtpForm.port === 465 && !smtpForm.secure)) && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        {smtpForm.port === 587 
                          ? 'Port 587 typically requires SSL/TLS to be OFF (uses STARTTLS)'
                          : 'Port 465 typically requires SSL/TLS to be ON'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => updateSmtpMutation.mutate({
                      smtp_host: smtpForm.host,
                      smtp_port: smtpForm.port.toString(),
                      smtp_user: smtpForm.user,
                      smtp_pass: smtpForm.password,
                      smtp_from: smtpForm.from,
                      smtp_secure: smtpForm.secure.toString(),
                    })}
                    disabled={updateSmtpMutation.isLoading}
                    icon={<Settings className="w-4 h-4" />}
                  >
                    {updateSmtpMutation.isLoading ? 'Saving...' : 'Save SMTP Settings'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Email Testing */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Send className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Test Email</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address for testing"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
              <Button
                onClick={() => {
                  if (testEmail) {
                    sendTestEmailMutation.mutate(testEmail);
                  } else {
                    toast.error('Please enter an email address');
                  }
                }}
                disabled={sendTestEmailMutation.isLoading || !testEmail}
                icon={<Send className="w-4 h-4" />}
              >
                {sendTestEmailMutation.isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
            <p className="text-sm text-zinc-500 mt-2">
              Send a test email to verify your SMTP configuration is working correctly
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'server-logs' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Server Logs</h2>
              <Badge variant="info" className="text-xs">
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-violet-500/50"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isLoading}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetchServerLogs()}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {serverLogsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : serverLogs?.length > 0 ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-700/50 max-h-[500px] overflow-y-auto font-mono text-sm">
              {serverLogs.map((log: any, index: number) => (
                <div 
                  key={index}
                  className={cn(
                    'px-4 py-2 border-b border-zinc-800/50 hover:bg-zinc-800/30',
                    log.level === 'error' && 'bg-red-500/5',
                    log.level === 'warn' && 'bg-amber-500/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-US')}
                    </span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-medium uppercase',
                      log.level === 'info' && 'bg-cyan-500/20 text-cyan-400',
                      log.level === 'warn' && 'bg-amber-500/20 text-amber-400',
                      log.level === 'error' && 'bg-red-500/20 text-red-400'
                    )}>
                      {log.level}
                    </span>
                    <span className={cn(
                      'flex-1',
                      log.level === 'error' ? 'text-red-300' : 
                      log.level === 'warn' ? 'text-amber-300' : 'text-zinc-300'
                    )}>
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No server logs available</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database Stats */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-fuchsia-500/20">
                <Database className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Database Statistics</h2>
            </div>

            {databaseLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : databaseStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span className="text-zinc-400 text-sm">Users</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{databaseStats.stats?.totalUsers || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span className="text-zinc-400 text-sm">Courses</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{databaseStats.stats?.totalCourses || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-violet-400" />
                    <span className="text-zinc-400 text-sm">Watchlists</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{databaseStats.stats?.totalWatchlists || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <span className="text-zinc-400 text-sm">Notifications</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">{databaseStats.stats?.totalNotifications || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                No database statistics available
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Recent Activity</h2>
            </div>

            {databaseLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Recent Users
                  </h3>
                  <div className="space-y-2">
                    {databaseStats?.recentActivity?.users?.length > 0 ? (
                      databaseStats.recentActivity.users.map((user: any) => (
                        <div key={user.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                          <p className="text-zinc-200 font-medium">{user.username}</p>
                          <p className="text-zinc-500 text-sm">{user.email}</p>
                          <p className="text-zinc-600 text-xs mt-1">
                            {new Date(user.createdAt).toLocaleString('en-US')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-sm">No recent users</p>
                    )}
                  </div>
                </div>

                {/* Recent Watchlists */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Recent Watchlists
                  </h3>
                  <div className="space-y-2">
                    {databaseStats?.recentActivity?.watchlists?.length > 0 ? (
                      databaseStats.recentActivity.watchlists.map((watchlist: any) => (
                        <div key={watchlist.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                          <p className="text-zinc-200 font-medium">{watchlist.courseCode} - {watchlist.section}</p>
                          <p className="text-zinc-500 text-sm">{watchlist.courseName}</p>
                          <p className="text-zinc-600 text-xs mt-1">
                            {new Date(watchlist.addedAt).toLocaleString('en-US')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-sm">No recent watchlists</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
