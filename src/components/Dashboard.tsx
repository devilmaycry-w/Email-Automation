import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Brain, Settings, BarChart3, Clock, CheckCircle, Power, Loader2 } from 'lucide-react';
import TemplateManager from './TemplateManager';
import EmailAnalytics from './EmailAnalytics';
import QuickActions from './QuickActions';
import AppTour from './AppTour'; // Import the AppTour component
import { type User, updateUserManualOverride, getCurrentUser } from '../lib/supabase';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser }) => {
  console.log('[Dashboard.tsx] Component rendering started. initialUser:', initialUser);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<User | null>(initialUser);
  const [manualOverride, setManualOverride] = useState(false);
  const [loadingOverrideStatus, setLoadingOverrideStatus] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Dashboard.tsx] useEffect triggered. initialUser:', initialUser);
    setUser(initialUser);
    if (initialUser && initialUser.id) {
      console.log('[Dashboard.tsx] useEffect: initialUser exists, fetching fresh user data.');
      setLoadingOverrideStatus(true);
      // Fetch the latest user data to get manual_override_active
      // This is important if the initialUser prop might not be fully up-to-date
      // or to ensure we have the field if it was just added.
      const fetchUserData = async () => {
        try {
          console.log('[Dashboard.tsx] useEffect: Before getCurrentUser().');
          const freshUser = await getCurrentUser(); // getCurrentUser now fetches the 'users' table
          console.log('[Dashboard.tsx] useEffect: After getCurrentUser(). freshUser:', freshUser);
          if (freshUser) {
            setUser(freshUser); // Update the user state with the fresh data
            setManualOverride(freshUser.manual_override_active ?? false);
          }
        } catch (error) {
          console.error("[Dashboard.tsx] useEffect: Error fetching user data for override status:", error);
          // Keep initialUser's override status if fetch fails, or default
          if (initialUser?.manual_override_active !== undefined) {
            setManualOverride(initialUser.manual_override_active);
          } else {
            setManualOverride(false); // Default if not available
          }
        } finally {
          console.log('[Dashboard.tsx] useEffect: Before setLoadingOverrideStatus(false) in finally block.');
          setLoadingOverrideStatus(false);
          console.log('[Dashboard.tsx] useEffect: After setLoadingOverrideStatus(false) in finally block.');
        }
      };
      fetchUserData();
    } else {
      console.log('[Dashboard.tsx] useEffect: No initialUser or initialUser.id, skipping fetch.');
      setLoadingOverrideStatus(false);
      setManualOverride(false); // Default if no user
    }
  }, [initialUser]);

  const handleToggleManualOverride = async () => {
    if (!user) return;
    const newStatus = !manualOverride;
    setManualOverride(newStatus); // Optimistic update
    try {
      const updatedUser = await updateUserManualOverride(user.id, newStatus);
      if (updatedUser) {
        setUser(updatedUser); // Update user state with potentially new updated_at, etc.
        setManualOverride(updatedUser.manual_override_active ?? false);
      }
    } catch (error) {
      console.error('Failed to update manual override status:', error);
      setManualOverride(!newStatus); // Revert on error
    }
  };

  // Handle user updates from QuickActions
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const stats = [
    { label: 'Emails Processed', value: '1,247', icon: Mail, color: 'from-gray-800 to-gray-600', change: '+12%' },
    { label: 'AI Classifications', value: '98.5%', icon: Brain, color: 'from-gray-700 to-gray-500', change: '+2.1%' },
    { label: 'Response Rate', value: '94.2%', icon: CheckCircle, color: 'from-gray-600 to-gray-400', change: '+5.3%' },
    { label: 'Avg Response Time', value: '2.3s', icon: Clock, color: 'from-gray-500 to-gray-700', change: '-0.7s' },
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
    <div className="space-y-8 relative"> {/* Added relative for potential positioning contexts */}
      <AppTour /> {/* Add the AppTour component here */}
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
            className="mt-2 mb-6" // Adjusted margin for spacing
          >
            <p className="text-sm text-center text-gray-500 bg-gray-100/80 rounded-full py-2 px-4 inline-block border border-gray-200 shadow-sm">
              Free plan: ~100-150 emails/day per user
            </p>
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

      {/* Stats Grid */}
      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:bg-white">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-sm text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full border border-green-200">{stat.change}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-200/20 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <QuickActions user={user} onUserUpdate={handleUserUpdate} />

      {/* Manual Override Toggle Section */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl p-8"
        >
          <div className="flex items-center justify-between">
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
          <p className="text-sm text-gray-500 mt-3">
            When enabled, you can manually review and send emails. When disabled, the system will send automated responses based on your templates.
          </p>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
      >
        <div className="flex border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gray-800/10 to-gray-600/10 text-gray-900 border-b-2 border-gray-800 shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">System Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-br from-gray-800/10 to-gray-600/10 rounded-2xl p-8 shadow-lg border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-6 text-xl">AI Classification Status</h4>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200"
                    >
                      <span className="text-gray-800 font-medium">Order Inquiries</span>
                      <span className="font-bold text-gray-700 text-lg">342</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200"
                    >
                      <span className="text-gray-800 font-medium">Support Requests</span>
                      <span className="font-bold text-gray-600 text-lg">189</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200"
                    >
                      <span className="text-gray-800 font-medium">General Emails</span>
                      <span className="font-bold text-gray-500 text-lg">716</span>
                    </motion.div>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-br from-gray-600/10 to-gray-400/10 rounded-2xl p-8 shadow-lg border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-6 text-xl">Recent Activity</h4>
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
                      <span className="text-gray-800">Order inquiry auto-responded</span>
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
                      <span className="text-gray-800">Support ticket classified</span>
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
                      <span className="text-gray-800">Template updated</span>
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