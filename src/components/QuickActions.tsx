import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, RefreshCw, Settings, Download, Upload, Play, Loader2 } from 'lucide-react';
import { type User } from '../lib/supabase';
import { processInbox } from '../lib/emailProcessor';

interface QuickActionsProps {
  user: User | null;
  onStatsUpdate?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ user, onStatsUpdate }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<string | null>(null);

  const handleAction = (actionName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    console.log(`${actionName} action triggered`);
  };

  const handleRunAutomation = async () => {
    if (!user || !user.id) {
      console.log('[QuickActions] User not available for Run Automation');
      setProcessingResult('User not logged in. Please log in.');
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
      const result = await processInbox(user.id);

      console.log('[QuickActions] processInbox result:', result);
      if (result.error) {
        setProcessingResult(`Error: ${result.error}`);
      } else {
        setProcessingResult(
          `Processing complete! ${result.processedCount} emails processed. ${
            result.processedCount > 0 ? 'Check your analytics for details.' : 'No new emails found.'
          }`
        );
        
        // Refresh stats if callback provided
        if (onStatsUpdate) {
          setTimeout(() => {
            onStatsUpdate();
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('[QuickActions] Error calling processInbox:', error);
      setProcessingResult(`Failed to run automation: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
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
      icon: isProcessing ? Loader2 : Play,
      color: 'from-gray-800 to-gray-500',
      action: handleRunAutomation,
      disabled: isProcessing,
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
          className={`mt-4 p-4 rounded-lg text-sm text-center shadow-md ${
            processingResult.includes('Error') || processingResult.includes('Failed')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : processingResult.includes('complete')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}
        >
          {processingResult}
        </motion.div>
      )}
    </>
  );
};

export default QuickActions;