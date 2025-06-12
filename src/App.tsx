import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import GmailSetup from './components/GmailSetup';
import Auth from './components/Auth';
import Footer from './components/Footer';
import { supabase, getCurrentUser, storeGmailTokens, createDefaultTemplates, type User } from './lib/supabase';
import { exchangeCodeForToken } from './lib/gmail';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth callback
  useEffect(() => {
    const handleGmailCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && user) {
        console.log('Processing Gmail callback with code:', code);
        
        try {
          const config = {
            clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
            clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
            redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
          };

          const tokens = await exchangeCodeForToken(code, config);
          
          if (tokens) {
            const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
            
            await storeGmailTokens({
              user_id: user.id,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt,
              scope: tokens.scope
            });

            // Update user state to reflect Gmail connection
            const updatedUser = await getCurrentUser();
            setUser(updatedUser);
            
            // Clear URL parameters and navigate to dashboard
            window.history.replaceState({}, document.title, '/');
            navigate('/');
            
            // Close setup modal if open
            setShowSetup(false);
          }
        } catch (error) {
          console.error('Error handling Gmail callback:', error);
          // Clear URL parameters even on error
          window.history.replaceState({}, document.title, '/');
          navigate('/');
        }
      }
    };

    if (user && window.location.search.includes('code=')) {
      handleGmailCallback();
    }
  }, [user, navigate]);

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
          await createDefaultTemplates(session.user.id);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#CCCCFF] via-[#A3A3CC] to-[#5C5C99] flex items-center justify-center relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-[#292966]/20 to-[#5C5C99]/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -120, 0],
              y: [0, 80, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-[#A3A3CC]/20 to-[#CCCCFF]/20 rounded-full blur-3xl"
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
              className="w-24 h-24 border-4 border-[#292966] border-t-transparent rounded-full mx-auto"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-24 h-24 border-4 border-[#5C5C99]/50 border-b-transparent rounded-full mx-auto"
            />
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-[#CCCCFF]/20 to-[#A3A3CC]/20 rounded-full mx-auto backdrop-blur-sm" />
          </div>
          
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.h2 
              className="text-3xl font-bold text-white mb-4"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading CodexCity...
            </motion.h2>
            <motion.p 
              className="text-white/80 font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-[#CCCCFF] via-[#A3A3CC] to-[#5C5C99] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-[#292966]/10 to-[#5C5C99]/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
          className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-r from-[#A3A3CC]/15 to-[#CCCCFF]/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-[#5C5C99]/10 to-[#292966]/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        <Routes>
          <Route path="/auth" element={<Auth />} />
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