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
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state management
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[App.tsx] Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[App.tsx] SIGNED_IN event detected for user ID:', session.user.id);
        try {
          console.log('[App.tsx] SIGNED_IN: Before getCurrentUser().');
          const currentUser = await getCurrentUser();
          console.log('[App.tsx] SIGNED_IN: After getCurrentUser(). currentUser:', currentUser);

          if (!currentUser) {
            // This case might happen if getCurrentUser itself returns null despite authUser being present
            // (e.g. if the function had an internal unrecoverable issue not caught before the final return)
            console.error('[App.tsx] SIGNED_IN: getCurrentUser() returned null/undefined unexpectedly for an authenticated user. Setting user to null.');
            setUser(null);
            // Potentially navigate to an error page or show a global error message
            // For now, it will just lead to the "logged out" state view.
          } else {
            console.log('[App.tsx] SIGNED_IN: Before setUser().');
            setUser(currentUser);
            console.log('[App.tsx] SIGNED_IN: After setUser().');

            console.log('[App.tsx] SIGNED_IN: Before createDefaultTemplates().');
            try {
              await createDefaultTemplates(session.user.id);
              console.log('[App.tsx] SIGNED_IN: After createDefaultTemplates() (success).');
            } catch (templateError) {
              console.error('[App.tsx] SIGNED_IN: Error creating default templates:', templateError);
              console.log('[App.tsx] SIGNED_IN: After createDefaultTemplates() (error).');
              // Non-fatal, continue user session.
            }

            const pendingCode = sessionStorage.getItem('gmail_auth_code');
            if (pendingCode) {
              console.log('[App.tsx] SIGNED_IN: Pending Gmail auth code found:', pendingCode);
              sessionStorage.removeItem('gmail_auth_code');
              try {
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

                  console.log('[App.tsx] SIGNED_IN: Before getCurrentUser() after Gmail token storage.');
                  const updatedUserWithGmail = await getCurrentUser(); // Re-fetch user to get updated gmail_connected status
                  console.log('[App.tsx] SIGNED_IN: After getCurrentUser() after Gmail token storage. updatedUser:', updatedUserWithGmail);

                  if (updatedUserWithGmail) {
                    console.log('[App.tsx] SIGNED_IN: Before setUser() after Gmail token storage.');
                    setUser(updatedUserWithGmail);
                    console.log('[App.tsx] SIGNED_IN: After setUser() after Gmail token storage.');
                  } else {
                     console.error('[App.tsx] SIGNED_IN: Failed to get updated user after Gmail token storage. User might be partially set.');
                     // setUser(currentUser); // Fallback to user without updated Gmail status if re-fetch fails
                  }
                  alert('Gmail connected successfully!');
                }
                console.log('[App.tsx] SIGNED_IN: After processing pending Gmail auth code.');
              } catch (gmailError) {
                console.error('[App.tsx] SIGNED_IN: Error processing pending Gmail auth:', gmailError);
                console.log('[App.tsx] SIGNED_IN: After processing pending Gmail auth code (error).');
                // Non-fatal for login, user might need to retry Gmail connect.
              }
            }

            if (location.pathname === '/auth') {
              console.log('[App.tsx] SIGNED_IN: Before navigate("/") from /auth page.');
              navigate('/');
              console.log('[App.tsx] SIGNED_IN: After navigate("/") from /auth page.');
            }
          }
        } catch (error) {
          console.error('[App.tsx] SIGNED_IN: Critical error during user setup process:', error);
          setUser(null); // Reset user state if setup fails critically
          // Potentially navigate to an error page or show a global error message
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[App.tsx] SIGNED_OUT event detected.');
        console.log('[App.tsx] Before setUser(null) in SIGNED_OUT.');
        setUser(null);
        console.log('[App.tsx] After setUser(null) in SIGNED_OUT.');
      }

      console.log('[App.tsx] Before setLoading(false) at end of onAuthStateChange.');
      setLoading(false);
      console.log('[App.tsx] After setLoading(false) at end of onAuthStateChange.');
    });

    // Check initial auth state
    const checkUser = async () => {
      console.log('[App.tsx] checkUser: Starting initial user check.');
      try {
        console.log('[App.tsx] checkUser: Before getCurrentUser().');
        const currentUser = await getCurrentUser();
        console.log('[App.tsx] checkUser: After getCurrentUser(). currentUser:', currentUser);
        if (mounted) {
          console.log('[App.tsx] checkUser: Before setUser() (mounted).');
          setUser(currentUser);
          console.log('[App.tsx] checkUser: After setUser() (mounted).');
        }
      } catch (error) {
        console.error('[App.tsx] checkUser: Error checking user:', error);
      } finally {
        if (mounted) {
          console.log('[App.tsx] checkUser: Before setLoading(false) in finally block (mounted).');
          setLoading(false);
          console.log('[App.tsx] checkUser: After setLoading(false) in finally block (mounted).');
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Handle successful Gmail connection from callback or manual disconnect/reconnect
  const handleGmailConnectionChange = async () => {
    try {
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      // We don't necessarily want to close the setup modal on every connection change,
      // e.g., after a disconnect, the user might still be in the modal.
      // Let the modal manage its own closing via onClose prop.
      // setShowSetup(false);
    } catch (error) {
      console.error('Error updating user after Gmail connection change:', error);
    }
  };

  console.log('[App.tsx] Rendering App component. Current loading state:', loading, 'Current user state:', user);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center relative overflow-hidden">
        {/* Subtle background elements */}
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
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-300/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 0.95, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
          className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-r from-gray-300/15 to-gray-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-gray-400/10 to-gray-300/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
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