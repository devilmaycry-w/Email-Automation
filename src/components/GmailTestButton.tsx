import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { getValidAccessToken, type User } from '../lib/supabase'; // Assuming User type is exported from supabase
// testGmailProfileApi will be dynamically imported

interface GmailTestButtonProps {
  user: User | null;
  className?: string; // Allow passing custom classes
}

const GmailTestButton: React.FC<GmailTestButtonProps> = ({ user, className }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const handleTestConnection = async () => {
    if (!user?.id) {
      setTestResult("User not logged in.");
      setTestSuccess(false);
      return;
    }
    setTesting(true);
    setTestResult("Testing connection...");
    setTestSuccess(null);

    try {
      const gmailConfig = {
        clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
        // clientSecret is needed by refreshAccessToken, which getValidAccessToken might call.
        clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
        redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!,
      };
      console.log('[GmailTestButton] Calling getValidAccessToken for user:', user.id);
      const accessToken = await getValidAccessToken(user.id, gmailConfig);

      if (accessToken) {
        console.log('[GmailTestButton] Obtained access token. Attempting to call testGmailProfileApi.');
        // Dynamically import testGmailProfileApi from ../lib/gmail
        const { testGmailProfileApi } = await import('../lib/gmail');
        const profile = await testGmailProfileApi(accessToken);
        console.log('[GmailTestButton] Gmail profile fetched successfully:', profile);
        setTestResult(`Connection successful! Fetched profile for ${profile.emailAddress}.`);
        setTestSuccess(true);
      } else {
        console.error('[GmailTestButton] Failed to obtain valid access token from getValidAccessToken.');
        setTestResult("Failed to get Gmail access token. Please ensure Gmail is connected (try reconnecting in Gmail Setup).");
        setTestSuccess(false);
      }
    } catch (error: any) {
      console.error('[GmailTestButton] Error during test connection:', error);
      setTestResult(`Error: ${error.message || 'An unknown error occurred.'}`);
      setTestSuccess(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={`my-4 p-4 border border-gray-200 rounded-xl bg-white/80 shadow-lg ${className}`}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleTestConnection}
        disabled={testing || !user || !user.gmail_connected}
        className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mail className="w-5 h-5" />
        )}
        <span>{testing ? 'Testing...' : 'Test Gmail Connection'}</span>
      </motion.button>
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`mt-3 p-3 rounded-md text-sm flex items-start space-x-2
            ${testSuccess === true ? 'bg-green-50 border border-green-200 text-green-700'
            : testSuccess === false ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'}`} // For "Testing..." state
        >
          {testSuccess === true ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
           : testSuccess === false ? <AlertTriangle className="w-5 h-5 flex-shrink-0" />
           : <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />}
          <p>{testResult}</p>
        </motion.div>
      )}
    </div>
  );
};

export default GmailTestButton;
