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
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state management
  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout;

    // Set a 12s timeout for loading
    timeout = setTimeout(() => {
      if (loading) {
        setLoadError(
          "Loading took too long. This may be a network, Supabase, or session problem. Try reloading, or if it persists, log out and log in again."
        );
        setLoading(false);
      }
    }, 12000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const currentUser = await getCurrentUser();
          if (!currentUser) {
            setUser(null);
            setLoadError("Could not load your user profile. Please try logging in again.");
          } else {
            setUser(currentUser);
            try {
              await createDefaultTemplates(session.user.id);
            } catch {}
            const pendingCode = sessionStorage.getItem('gmail_auth_code');
            if (pendingCode) {
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
                  try {
                    await storeGmailTokens(session.user.id, {
                      access_token: tokens.access_token,
                      refresh_token: tokens.refresh_token,
                      expires_at: expiresAt,
                      scope: tokens.scope
                    });
                    const updatedUser = await getCurrentUser();
                    setUser(updatedUser);
                    alert('Gmail connected successfully!');
                  } catch (storageError) {
                    alert('Gmail connected, but there was an issue saving your connection details. Please try reconnecting or contact support.');
                    const userAfterStorageFailure = await getCurrentUser();
                    setUser(userAfterStorageFailure);
                  }
                }
              } catch (exchangeError) {
                setLoadError("There was a problem connecting to Gmail. Please try again.");
              }
            }
            if (location.pathname === '/auth') {
              navigate('/');
            }
          }
        } catch (error) {
          setUser(null);
          setLoadError("There was a critical error loading your session. Please log in again.");
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
          if (!currentUser) {
            setLoadError("Session expired or user not found. Please log in again.");
          }
        }
      } catch (error) {
        setLoadError("Could not connect to the server. Please check your network or try again later.");
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
      clearTimeout(timeout);
    };
    // eslint-disable-next-line
  }, [navigate, location.pathname]);

  // Handle successful Gmail connection from callback or manual disconnect/reconnect
  const handleGmailConnectionChange = async () => {
    try {
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      setLoadError("Error updating user after Gmail connection change. Please reload the page.");
    }
  };

  // Loading/error screen
  if (loading || loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.05, 1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-gray-200/30 to-gray-300/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -40, 0], y: [0, 40, 0], scale: [1, 0.95, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
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
            {loadError && (
              <div className="mt-8 text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl">
                <div className="mb-2 font-semibold">Error:</div>
                <div className="mb-4">{loadError}</div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900 transition"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Normal app
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.05, 1], }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-300/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 0.95, 1], }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-r from-gray-300/15 to-gray-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1], }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
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
