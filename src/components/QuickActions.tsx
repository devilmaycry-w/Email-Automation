import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, RefreshCw, Settings, Download, Upload, Play, Loader2, CheckCircle, AlertCircle, TestTube, RotateCcw } from 'lucide-react';
import { type User, getGmailTokens, getCurrentUser, updateUserLastPollTimestamp } from '../lib/supabase';
import { processInbox } from '../lib/emailProcessor';
import { testGmailConnection } from '../lib/gmail';

interface QuickActionsProps {
  user: User | null;
  onUserUpdate?: (user: User) => void; // Optional callback to update user in parent component
}

const QuickActions: React.FC<QuickActionsProps> = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [actionResults, setActionResults] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

  const setLoading = (actionName: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [actionName]: loading }));
  };

  const setResult = (actionName: string, type: 'success' | 'error', message: string) => {
    setActionResults(prev => ({ ...prev, [actionName]: { type, message } }));
    // Clear result after 5 seconds
    setTimeout(() => {
      setActionResults(prev => {
        const newResults = { ...prev };
        delete newResults[actionName];
        return newResults;
      });
    }, 5000);
  };

  const handleTestConnection = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!user.gmail_connected) {
      setResult('Test Connection', 'error', 'Gmail account not connected. Please connect your Gmail first.');
      return;
    }

    setLoading('Test Connection', true);
    setResult('Test Connection', 'success', 'Testing Gmail API connection...');

    try {
      // Get Gmail tokens for the user
      const gmailTokens = await getGmailTokens(user.id);
      
      if (!gmailTokens || !gmailTokens.access_token) {
        throw new Error('Gmail access token not found. Please reconnect your Gmail account.');
      }

      // Test the connection
      const testResult = await testGmailConnection(gmailTokens.access_token);
      
      if (testResult.success) {
        setResult('Test Connection', 'success', 
          `Gmail connection successful! Total messages: ${testResult.totalMessages}, Recent: ${testResult.recentMessages}`);
      } else {
        setResult('Test Connection', 'error', `Connection test failed: ${testResult.error}`);
      }

    } catch (error: any) {
      console.error('[QuickActions] Error testing connection:', error);
      setResult('Test Connection', 'error', error.message || 'Failed to test connection. Please try again.');
    } finally {
      setLoading('Test Connection', false);
    }
  };

  const handleResetTimestamp = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading('Reset Timestamp', true);
    setResult('Reset Timestamp', 'success', 'Resetting last poll timestamp...');

    try {
      // Reset the timestamp to null (will look for all unread emails)
      await updateUserLastPollTimestamp(user.id, new Date(0).toISOString()); // Use epoch time to get all emails
      
      // Refresh user data
      const updatedUser = await getCurrentUser();
      if (updatedUser && onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      setResult('Reset Timestamp', 'success', 'Timestamp reset! Next automation run will check all unread emails.');

    } catch (error: any) {
      console.error('[QuickActions] Error resetting timestamp:', error);
      setResult('Reset Timestamp', 'error', error.message || 'Failed to reset timestamp. Please try again.');
    } finally {
      setLoading('Reset Timestamp', false);
    }
  };

  const handleRunAutomation = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!user.gmail_connected) {
      setResult('Run automation', 'error', 'Gmail account not connected. Please connect your Gmail first.');
      return;
    }

    setLoading('Run automation', true);
    setResult('Run automation', 'success', 'Starting email processing...');

    try {
      // Get Gmail tokens for the user
      const gmailTokens = await getGmailTokens(user.id);
      
      if (!gmailTokens || !gmailTokens.access_token) {
        throw new Error('Gmail access token not found. Please reconnect your Gmail account.');
      }

      // Check if token is expired
      if (gmailTokens.expires_at) {
        const expiryTime = new Date(gmailTokens.expires_at);
        const now = new Date();
        if (now >= expiryTime) {
          throw new Error('Gmail access token has expired. Please reconnect your Gmail account.');
        }
      }

      console.log('[QuickActions] Starting email processing for user:', user.id);
      console.log('[QuickActions] Using last poll timestamp:', user.last_poll_timestamp);
      
      // Process the inbox with the user's last poll timestamp
      const result = await processInbox(
        user.id, 
        gmailTokens.access_token, 
        user.last_poll_timestamp // Pass the stored timestamp
      );
      
      console.log('[QuickActions] Email processing completed:', result);
      
      // Refresh user data to get updated last_poll_timestamp
      try {
        const updatedUser = await getCurrentUser();
        if (updatedUser && onUserUpdate) {
          onUserUpdate(updatedUser);
        }
      } catch (refreshError) {
        console.warn('[QuickActions] Failed to refresh user data after processing:', refreshError);
        // Non-critical error, continue with result display
      }
      
      if (result.processedCount > 0) {
        setResult('Run automation', 'success', `Successfully processed ${result.processedCount} email(s)! Check the Analytics tab to see the results.`);
      } else {
        setResult('Run automation', 'success', 'No new emails found to process. Your inbox is up to date!');
      }

    } catch (error: any) {
      console.error('[QuickActions] Error running automation:', error);
      setResult('Run automation', 'error', error.message || 'Failed to run automation. Please try again.');
    } finally {
      setLoading('Run automation', false);
    }
  };

  const handleAction = (actionName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (actionName === 'Run automation') {
      handleRunAutomation();
      return;
    }

    if (actionName === 'Test Connection') {
      handleTestConnection();
      return;
    }

    if (actionName === 'Reset Timestamp') {
      handleResetTimestamp();
      return;
    }

    // Placeholder for other actions
    setResult(actionName, 'success', `${actionName} feature coming soon!`);
    console.log(`${actionName} action triggered`);
  };

  const actions = [
    {
      title: 'Test Connection',
      description: 'Test Gmail API access',
      icon: TestTube,
      color: 'from-blue-600 to-blue-400',
      action: () => handleAction('Test Connection')
    },
    {
      title: 'Reset Timestamp',
      description: 'Reset email polling time',
      icon: RotateCcw,
      color: 'from-purple-600 to-purple-400',
      action: () => handleAction('Reset Timestamp')
    },
    {
      title: 'Run Automation',
      description: 'Start email processing',
      icon: Play,
      color: 'from-gray-800 to-gray-500',
      action: () => handleAction('Run automation')
    },
    {
      title: 'Refresh Inbox',
      description: 'Sync latest emails',
      icon: RefreshCw,
      color: 'from-gray-700 to-gray-500',
      action: () => handleAction('Refresh inbox')
    },
    {
      title: 'Export Data',
      description: 'Download analytics report',
      icon: Download,
      color: 'from-gray-600 to-gray-400',
      action: () => handleAction('Export data')
    },
    {
      title: 'Advanced Settings',
      description: 'Configure AI parameters',
      icon: Settings,
      color: 'from-gray-700 to-gray-400',
      action: () => handleAction('Advanced settings')
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
    >
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        
        {/* Display last poll timestamp if available */}
        {user?.last_poll_timestamp && (
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Last email check:</span>{' '}
              {new Date(user.last_poll_timestamp).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Only emails received after this time will be processed. Use "Reset Timestamp" to check all unread emails.
            </p>
          </div>
        )}

        {!user?.last_poll_timestamp && user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-medium">First time setup:</span> No previous email check found. 
              The automation will process all unread emails in your inbox.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {actions.map((action, index) => {
            const isLoading = loadingStates[action.title];
            const result = actionResults[action.title];
            
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  disabled={isLoading}
                  className="w-full p-6 bg-white/80 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-14 h-14 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    ) : (
                      <action.icon className="w-7 h-7 text-white" />
                    )}
                  </motion.div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">{action.title}</h4>
                  <p className="text-xs text-gray-600 leading-tight">{action.description}</p>
                </motion.button>

                {/* Result notification */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-10 px-3 py-2 rounded-xl text-xs font-medium shadow-lg border max-w-xs ${
                      result.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      {result.type === 'success' ? (
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className="truncate">{result.message}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Global result messages for longer messages */}
        {Object.entries(actionResults).map(([actionName, result]) => (
          result.message.length > 50 && (
            <motion.div
              key={actionName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-4 rounded-2xl border ${
                result.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {result.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold mb-1">{actionName}</h4>
                  <p className="text-sm">{result.message}</p>
                </div>
              </div>
            </motion.div>
          )
        ))}

        {/* Debug information */}
        {user && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">Debug Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">User ID:</span> {user.id}</p>
              <p><span className="font-medium">Gmail Connected:</span> {user.gmail_connected ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Manual Override:</span> {user.manual_override_active ? 'Enabled' : 'Disabled'}</p>
              <p><span className="font-medium">Last Poll:</span> {user.last_poll_timestamp || 'Never'}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuickActions;