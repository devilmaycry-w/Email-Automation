import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Brain, Settings, BarChart3, Clock, CheckCircle, Power, Loader2, TrendingUp, Users, RefreshCw, Sparkles } from 'lucide-react';
import TemplateManager from './TemplateManager';
import EmailAnalytics from './EmailAnalytics';
import QuickActions from './QuickActions';
import AppTour from './AppTour';
import GmailTestButton from './GmailTestButton';
import { type User, updateUserManualOverride, getCurrentUser, getEmailStats } from '../lib/supabase';

interface DashboardProps {
  user: User | null;
}

interface EmailStats {
  totalProcessed: number;
  totalSent: number;
  todayProcessed: number;
  todaySent: number;
  categoryBreakdown: Record<string, number>;
}

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<User | null>(initialUser);
  const [manualOverride, setManualOverride] = useState(false);
  const [loadingOverrideStatus, setLoadingOverrideStatus] = useState(true);
  const [emailStats, setEmailStats] = useState<EmailStats>({
    totalProcessed: 0,
    totalSent: 0,
    todayProcessed: 0,
    todaySent: 0,
    categoryBreakdown: {}
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(initialUser);
    if (initialUser && initialUser.id) {
      setLoadingOverrideStatus(true);
      setLoadingStats(true);
      
      const fetchUserData = async () => {
        try {
          const freshUser = await getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
            setManualOverride(freshUser.manual_override_active ?? false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          if (initialUser?.manual_override_active !== undefined) {
            setManualOverride(initialUser.manual_override_active);
          } else {
            setManualOverride(false);
          }
        } finally {
          setLoadingOverrideStatus(false);
        }
      };

      const fetchEmailStats = async () => {
        try {
          const stats = await getEmailStats(initialUser.id);
          setEmailStats(stats);
        } catch (error) {
          console.error('Error fetching email stats:', error);
        } finally {
          setLoadingStats(false);
        }
      };

      fetchUserData();
      fetchEmailStats();
    } else {
      setLoadingOverrideStatus(false);
      setLoadingStats(false);
      setManualOverride(false);
    }
  }, [initialUser]);

  const handleToggleManualOverride = async () => {
    if (!user) return;
    const newStatus = !manualOverride;
    setManualOverride(newStatus);
    try {
      const updatedUser = await updateUserManualOverride(user.id, newStatus);
      if (updatedUser) {
        setUser(updatedUser);
        setManualOverride(updatedUser.manual_override_active ?? false);
      }
    } catch (error) {
      console.error('Failed to update manual override status:', error);
      setManualOverride(!newStatus);
    }
  };

  const refreshStats = async () => {
    if (!user?.id) return;
    try {
      setLoadingStats(true);
      const stats = await getEmailStats(user.id);
      setEmailStats(stats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const stats = [
    { 
      label: 'Total Processed', 
      value: loadingStats ? '...' : emailStats.totalProcessed.toString(), 
      icon: Mail, 
      color: 'from-blue-600 via-blue-500 to-purple-600', 
      change: loadingStats ? '' : `+${emailStats.todayProcessed} today`,
      bgGlow: 'shadow-blue-500/20'
    },
    { 
      label: 'Responses Sent', 
      value: loadingStats ? '...' : emailStats.totalSent.toString(), 
      icon: CheckCircle, 
      color: 'from-green-600 via-emerald-500 to-teal-600', 
      change: loadingStats ? '' : `+${emailStats.todaySent} today`,
      bgGlow: 'shadow-green-500/20'
    },
    { 
      label: 'Success Rate', 
      value: loadingStats ? '...' : emailStats.totalProcessed > 0 ? `${Math.round((emailStats.totalSent / emailStats.totalProcessed) * 100)}%` : '0%', 
      icon: TrendingUp, 
      color: 'from-purple-600 via-pink-500 to-rose-600', 
      change: loadingStats ? '' : 'Automated responses',
      bgGlow: 'shadow-purple-500/20'
    },
    { 
      label: 'AI Categories', 
      value: loadingStats ? '...' : Object.keys(emailStats.categoryBreakdown).length.toString(), 
      icon: Brain, 
      color: 'from-orange-600 via-amber-500 to-yellow-600', 
      change: loadingStats ? '' : 'Classifications',
      bgGlow: 'shadow-orange-500/20'
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
  };

  return (
    <div className="space-y-8 relative min-h-screen">
      <AppTour />
      
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <motion.h2 
          className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          Welcome to CodexCity
        </motion.h2>
        <motion.p 
          className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Transform your email management with AI-powered automation. 
          Classify, respond, and engage with your customers effortlessly.
        </motion.p>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 mb-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 30px rgba(59, 130, 246, 0.5)",
                  "0 0 20px rgba(59, 130, 246, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] rounded-full"
            >
              <div className="bg-white rounded-full px-6 py-3">
                <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Free plan: ~100-150 emails/day per user</span>
                </p>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshStats}
              disabled={loadingStats}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {loadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Refresh Stats</span>
            </motion.button>
          </motion.div>
        )}
        
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <span>Get Started Free</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-gray-300 rounded-full"
              />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Premium Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative overflow-hidden group"
          >
            <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl ${stat.bgGlow} transition-all duration-300 group-hover:bg-white`}>
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
                {stat.change && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                    {stat.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-gray-600 font-medium text-sm">{stat.label}</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-200/20 to-transparent rounded-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <QuickActions user={user} onStatsUpdate={refreshStats} />

      {/* Manual Override Toggle Section & Test Button */}
      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl p-8 h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Manual Override</h4>
                <p className="text-gray-600 mt-1">
                  {manualOverride
                    ? 'Automated responses are currently DISABLED.'
                    : 'Automated responses are currently ENABLED.'}
                </p>
              </div>
              {loadingOverrideStatus ? (
                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              ) : (
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors duration-300 ${
                    manualOverride ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  onClick={handleToggleManualOverride}
                >
                  <span className="sr-only">Toggle Manual Override</span>
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                      manualOverride ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </motion.div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              When enabled, you can manually review and send emails. When disabled, the system will send automated responses based on your templates.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <GmailTestButton user={user} className="h-full" />
          </motion.div>
        </div>
      )}

      {/* Tab Navigation - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-4 sm:px-6 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gray-800/10 to-gray-600/10 text-gray-900 border-b-2 border-gray-800 shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium text-sm sm:text-base">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="p-4 sm:p-8">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">System Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-br from-gray-800/10 to-gray-600/10 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-6 text-lg sm:text-xl">AI Classification Status</h4>
                  <div className="space-y-4">
                    {Object.entries(emailStats.categoryBreakdown).map(([category, count]) => (
                      <motion.div
                        key={category}
                        whileHover={{ x: 5 }}
                        className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200"
                      >
                        <span className="text-gray-800 font-medium capitalize text-sm sm:text-base">{category} Emails</span>
                        <span className="font-bold text-gray-700 text-lg">{count}</span>
                      </motion.div>
                    ))}
                    {Object.keys(emailStats.categoryBreakdown).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No emails processed yet
                      </div>
                    )}
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-br from-gray-600/10 to-gray-400/10 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-6 text-lg sm:text-xl">Recent Activity</h4>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-gray-200"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-green-500 rounded-full shadow-sm"
                      />
                      <span className="text-gray-800 text-sm sm:text-base">
                        {emailStats.todayProcessed} emails processed today
                      </span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-gray-200"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"
                      />
                      <span className="text-gray-800 text-sm sm:text-base">
                        {emailStats.todaySent} responses sent today
                      </span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-gray-200"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"
                      />
                      <span className="text-gray-800 text-sm sm:text-base">
                        System running smoothly
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && <TemplateManager user={user} />}
          {activeTab === 'analytics' && <EmailAnalytics user={user} />}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;