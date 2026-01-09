import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { Button, Input, Card } from '../components/ui';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const [loading, setLoading] = useState(false);

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Reset Password
          </h1>
          <p className="text-zinc-400">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 8 characters"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match'
            })}
          />

          <Button 
            type="submit" 
            loading={loading}
            fullWidth
            size="lg"
            variant="success"
            icon={<KeyRound className="w-5 h-5" />}
          >
            Reset Password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
