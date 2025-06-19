import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, RefreshCw, Settings, Download, Upload, Play } from 'lucide-react';
import { type User } from '../lib/supabase';

interface QuickActionsProps {
  user: User | null;
}

const QuickActions: React.FC<QuickActionsProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleAction = (actionName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    console.log(`${actionName} action triggered`);
  };

  const actions = [
    {
      title: 'Test Classification',
      description: 'Test AI with sample emails',
      icon: Zap,
      color: 'from-gray-800 to-gray-600',
      action: () => handleAction('Test classification')
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
      title: 'Import Templates',
      description: 'Upload template files',
      icon: Upload,
      color: 'from-gray-500 to-gray-700',
      action: () => handleAction('Import templates')
    },
    {
      title: 'Run Automation',
      description: 'Start email processing',
      icon: Play,
      color: 'from-gray-800 to-gray-500',
      action: () => handleAction('Run automation')
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {actions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="p-6 bg-white/80 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 group hover:bg-white"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-14 h-14 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}
              >
                <action.icon className="w-7 h-7 text-white" />
              </motion.div>
              <h4 className="font-semibold text-gray-900 text-sm mb-2">{action.title}</h4>
              <p className="text-xs text-gray-600 leading-tight">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default QuickActions;