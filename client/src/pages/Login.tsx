import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card } from '../components/ui';
import OtpModal from '../components/OtpModal';
import { authService } from '../services/authService';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, setUserWithToken } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpEmail, setOtpEmail] = useState<string>('');

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      // Normalize email to lowercase
      const normalizedEmail = data.email.toLowerCase().trim();
      await login(normalizedEmail, data.password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      console.log('Error response:', error.response);
      console.log('Error data:', error.response?.data);
      
      // Check if OTP is required
      const errorData = error.response?.data;
      if (errorData?.requiresOtp) {
        setOtpUserId(errorData.data.userId);
        setOtpEmail(errorData.data.email);
        setShowOtpModal(true);
        toast.success('Verification code sent to your email!');
      } else {
        // Show error message
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Login failed. Please check your credentials and try again.';
        console.log('Showing toast with message:', errorMessage);
        toast.error(errorMessage, { 
          duration: 5000,
          position: 'top-center'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!otpUserId) return;
    
    try {
      setLoading(true);
      const response = await authService.verifyOtp(otpUserId, otp);
      
      if (response.success) {
        setUserWithToken(response.data.user, response.data.token);
        toast.success('Email verified successfully! Welcome back!');
        setShowOtpModal(false);
        navigate('/dashboard');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-zinc-400">
            Sign in to your Course Notifier account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock className="w-5 h-5" />}
              error={errors.password?.message}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <div className="flex justify-end mt-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            loading={loading}
            fullWidth
            size="lg"
            icon={<LogIn className="w-5 h-5" />}
          >
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-zinc-900/50 text-zinc-500">New to Course Notifier?</span>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full rounded-xl border-2 border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800/50 hover:border-zinc-600 transition-all duration-200"
          >
            Create an Account
          </Link>
        </div>
      </Card>

      {/* OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        email={otpEmail}
        loading={loading}
      />
    </div>
  );
};

export default Login;
