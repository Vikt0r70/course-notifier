import React, { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
  loading?: boolean;
}

const OtpModal: React.FC<OtpModalProps> = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  onResend, 
  email, 
  loading = false 
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(5);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode: string) => {
    try {
      setError('');
      await onVerify(otpCode);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    try {
      setError('');
      await onResend();
      setResendCooldown(60); // 60 seconds cooldown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.message || 'Failed to resend code. Please try again.');
      
      if (errorData?.data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(errorData.data.attemptsRemaining);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    handleVerify(otpCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="relative max-w-md w-full mx-4">
        {/* Glowing background effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
        
        {/* Main modal card */}
        <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent"></div>
            <div className="relative flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Verify Your Email
                </h2>
                <p className="text-zinc-400 text-sm mt-1">Enter the 6-digit code we sent</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800/50 rounded-lg"
                disabled={loading}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>
        
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            {/* Email display */}
            <div className="mb-6 p-3 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
              <p className="text-xs text-zinc-500 mb-1">Sent to:</p>
              <p className="text-cyan-400 font-semibold truncate">{email}</p>
            </div>
            
            {/* OTP Input boxes */}
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold bg-zinc-800/50 backdrop-blur-sm border-2 border-zinc-700/50 rounded-xl text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2 animate-fade-in">
                <span className="text-red-500 text-lg">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || otp.some(digit => digit === '')}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 mb-4 relative group overflow-hidden"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : 'Verify Email'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>

            {/* Resend section */}
            <div className="text-center space-y-2">
              <p className="text-zinc-500 text-sm">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="text-violet-400 hover:text-violet-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0 
                  ? `Resend in ${resendCooldown}s` 
                  : 'Resend Code'}
              </button>
              {attemptsRemaining < 5 && (
                <p className="text-amber-400 text-xs mt-2 flex items-center justify-center gap-1">
                  <span>⚠</span>
                  {attemptsRemaining} attempts remaining
                </p>
              )}
            </div>

            {/* Expiry notice */}
            <div className="mt-6 pt-4 border-t border-zinc-800/50">
              <p className="text-zinc-600 text-xs text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Code expires in 10 minutes
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
