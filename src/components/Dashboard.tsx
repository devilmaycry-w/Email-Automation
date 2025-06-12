import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Brain, Settings, BarChart3, Clock, CheckCircle } from 'lucide-react';
import TemplateManager from './TemplateManager';
import EmailAnalytics from './EmailAnalytics';
import QuickActions from './QuickActions';
import { type User } from '../lib/supabase';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const stats = [
    { label: 'Emails Processed', value: '1,247', icon: Mail, color: 'from-blue-500 to-blue-600', change: '+12%' },
    { label: 'AI Classifications', value: '98.5%', icon: Brain, color: 'from-purple-500 to-purple-600', change: '+2.1%' },
    { label: 'Response Rate', value: '94.2%', icon: CheckCircle, color: 'from-green-500 to-green-600', change: '+5.3%' },
    { label: 'Avg Response Time', value: '2.3s', icon: Clock, color: 'from-orange-500 to-orange-600', change: '-0.7s' },
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <motion.h2 
          className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent"
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
        
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <span>Get Started Free</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </motion.button>
          </motion.div>
        )}
      </motion.div>

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
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:bg-white/90">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-100/30 to-transparent rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <QuickActions user={user} />

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
      >
        <div className="flex border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-600 border-b-2 border-primary-500 shadow-lg'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50/50'
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
              <h3 className="text-3xl font-bold text-gray-800 mb-6">System Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div 
                  className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-8 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <h4 className="font-semibold text-gray-800 mb-6 text-xl">AI Classification Status</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-gray-700 font-medium">Order Inquiries</span>
                      <span className="font-bold text-blue-600 text-lg">342</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-gray-700 font-medium">Support Requests</span>
                      <span className="font-bold text-purple-600 text-lg">189</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                      <span className="text-gray-700 font-medium">General Emails</span>
                      <span className="font-bold text-green-600 text-lg">716</span>
                    </div>
                  </div>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-8 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <h4 className="font-semibold text-gray-800 mb-6 text-xl">Recent Activity</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                      <span className="text-gray-700">Order inquiry auto-responded</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-3 h-3 bg-blue-400 rounded-full shadow-sm"></div>
                      <span className="text-gray-700">Support ticket classified</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                      <div className="w-3 h-3 bg-purple-400 rounded-full shadow-sm"></div>
                      <span className="text-gray-700">Template updated</span>
                    </div>
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