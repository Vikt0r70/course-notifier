import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components/ui';
import OtpModal from '../components/OtpModal';

interface ForgotPasswordForm {
  email: string;
}

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { setUserWithToken } = useAuthStore();
  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm<ForgotPasswordForm>();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch, reset: resetPasswordForm } = useForm<ResetPasswordForm>({
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch('newPassword');

  // Reset password form when entering password step
  React.useEffect(() => {
    if (step === 'password') {
      resetPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [step, resetPasswordForm]);

  const onEmailSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      // Normalize email to lowercase
      const normalizedEmail = data.email.toLowerCase().trim();
      const response = await authService.forgotPassword(normalizedEmail);
      setUserEmail(normalizedEmail);
      setUserId(response.data.userId);
      setShowOtpModal(true);
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setLoading(true);
      const response = await authService.verifyPasswordResetOtp(userId!, otp);
      
      if (response.success) {
        setShowOtpModal(false);
        setStep('password');
        toast.success('Code verified! Now set your new password.');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authService.resendPasswordResetOtp(userId!);
      toast.success('New verification code sent!');
    } catch (error: any) {
      throw error;
    }
  };

  const onPasswordSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      await authService.resetPasswordWithOtp(userId!, data.newPassword);
      
      // Auto-login with the new password
      const loginResponse = await authService.login(userEmail, data.newPassword);
      if (loginResponse.success) {
        setUserWithToken(loginResponse.data.user, loginResponse.data.token);
        toast.success('Password reset successfully! Welcome back!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Back to Login Link */}
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        {step === 'email' ? (
          // Email Input Step
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                Forgot Password?
              </h1>
              <p className="text-zinc-400">
                Enter your email and we'll send you a verification code.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-5 h-5" />}
                error={emailErrors.email?.message}
                {...registerEmail('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <Button 
                type="submit" 
                loading={loading}
                fullWidth
                size="lg"
                icon={<Send className="w-5 h-5" />}
              >
                Send Verification Code
              </Button>
            </form>
          </>
        ) : step === 'password' ? (
          // New Password Step
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                Set New Password
              </h1>
              <p className="text-zinc-400">
                Choose a strong password for your account
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5" key={`password-form-${step}`}>
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                icon={<Lock className="w-5 h-5" />}
                error={passwordErrors.newPassword?.message}
                autoComplete="new-password"
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
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />

              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                icon={<Lock className="w-5 h-5" />}
                error={passwordErrors.confirmPassword?.message}
                autoComplete="new-password"
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

              <Button 
                type="submit" 
                loading={loading}
                fullWidth
                size="lg"
                icon={<Lock className="w-5 h-5" />}
              >
                Reset Password
              </Button>
            </form>
          </>
        ) : null}
      </Card>

      {/* OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        email={userEmail}
        loading={loading}
      />
    </div>
  );
};

export default ForgotPassword;
