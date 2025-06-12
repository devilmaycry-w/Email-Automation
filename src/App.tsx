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

  // Handle OAuth callback - separate effect
  useEffect(() => {
    const handleGmailCallback = async (code: string) => {
      if (!user) return;

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
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Close setup modal if open
          setShowSetup(false);
        }
      } catch (error) {
        console.error('Error handling Gmail callback:', error);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && user) {
      handleGmailCallback(code);
    }
  }, [user]); // This effect depends on user

  // Auth state management - separate effect
  useEffect(() => {
    let mounted = true;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-accent-300 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <motion.p 
            className="text-gray-600 font-medium text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading CodexCity...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
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
  );
}

export default App;