import React, { useState } from 'react'; // Added useState
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, RefreshCw, Settings, Download, Upload, Play, Loader2 } from 'lucide-react'; // Added Loader2
import { type User } from '../lib/supabase';
import { processInbox } from '../lib/emailProcessor'; // Import processInbox

interface QuickActionsProps {
  user: User | null;
}

const QuickActions: React.FC<QuickActionsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<string | null>(null);

  const handleAction = (actionName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    console.log(`${actionName} action triggered`);
    // This generic handler might not be suitable for async actions like Run Automation anymore
    // Or it needs to be adapted. For now, specific actions will have their own handlers.
  };

  const actions = [
    {
      title: 'Test Classification',
      description: 'Test AI with sample emails',
      icon: Zap,
      color: 'from-gray-800 to-gray-600',
      action: () => handleAction('Test classification'),
      disabled: isProcessing,
    },
    {
      title: 'Refresh Inbox',
      description: 'Sync latest emails',
      icon: RefreshCw,
      color: 'from-gray-700 to-gray-500',
      action: () => handleAction('Refresh inbox'),
      disabled: isProcessing,
    },
    {
      title: 'Export Data',
      description: 'Download analytics report',
      icon: Download,
      color: 'from-gray-600 to-gray-400',
      action: () => handleAction('Export data'),
      disabled: isProcessing,
    },
    {
      title: 'Import Templates',
      description: 'Upload template files',
      icon: Upload,
      color: 'from-gray-500 to-gray-700',
      action: () => handleAction('Import templates'),
      disabled: isProcessing,
    },
    {
      title: 'Run Automation',
      description: 'Start email processing',
      icon: isProcessing ? Loader2 : Play, // Dynamic icon
      color: 'from-gray-800 to-gray-500',
      action: async () => {
        if (!user || !user.id) {
          console.log('[QuickActions] User not available for Run Automation');
          setProcessingResult('User not logged in. Please log in.');
          // navigate('/auth'); // Optional: redirect, or let user see message
          return;
        }
        if (!user.gmail_connected) {
            console.log('[QuickActions] Gmail not connected for user:', user.id);
            setProcessingResult('Gmail is not connected. Please connect Gmail in settings.');
            return;
        }

        console.log('[QuickActions] Run automation action triggered for user:', user.id);
        setIsProcessing(true);
        setProcessingResult('Processing started... This may take a moment.');

        try {
          // Assuming 'user' object might eventually have 'last_poll_timestamp'
          // For now, it's not on the User interface from supabase.ts, so it will be undefined.
          const lastPollTimestamp = (user as any).last_poll_timestamp || undefined;
          console.log(`[QuickActions] Calling processInbox for user ${user.id}. Last poll timestamp: ${lastPollTimestamp}`);

          const result = await processInbox(user.id, lastPollTimestamp);

          console.log('[QuickActions] processInbox result:', result);
          if (result.error) {
            setProcessingResult(`Error: ${result.error}`);
          } else {
            setProcessingResult(`Processing complete. ${result.processedCount} emails processed. New poll time would be: ${result.newLastPollTimestamp}`);
          }
          // TODO: Implement updateUserLastPollTimestamp(user.id, result.newLastPollTimestamp) here
          // This would require adding last_poll_timestamp to the User interface and a new Supabase function.
        } catch (error: any) {
          console.error('[QuickActions] Error calling processInbox:', error);
          setProcessingResult(`Failed to run automation: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      },
      disabled: isProcessing, // Disable button while processing
    },
    {
      title: 'Advanced Settings',
      description: 'Configure AI parameters',
      icon: Settings,
      color: 'from-gray-700 to-gray-400',
      action: () => handleAction('Advanced settings'),
      disabled: isProcessing,
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {actions.map((actionItem, index) => (
              <motion.button
                key={actionItem.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: actionItem.disabled ? 1 : 1.05, y: actionItem.disabled ? 0 : -3 }}
                whileTap={{ scale: actionItem.disabled ? 1 : 0.95 }}
                onClick={actionItem.action}
                disabled={actionItem.disabled}
                className="p-6 bg-white/80 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.div
                  whileHover={{ scale: actionItem.disabled ? 1 : 1.1, rotate: actionItem.disabled ? 0 : 5 }}
                  className={`w-14 h-14 bg-gradient-to-r ${actionItem.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 ${actionItem.icon === Loader2 ? 'animate-spin' : ''}`}
                >
                  <actionItem.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h4 className="font-semibold text-gray-900 text-sm mb-2">{actionItem.title}</h4>
                <p className="text-xs text-gray-600 leading-tight">{actionItem.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
      {processingResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 text-center shadow"
        >
          {processingResult}
        </motion.div>
      )}
    </>
  );
};

export default QuickActions;