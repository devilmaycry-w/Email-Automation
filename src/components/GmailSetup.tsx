import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertTriangle, X, ExternalLink, Power, Shield, Info, Loader2 } from 'lucide-react';
import { initializeGmailAuth } from '../lib/gmail';
import { type User, deleteGmailTokens, getCurrentUser } from '../lib/supabase'; // Added deleteGmailTokens & getCurrentUser

interface GmailSetupProps {
  user: User | null;
  onClose: () => void;
  onConnectionChange?: () => void; // Optional callback to refresh user state in App.tsx
}

const GmailSetup: React.FC<GmailSetupProps> = ({ user, onClose, onConnectionChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for gmail_connected, to provide immediate feedback after connect/disconnect
  const [isConnected, setIsConnected] = useState(user?.gmail_connected || false);

  useEffect(() => {
    setIsConnected(user?.gmail_connected || false);
  }, [user?.gmail_connected]);


  const handleConnect = () => {
    if (!user) {
      setError('Please sign in first to connect your Gmail account.');
      return;
    }
    setError(null);
    setIsConnecting(true);
    
    const config = {
      clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
      clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!, // Not strictly needed for client-side init, but good practice
      redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
    };

    if (!config.clientId || !config.redirectUri) {
      setError('Gmail API credentials are not configured correctly in this application. Please contact support.');
      setIsConnecting(false);
      return;
    }

    try {
      const authUrl = initializeGmailAuth(config);
      window.location.href = authUrl;
      // The actual token exchange and storage will happen in App.tsx after callback
    } catch (err) {
      console.error('Error initiating Gmail auth:', err);
      setError('Failed to start Gmail connection process. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) {
      setError('User not found.');
      return;
    }
    setError(null);
    setIsDisconnecting(true);
    try {
      const { error: deleteError } = await deleteGmailTokens(user.id);
      if (deleteError) throw deleteError;

      setIsConnected(false); // Update local state immediately
      if (onConnectionChange) {
        onConnectionChange(); // Notify parent to refresh user state
      }
      // alert('Gmail disconnected successfully.'); // Optional: provide feedback
    } catch (err: any) {
      console.error('Error disconnecting Gmail:', err);
      setError(`Failed to disconnect Gmail: ${err.message || 'Please try again.'}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[90] p-4" // Increased z-index
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300/50"
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-200/80 sticky top-0 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Connect Your Gmail Account</h2>
            <p className="text-gray-600 mt-1">Enable AI-powered email automation.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200/70 transition-all duration-200"
            aria-label="Close setup"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {isConnected ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-md text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Gmail Account Connected!</h3>
                <p className="text-green-700 text-sm">
                  CodexCity is now connected to your Gmail account ({user?.email}).
                  You can now automate email responses and benefit from AI classification.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
              >
                {isDisconnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Power className="w-5 h-5" />
                )}
                <span>Disconnect Gmail</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-md">
                <div className="flex items-center space-x-3 mb-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-blue-800">How it Works</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Clicking "Connect Gmail" will redirect you to Google's secure sign-in page.
                  CodexCity uses OAuth 2.0, ensuring we never see or store your password.
                </p>

                <div className="mt-4 space-y-3">
                  <h4 className="text-md font-semibold text-blue-800">Permissions Requested:</h4>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 pl-1">
                    <li>
                      <strong>Read, compose, and send emails:</strong> Required to analyze incoming emails, draft replies using your templates, and send them on your behalf.
                    </li>
                     <li>
                      <strong>Manage basic mail settings:</strong> (Optional: if specific settings are needed, otherwise remove) Sometimes needed to organize or label processed emails.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-md">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-800">Your Privacy & Security</h3>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 pl-1">
                  <li>CodexCity only accesses your emails to perform the automated tasks you configure.</li>
                  <li>We are committed to protecting your data. Review our Privacy Policy for details.</li>
                  <li>
                    You can manage or revoke CodexCity's access to your Google Account at any time from your
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium ml-1"
                    >
                      Google Account settings <ExternalLink size={12} className="inline-block ml-0.5" />
                    </a>.
                  </li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
              >
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                <span>Connect Gmail Account</span>
              </motion.button>
            </motion.div>
          )}
        </div>
         <div className="p-4 text-center border-t border-gray-200/80 mt-4">
            <p className="text-xs text-gray-500">
              By connecting your Gmail, you agree to CodexCity's Terms of Service and Privacy Policy.
            </p>
          </div>
      </motion.div>
    </motion.div>
  );
};

export default GmailSetup;