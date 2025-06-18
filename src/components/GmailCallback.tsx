import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { supabase, getCurrentUser, storeGmailTokens } from '../lib/supabase';
import { exchangeCodeForToken } from '../lib/gmail';

interface GmailCallbackProps {
  onSuccess?: () => void;
}

const GmailCallback: React.FC<GmailCallbackProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Gmail authorization...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract code and error from URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        console.log('Gmail callback processing:', { code: !!code, error });

        // Handle OAuth error
        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setMessage('Gmail authorization was cancelled or failed. Please try again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Check if code is present
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Gmail.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Check if user is authenticated with Supabase
        const user = await getCurrentUser();
        if (!user) {
          console.log('No authenticated user, redirecting to auth');
          // Store the code temporarily and redirect to auth
          sessionStorage.setItem('gmail_auth_code', code);
          navigate('/auth');
          return;
        }

        setMessage('Exchanging authorization code for tokens...');

        // Prepare Gmail OAuth configuration
        const config = {
          clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
          clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
          redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
        };

        // Validate configuration
        if (!config.clientId || !config.clientSecret || !config.redirectUri) {
          throw new Error('Gmail OAuth configuration is incomplete. Please check your environment variables.');
        }

        console.log('Using Gmail config:', {
          clientId: config.clientId ? 'Set' : 'Missing',
          clientSecret: config.clientSecret ? 'Set' : 'Missing',
          redirectUri: config.redirectUri
        });

        // Exchange code for tokens
        const tokens = await exchangeCodeForToken(code, config);
        
        if (!tokens) {
          throw new Error('Failed to exchange authorization code for tokens');
        }

        console.log('Tokens received successfully');
        setMessage('Storing Gmail tokens...');

        // Calculate expiration time
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Store tokens in Supabase
        await storeGmailTokens(user.id, {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope
        });

        console.log('Tokens stored successfully');
        setStatus('success');
        setMessage('Gmail connected successfully! Redirecting to dashboard...');

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('Error processing Gmail callback:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        // Redirect to home after error
        setTimeout(() => navigate('/'), 5000);
      }
    };

    processCallback();
  }, [searchParams, navigate, onSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-gray-200/30 to-gray-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 0.95, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-gray-300/20 to-gray-200/30 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 max-w-md w-full text-center relative z-10"
      >
        <div className="mb-8">
          {status === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full mx-auto mb-6"
            />
          )}
          
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200"
            >
              <AlertCircle className="w-8 h-8 text-red-600" />
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Mail className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900">Gmail Integration</h2>
          </div>
          
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-lg font-medium ${
              status === 'success' 
                ? 'text-green-700' 
                : status === 'error' 
                ? 'text-red-700' 
                : 'text-gray-700'
            }`}
          >
            {message}
          </motion.p>

          {status === 'processing' && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-gray-600"
            >
              Please wait while we set up your Gmail connection...
            </motion.div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 rounded-2xl p-4 border border-green-200 mt-6">
              <p className="text-sm text-green-700">
                Your Gmail account has been successfully connected to CodexCity. 
                You can now use AI-powered email automation features.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200 mt-6">
              <p className="text-sm text-red-700 mb-3">
                {message}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Return to Dashboard
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GmailCallback;