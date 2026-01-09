import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  Building2, 
  BookOpen, 
  GraduationCap,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  ChevronUp,
  Edit,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { Button, Input, Card, Badge, Select } from '../components/ui';
import OtpModal from '../components/OtpModal';

interface ProfileForm {
  username: string;
  email: string;
  faculty: string;
  major: string;
  studyType: string;
  timeShift?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, loadUser } = useAuthStore();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Profile Form
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile, watch: watchProfile, setValue } = useForm<ProfileForm>();
  const [profileLoading, setProfileLoading] = useState(false);
  
  // OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpEmail, setOtpEmail] = useState<string>('');
  
  // Watch for changes
  const selectedStudyType = watchProfile('studyType');
  const selectedFaculty = watchProfile('faculty');
  
  // Password Change Section
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword, watch } = useForm<PasswordForm>();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Config data
  const [faculties, setFaculties] = useState<any>({});
  const [majors, setMajors] = useState<any>({});

  const newPassword = watch('newPassword');

  // Load config data
  useEffect(() => {
    configService.getFaculties().then(setFaculties);
    configService.getMajors().then(setMajors);
  }, []);

  // Initialize form with user data when user data loads or edit mode is enabled
  useEffect(() => {
    if (user) {
      resetProfile({
        username: user.username || '',
        email: user.email || '',
        studyType: user.studyType || 'بكالوريوس',
        faculty: user.faculty || '',
        major: user.major || '',
        timeShift: user.timeShift || 'الكل',
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true);
    try {
      const response = await authService.updateProfile(data);
      
      // Check if email was changed and requires OTP
      if (response.requiresOtp) {
        setOtpUserId(response.data.userId);
        setOtpEmail(response.data.email);
        setShowOtpModal(true);
        toast.success('Verification code sent to your new email!');
      } else {
        await loadUser();
        setIsEditMode(false); // Exit edit mode after successful save
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!otpUserId) return;
    
    try {
      setProfileLoading(true);
      const response = await authService.verifyOtp(otpUserId, otp);
      
      if (response.success) {
        await loadUser();
        toast.success('Email verified successfully!');
        setShowOtpModal(false);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpUserId) return;
    
    try {
      await authService.resendOtp(otpUserId);
      toast.success('New verification code sent!');
    } catch (error: any) {
      throw error;
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!');
      resetPassword();
      setShowPasswordChange(false);
      // Reload user data to ensure fresh state
      await loadUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Profile Settings</h1>
        <p className="text-zinc-400">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Profile Information</h2>
            <p className="text-sm text-zinc-400">
              {isEditMode ? 'Update your personal details' : 'View your account information'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.isEmailVerified && (
              <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>
                Email Verified
              </Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              placeholder="johndoe"
              icon={<User className="w-5 h-5" />}
              error={profileErrors.username?.message}
              disabled={!isEditMode}
              {...registerProfile('username', { 
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' }
              })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              error={profileErrors.email?.message}
              disabled
              helperText="Email cannot be changed"
              {...registerProfile('email')}
            />
          </div>

          <Select
            label="Study Type"
            icon={<GraduationCap className="w-5 h-5" />}
            error={profileErrors.studyType?.message}
            disabled={!isEditMode}
            {...registerProfile('studyType')}
          >
            <option value="" className="bg-zinc-900">Select study type</option>
            <option value="بكالوريوس" className="bg-zinc-900">Bachelor's (بكالوريوس)</option>
            <option value="دراسات عليا" className="bg-zinc-900">Postgraduate (دراسات عليا)</option>
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditMode ? (
              <>
                <Select
                  label="Faculty"
                  icon={<Building2 className="w-5 h-5" />}
                  error={profileErrors.faculty?.message}
                  {...registerProfile('faculty', {
                    onChange: () => {
                      // Reset major when faculty changes
                      setValue('major', '');
                    }
                  })}
                >
                  <option value="" className="bg-zinc-900">Select faculty</option>
                  {selectedStudyType === 'دراسات عليا' ? (
                    <>
                      <option value="ماجستير" className="bg-zinc-900">Master's (ماجستير)</option>
                      <option value="دبلوم عالي" className="bg-zinc-900">High Diploma (دبلوم عالي)</option>
                    </>
                  ) : (
                    (faculties.bachelor || []).map((f: string) => (
                      <option key={f} value={f} className="bg-zinc-900">{f}</option>
                    ))
                  )}
                </Select>

                <Select
                  label="Major"
                  icon={<BookOpen className="w-5 h-5" />}
                  error={profileErrors.major?.message}
                  {...registerProfile('major')}
                >
                  {!selectedFaculty ? (
                    <option value="" className="bg-zinc-900">Select faculty first</option>
                  ) : (
                    <>
                      <option value="" className="bg-zinc-900">Select major</option>
                      {(majors[selectedFaculty] || []).map((m: any) => (
                        <option key={m} value={m} className="bg-zinc-900">{m}</option>
                      ))}
                    </>
                  )}
                </Select>
              </>
            ) : (
              <>
                {/* Read-only display for Faculty */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Faculty
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl text-zinc-100 opacity-50">
                      {user?.faculty || 'Not set'}
                    </div>
                  </div>
                </div>

                {/* Read-only display for Major */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Major
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl text-zinc-100 opacity-50">
                      {user?.major || 'Not set'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Time Shift Field - Only for Bachelor Students */}
          {selectedStudyType === 'بكالوريوس' && (
            isEditMode ? (
              <Select
                label="Time Shift"
                icon={<Clock className="w-5 h-5" />}
                error={profileErrors.timeShift?.message}
                {...registerProfile('timeShift')}
              >
                <option value="" className="bg-zinc-900">All Times (Default)</option>
                <option value="صباحي" className="bg-zinc-900">Morning (صباحي)</option>
                <option value="مسائي" className="bg-zinc-900">Evening (مسائي)</option>
              </Select>
            ) : (
              <div className="w-full">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Time Shift
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl text-zinc-100 opacity-50">
                    {user?.timeShift === 'صباحي' ? 'Morning (صباحي)' : user?.timeShift === 'مسائي' ? 'Evening (مسائي)' : 'All Times (Default)'}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Masked Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                value="••••••••••••" 
                readOnly 
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl text-zinc-400 cursor-not-allowed"
              />
            </div>
            <button 
              type="button" 
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
            >
              {showPasswordChange ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Cancel Password Change
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </div>

          {/* Collapsible Password Change Section */}
          {showPasswordChange && (
            <div className="mt-4 p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-medium text-zinc-200">Change Password</h3>
              </div>
              
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  icon={<Lock className="w-5 h-5" />}
                  error={passwordErrors.currentPassword?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                />
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  icon={<Lock className="w-5 h-5" />}
                  error={passwordErrors.newPassword?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  {...registerPassword('newPassword', { 
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                  })}
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  icon={<Lock className="w-5 h-5" />}
                  error={passwordErrors.confirmPassword?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  {...registerPassword('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (value) => value === newPassword || 'Passwords do not match'
                  })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700/50">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordChange(false);
                    resetPassword();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  loading={passwordLoading}
                  onClick={handlePasswordSubmit(onPasswordSubmit)}
                  icon={<Lock className="w-4 h-4" />}
                >
                  Save Password
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
            {!isEditMode ? (
              <Button
                type="button"
                onClick={() => setIsEditMode(true)}
                icon={<Edit className="w-4 h-4" />}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditMode(false);
                    // Reset form to original user data
                    if (user) {
                      resetProfile({
                        username: user.username || '',
                        email: user.email || '',
                        studyType: user.studyType || 'بكالوريوس',
                        faculty: user.faculty || '',
                        major: user.major || '',
                        timeShift: user.timeShift || 'الكل',
                      });
                    }
                  }}
                  icon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={profileLoading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </form>
      </Card>

      {/* OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        email={otpEmail}
        loading={profileLoading}
      />
    </div>
  );
};

export default Profile;
