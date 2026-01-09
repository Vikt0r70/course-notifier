import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Calendar, GraduationCap, Building2, BookOpen, Clock, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { useAuthStore } from '../store/authStore';
import { Button, Input, Card, Select } from '../components/ui';
import OtpModal from '../components/OtpModal';

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  age?: number; // Now optional
  studyType: string;
  faculty: string;
  major?: string; // Optional for graduate students
  timeShift?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setUserWithToken } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<any>({});
  const [majors, setMajors] = useState<any>({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpEmail, setOtpEmail] = useState<string>('');

  const studyType = watch('studyType');
  const selectedFaculty = watch('faculty');

  useEffect(() => {
    configService.getFaculties().then(setFaculties);
    configService.getMajors().then(setMajors);
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      // Normalize email to lowercase
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim()
      };
      const response = await authService.register(normalizedData);
      
      if (response.data?.requiresOtp) {
        // Show OTP modal
        setOtpUserId(response.data.userId);
        setOtpEmail(response.data.email);
        setShowOtpModal(true);
        
        if (response.data.emailSent === false) {
          toast.error('Could not send verification code. Please click "Resend Code" in the verification popup.');
        } else {
          toast.success('Verification code sent to your email!');
        }
      } else {
        // Fallback: if no OTP required, redirect to login
        toast.success('Account created successfully!');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
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
        toast.success('Email verified successfully! Welcome to Course Notifier!');
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

  const getFacultyOptions = () => {
    if (studyType === 'بكالوريوس') return faculties.bachelor || [];
    if (studyType === 'دراسات عليا') return faculties.graduate || [];
    return [];
  };

  const getMajorOptions = () => {
    if (!selectedFaculty) return [];
    return majors[selectedFaculty] || [];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-zinc-400">
            Join Course Notifier and never miss an open course again
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Row 1: Username & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              placeholder="johndoe"
              icon={<User className="w-5 h-5" />}
              error={errors.username?.message}
              {...register('username', { 
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters'
                }
              })}
            />

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
          </div>

          {/* Row 2: Password & Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
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

            <Input
              label="Age (Optional)"
              type="number"
              placeholder="18"
              icon={<Calendar className="w-5 h-5" />}
              error={errors.age?.message}
              {...register('age', { 
                min: {
                  value: 16,
                  message: 'You must be at least 16 years old'
                },
                max: {
                  value: 100,
                  message: 'Please enter a valid age'
                }
              })}
            />
          </div>

          {/* Study Type */}
          <Select
            label="Study Type"
            icon={<GraduationCap className="w-5 h-5" />}
            error={errors.studyType?.message}
            {...register('studyType', { required: 'Study type is required' })}
          >
            <option value="" className="bg-zinc-900">Select study type</option>
            <option value="بكالوريوس" className="bg-zinc-900">Bachelor's (بكالوريوس)</option>
            <option value="دراسات عليا" className="bg-zinc-900">Postgraduate (دراسات عليا)</option>
          </Select>

          {/* Faculty - shows when study type is selected */}
          {studyType && (
            <Select
              label="Faculty"
              icon={<Building2 className="w-5 h-5" />}
              error={errors.faculty?.message}
              {...register('faculty', { required: 'Faculty is required' })}
            >
              <option value="" className="bg-zinc-900">Select faculty</option>
              {getFacultyOptions().map((f: string) => (
                <option key={f} value={f} className="bg-zinc-900">{f}</option>
              ))}
            </Select>
          )}

          {/* Major - shows when faculty is selected (optional for graduate) */}
          {selectedFaculty && (
            <Select
              label={studyType === 'بكالوريوس' ? 'Major' : 'Major (Optional)'}
              icon={<BookOpen className="w-5 h-5" />}
              error={errors.major?.message}
              {...register('major', { 
                required: studyType === 'بكالوريوس' ? 'Major is required' : false 
              })}
            >
              <option value="" className="bg-zinc-900">Select major</option>
              {getMajorOptions().map((m: string) => (
                <option key={m} value={m} className="bg-zinc-900">{m}</option>
              ))}
            </Select>
          )}

          {/* Time Shift - only for bachelor's */}
          {studyType === 'بكالوريوس' && (
            <Select
              label="Time Shift (Optional)"
              icon={<Clock className="w-5 h-5" />}
              {...register('timeShift')}
            >
              <option value="" className="bg-zinc-900">All Times (Default)</option>
              <option value="صباحي" className="bg-zinc-900">Morning (صباحي)</option>
              <option value="مسائي" className="bg-zinc-900">Evening (مسائي)</option>
            </Select>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            loading={loading}
            fullWidth
            size="lg"
            icon={<UserPlus className="w-5 h-5" />}
          >
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-zinc-900/50 text-zinc-500">Already have an account?</span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full rounded-xl border-2 border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800/50 hover:border-zinc-600 transition-all duration-200"
          >
            Sign In Instead
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

export default Register;
