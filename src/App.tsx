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

      console.log('Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Create default templates for new users
        if (event === 'SIGNED_IN') {
          try {
            await createDefaultTemplates(session.user.id);
          } catch (error) {
            console.error('Error creating default templates:', error);
          }
        }
        
        // Check if there's a pending Gmail auth code
        const pendingCode = sessionStorage.getItem('gmail_auth_code');
        if (pendingCode) {
          sessionStorage.removeItem('gmail_auth_code');
          // Process the Gmail callback now that user is authenticated
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

              // Update user state
              const updatedUser = await getCurrentUser();
              setUser(updatedUser);
              
              alert('Gmail connected successfully!');
            }
          } catch (error) {
            console.error('Error processing pending Gmail auth:', error);
          }
        }
        
        // Redirect to dashboard if on auth page
        if (location.pathname === '/auth') {
          navigate('/');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Check initial auth state
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Handle successful Gmail connection from callback
  const handleGmailConnected = async () => {
    try {
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      setShowSetup(false);
    } catch (error) {
      console.error('Error updating user after Gmail connection:', error);
    }
  };

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
          <Route path="/auth/gmail/callback" element={<GmailCallback onSuccess={handleGmailConnected} />} />
          <Route path="/*" element={
            <>
              <Header user={user} onShowSetup={() => setShowSetup(true)} />
              
              <main className="container mx-auto px-4 py-8">
                {showSetup ? (
                  <GmailSetup user={user} onClose={() => setShowSetup(false)} />
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