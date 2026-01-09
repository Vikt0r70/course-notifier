import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Card, Button } from '../components/ui';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { loadUser, isAuthenticated } = useAuthStore();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(token);
        // Refresh user data if already logged in so profile shows updated status
        if (isAuthenticated) {
          await loadUser();
        }
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token, isAuthenticated, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md text-center p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-violet-500 animate-spin" />
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Verifying Email...</h1>
            <p className="text-zinc-400">Please wait while we verify your email address.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Email Verified!</h1>
            <p className="text-zinc-400 mb-6">{message}</p>
            <Button onClick={() => navigate(isAuthenticated ? '/profile' : '/login')} fullWidth>
              {isAuthenticated ? 'Go to Profile' : 'Continue to Login'}
            </Button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Verification Failed</h1>
            <p className="text-zinc-400 mb-6">{message}</p>
            <Link to="/login">
              <Button variant="secondary" fullWidth>
                Go to Login
              </Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
