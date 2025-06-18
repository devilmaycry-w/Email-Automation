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
    console.log('🚀 App useEffect mounted. Initial loading state:', loading);
    console.log('📍 Current location:', location.pathname);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        console.log('⚠️ Component unmounted, skipping auth state change');
        return;
      }

      console.log('🔐 Auth state change event:', event, 'User ID:', session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Auth state: SIGNED_IN. Attempting to get current user...');
        
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          console.log('👤 User state updated after SIGNED_IN:', currentUser ? {
            id: currentUser.id,
            email: currentUser.email,
            gmail_connected: currentUser.gmail_connected,
            manual_override_active: currentUser.manual_override_active
          } : 'No user returned');
          
          // Create default templates for new users
          if (event === 'SIGNED_IN') {
            console.log('📧 Creating/checking default templates...');
            try {
              await createDefaultTemplates(session.user.id);
              console.log('✅ Default templates creation/check completed.');
            } catch (error) {
              console.error('❌ Error creating default templates:', error);
            }
          }
          
          // Check if there's a pending Gmail auth code
          const pendingCode = sessionStorage.getItem('gmail_auth_code');
          if (pendingCode) {
            console.log('📬 Pending Gmail auth code found. Starting Gmail token exchange...');
            sessionStorage.removeItem('gmail_auth_code');
            
            try {
              const config = {
                clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
                clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
                redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
              };

              // Add a check for missing config values here for better debugging
              console.log('🔧 Gmail OAuth config check:', {
                clientId: !!config.clientId,
                clientSecret: !!config.clientSecret,
                redirectUri: !!config.redirectUri,
                redirectUriValue: config.redirectUri
              });

              if (!config.clientId || !config.clientSecret || !config.redirectUri) {
                console.error('❌ Gmail OAuth config missing:', {
                  clientId: !!config.clientId,
                  clientSecret: !!config.clientSecret,
                  redirectUri: !!config.redirectUri
                });
                throw new Error('Gmail OAuth configuration is incomplete. Please check your environment variables.');
              }

              console.log('🔄 Exchanging Gmail auth code for tokens...');
              const tokens = await exchangeCodeForToken(pendingCode, config);
              console.log('🎫 Gmail token exchange result:', tokens ? 'Success' : 'Failure');
              
              if (tokens) {
                const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
                
                console.log('💾 Storing Gmail tokens in Supabase...');
                await storeGmailTokens(session.user.id, {
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token,
                  expires_at: expiresAt,
                  scope: tokens.scope
                });
                console.log('✅ Gmail tokens stored. Updating user state...');

                const updatedUser = await getCurrentUser();
                setUser(updatedUser);
                console.log('🔄 User state updated with Gmail connection status:', updatedUser?.gmail_connected);
                
                alert('Gmail connected successfully!');
              }
            } catch (error) {
              console.error('❌ Error processing pending Gmail auth:', error);
            } finally {
              console.log('🏁 Finished pending Gmail auth processing block.');
            }
          }
          
          // Redirect to dashboard if on auth page
          if (location.pathname === '/auth') {
            console.log('🔀 Redirecting from /auth to / (after SIGNED_IN).');
            navigate('/');
          }
        } catch (error) {
          console.error('❌ Error in SIGNED_IN handler:', error);
        }
        
        console.log('⏰ Setting loading to false after SIGNED_IN event.');
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Auth state: SIGNED_OUT. Setting user to null and loading to false.');
        setUser(null);
        setLoading(false);
      } else {
        console.log('🔄 Auth state: Other event (' + event + '). Ensuring loading is false.');
        setLoading(false);
      }
    });

    // Check initial auth state
    const checkUser = async () => {
      try {
        console.log('🔍 Initial checkUser function called.');
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          console.log('👤 Initial user set by checkUser:', currentUser ? {
            id: currentUser.id,
            email: currentUser.email,
            gmail_connected: currentUser.gmail_connected,
            manual_override_active: currentUser.manual_override_active
          } : 'No user');
        }
      } catch (error) {
        console.error('❌ Error in initial checkUser:', error);
      } finally {
        if (mounted) {
          console.log('🏁 Initial checkUser finished. Setting loading to false.');
          setLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      console.log('🧹 App useEffect cleanup. Unsubscribing from auth state changes.');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Handle successful Gmail connection from callback or manual disconnect/reconnect
  const handleGmailConnectionChange = async () => {
    try {
      console.log('🔄 Gmail connection change handler called');
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      console.log('✅ User state updated after Gmail connection change:', updatedUser?.gmail_connected);
    } catch (error) {
      console.error('❌ Error updating user after Gmail connection change:', error);
    }
  };

  console.log('🎨 App render - Loading state:', loading, 'User:', user ? 'Present' : 'None');

  if (loading) {
    console.log('⏳ Rendering loading screen');
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

  console.log('🏠 Rendering main application');

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