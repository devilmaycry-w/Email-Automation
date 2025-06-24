import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import GmailSetup from './components/GmailSetup';
import Auth from './components/Auth';
import GmailCallback from './components/GmailCallback';
import Footer from './components/Footer';
import { supabase, getCurrentUser, storeGmailTokens, createDefaultTemplates, type User } from './lib/supabase';
import { exchangeCodeForToken } from './lib/gmail';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state management with comprehensive error handling
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let subscription: { unsubscribe: () => void };

    const handleAuthStateChange = async (event: string, session: { user: { id: string } } | null) => {
      if (!mounted) return;

      console.log('[App.tsx] Auth state change:', event, session?.user?.id);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[App.tsx] SIGNED_IN event detected for user ID:', session.user.id);
          
          const currentUser = await getCurrentUser();
          if (!currentUser) {
            console.error('[App.tsx] SIGNED_IN: getCurrentUser() returned null unexpectedly');
            throw new Error('Failed to get user after sign in');
          }

          setUser(currentUser);
          setError(null);

          try {
            await createDefaultTemplates(session.user.id);
          } catch (templateError) {
            console.error('[App.tsx] Error creating default templates:', templateError);
            // Non-fatal error, continue
          }

          const pendingCode = sessionStorage.getItem('gmail_auth_code');
          if (pendingCode) {
            try {
              sessionStorage.removeItem('gmail_auth_code');
              const config = {
                clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
                clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
                redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
              };

              const tokens = await exchangeCodeForToken(pendingCode, config);
              if (tokens) {
                const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
                await storeGmailTokens(session.user.id, {
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token,
                  expires_at: expiresAt,
                  scope: tokens.scope
                });

                const updatedUser = await getCurrentUser();
                setUser(updatedUser);
              }
            } catch (gmailError) {
              console.error('[App.tsx] Error processing Gmail auth:', gmailError);
              // Non-fatal error, continue
            }
          }

          if (location.pathname === '/auth') {
            navigate('/');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[App.tsx] SIGNED_OUT event detected');
          setUser(null);
          setError(null);
        }
      } catch (authError) {
        console.error('[App.tsx] Error during auth state change:', authError);
        if (mounted) {
          setError('Failed to process authentication state. Please refresh the page.');
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Loading timeout reached - forcing loading state to false');
        setError('Loading timed out. Please check your connection.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Initialize auth subscription
    subscription = supabase.auth.onAuthStateChange(handleAuthStateChange).data;

    // Check initial auth state with retry logic
    const checkUserWithRetry = async (attempt = 1): Promise<void> => {
      if (!mounted) return;

      try {
        console.log('[App.tsx] Checking user, attempt:', attempt);
        const currentUser = await getCurrentUser();
        
        if (!mounted) return;
        
        if (currentUser) {
          setUser(currentUser);
          setError(null);
        } else {
          // If no user but we have a session, there might be a race condition
          const { data: { session } } = await supabase.auth.getSession();
          if (session && attempt < 3) { // Retry up to 3 times
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            return checkUserWithRetry(attempt + 1);
          }
        }
      } catch (error) {
        console.error('[App.tsx] Error checking user:', error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          return checkUserWithRetry(attempt + 1);
        } else {
          setError('Failed to load user data. Please refresh the page.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    checkUserWithRetry();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [navigate, location.pathname]);

  // Handle successful Gmail connection
  const handleGmailConnectionChange = async () => {
    try {
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user after Gmail connection change:', error);
      setError('Failed to update Gmail connection status');
    }
  };

  // Reset error when location changes
  useEffect(() => {
    setError(null);
  }, [location.pathname]);

  console.log('[App.tsx] Rendering App component. Current state:', { loading, user, error });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center relative overflow-hidden">
        {/* Loading animation remains the same */}
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
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          <div className="relative mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-4 border-gray-800 border-t-transparent rounded-full mx-auto"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-24 h-24 border-4 border-gray-400/50 border-b-transparent rounded-full mx-auto"
            />
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-white/40 to-gray-100/30 rounded-full mx-auto backdrop-blur-sm" />
          </div>
          
          <motion.div
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading CodexCity...
            </motion.h2>
            <motion.p 
              className="text-gray-600 font-medium"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              Preparing your AI-powered email automation
            </motion.p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Background elements remain the same */}
      <div className="absolute inset-0 overflow-hidden">
        {/* ... existing background motion divs ... */}
      </div>

      <div className="relative z-10">
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto z-50">
            {error}
            <button 
              onClick={() => setError(null)}
              className="absolute top-1 right-1 text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </div>
        )}

        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/gmail/callback" element={<GmailCallback onSuccess={handleGmailConnectionChange} />} />
          <Route path="/*" element={
            <>
              <Header user={user} onShowSetup={() => setShowSetup(true)} />
              
              <main className="container mx-auto px-4 py-8">
                {showSetup ? (
                  <GmailSetup
                    user={user}
                    onClose={() => setShowSetup(false)}
                    onConnectionChange={handleGmailConnectionChange}
                  />
                ) : (
                  <Dashboard user={user} />
                )}
              </main>

              <Footer />
            </>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
