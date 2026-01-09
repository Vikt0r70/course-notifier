import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Mail, 
  Bell, 
  Smartphone,
  DoorOpen,
  DoorClosed,
  Copy,
  Save,
  Loader2
} from 'lucide-react';
import { Card, Button, Toggle } from './ui';
import { authService } from '../services/authService';
import { NotificationSettings } from '../types';

const NotificationSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Local state for the form
  const [settings, setSettings] = useState<NotificationSettings>({
    notifyOnOpen: true,
    notifyOnClose: false,
    notifyOnSimilarCourse: true,
    notifyByEmail: true,
    notifyByWeb: true,
    notifyByPhone: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current settings from server
  const { isLoading } = useQuery(
    'notificationSettings',
    authService.getNotificationSettings,
    {
      onSuccess: (data) => {
        setSettings(data);
      },
      staleTime: 0,              // Always consider data stale
      refetchOnMount: 'always',  // Always refetch when component mounts
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (newSettings: Partial<NotificationSettings>) => 
      authService.updateNotificationSettings(newSettings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationSettings');
        setHasChanges(false);
        toast.success('Notification settings saved!');
      },
      onError: () => {
        toast.error('Failed to save settings. Please try again.');
      },
    }
  );

  // Track changes
  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save handler
  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-700 rounded-lg" />
          <div className="h-6 w-48 bg-zinc-700 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Global Notification Settings</h2>
            <p className="text-sm text-zinc-400">These settings apply to all your watched courses</p>
          </div>
        </div>
        
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={updateMutation.isLoading}
            icon={updateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* When to notify */}
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">When to notify</p>
          <div className="space-y-3">
            <Toggle
              checked={settings.notifyOnOpen}
              onChange={(checked) => handleSettingChange('notifyOnOpen', checked)}
              label="When course opens"
              icon={DoorOpen}
            />
            <Toggle
              checked={settings.notifyOnClose}
              onChange={(checked) => handleSettingChange('notifyOnClose', checked)}
              label="When course closes"
              icon={DoorClosed}
            />
            <Toggle
              checked={settings.notifyOnSimilarCourse}
              onChange={(checked) => handleSettingChange('notifyOnSimilarCourse', checked)}
              label="Similar sections open"
              icon={Copy}
            />
          </div>
        </div>

        {/* How to notify */}
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">How to notify</p>
          <div className="space-y-3">
            <Toggle
              checked={settings.notifyByEmail}
              onChange={(checked) => handleSettingChange('notifyByEmail', checked)}
              label="Email"
              icon={Mail}
            />
            <Toggle
              checked={settings.notifyByWeb}
              onChange={(checked) => handleSettingChange('notifyByWeb', checked)}
              label="Web notification"
              icon={Bell}
            />
            <Toggle
              checked={settings.notifyByPhone}
              onChange={(checked) => handleSettingChange('notifyByPhone', checked)}
              label="Phone App"
              icon={Smartphone}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettingsPanel;
