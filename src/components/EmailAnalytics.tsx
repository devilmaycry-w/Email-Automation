import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Clock, Target, BarChart3, Users } from 'lucide-react';
import { type User } from '../lib/supabase';

interface EmailAnalyticsProps {
  user: User | null;
}

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ user }) => {
  const navigate = useNavigate();

  const chartData = [
    { day: 'Mon', orders: 45, support: 23, general: 67 },
    { day: 'Tue', orders: 52, support: 31, general: 78 },
    { day: 'Wed', orders: 38, support: 28, general: 54 },
    { day: 'Thu', orders: 61, support: 35, general: 89 },
    { day: 'Fri', orders: 49, support: 27, general: 72 },
    { day: 'Sat', orders: 33, support: 18, general: 45 },
    { day: 'Sun', orders: 28, support: 15, general: 39 }
  ];

  const maxValue = Math.max(...chartData.flatMap(d => [d.orders, d.support, d.general]));

  const insights = [
    {
      title: 'Peak Hours',
      value: '9 AM - 11 AM',
      description: 'Highest email volume',
      icon: Clock,
      color: 'text-[#8B7EC8]'
    },
    {
      title: 'Top Category',
      value: 'General (58%)',
      description: 'Most common email type',
      icon: Target,
      color: 'text-[#6B5B95]'
    },
    {
      title: 'Avg. Response',
      value: '2.3 seconds',
      description: 'AI classification speed',
      icon: TrendingUp,
      color: 'text-[#4A4063]'
    },
    {
      title: 'Satisfaction',
      value: '96.8%',
      description: 'Customer approval rate',
      icon: Users,
      color: 'text-[#2D2A3D]'
    }
  ];

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-12"
      >
        <h3 className="text-2xl font-bold text-white mb-4">Sign In Required</h3>
        <p className="text-white/70 mb-6">Please sign in to view your email analytics</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth')}
          className="px-6 py-3 bg-gradient-to-r from-[#292966] to-[#5C5C99] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Sign In
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h3 className="text-3xl font-bold text-white">Email Analytics</h3>
        <p className="text-white/70 mt-2">Track your email automation performance and insights</p>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <insight.icon className={`w-8 h-8 ${insight.color}`} />
              <BarChart3 className="w-4 h-4 text-white/50" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{insight.value}</p>
              <p className="text-sm text-white/80 font-medium mb-1">{insight.title}</p>
              <p className="text-xs text-white/60">{insight.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-xl font-semibold text-white">Weekly Email Distribution</h4>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#292966] rounded-full shadow-sm"></div>
              <span className="text-white/80 font-medium">Orders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#5C5C99] rounded-full shadow-sm"></div>
              <span className="text-white/80 font-medium">Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#8B7EC8] rounded-full shadow-sm"></div>
              <span className="text-white/80 font-medium">General</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {chartData.map((data, index) => (
            <motion.div
              key={data.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center space-x-6"
            >
              <div className="w-12 text-sm font-medium text-white/80">
                {data.day}
              </div>
              <div className="flex-1 flex items-center space-x-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.orders / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-[#292966] h-5 rounded-l-lg shadow-sm"
                ></motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.support / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.1 }}
                  className="bg-[#5C5C99] h-5 shadow-sm"
                ></motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.general / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  className="bg-[#8B7EC8] h-5 rounded-r-lg shadow-sm"
                ></motion.div>
              </div>
              <div className="text-sm text-white/80 w-16 text-right font-medium">
                {data.orders + data.support + data.general}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-[#292966]/20 to-[#5C5C99]/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl"
        >
          <h4 className="text-xl font-semibold text-white mb-6">Classification Accuracy</h4>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-white/80 font-medium">Order Inquiries</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-white/20 rounded-full h-3">
                  <div className="bg-[#292966] h-3 rounded-full shadow-sm" style={{ width: '98%' }}></div>
                </div>
                <span className="text-sm font-semibold text-[#8B7EC8] w-10">98%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80 font-medium">Support Requests</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-white/20 rounded-full h-3">
                  <div className="bg-[#5C5C99] h-3 rounded-full shadow-sm" style={{ width: '96%' }}></div>
                </div>
                <span className="text-sm font-semibold text-[#6B5B95] w-10">96%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80 font-medium">General Emails</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-white/20 rounded-full h-3">
                  <div className="bg-[#8B7EC8] h-3 rounded-full shadow-sm" style={{ width: '99%' }}></div>
                </div>
                <span className="text-sm font-semibold text-[#4A4063] w-10">99%</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-br from-[#5C5C99]/20 to-[#A3A3CC]/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl"
        >
          <h4 className="text-xl font-semibold text-white mb-6">Response Metrics</h4>
          <div className="space-y-6">
            <motion.div
              whileHover={{ x: 5 }}
              className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <span className="text-white/80 font-medium">Auto-responses Sent</span>
              <span className="font-semibold text-[#8B7EC8]">1,247</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <span className="text-white/80 font-medium">Manual Overrides</span>
              <span className="font-semibold text-[#6B5B95]">23</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <span className="text-white/80 font-medium">Failed Classifications</span>
              <span className="font-semibold text-[#4A4063]">8</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <span className="text-white/80 font-medium">Success Rate</span>
              <span className="font-semibold text-[#2D2A3D]">98.5%</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmailAnalytics;