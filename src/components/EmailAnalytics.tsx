import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Clock, Target, BarChart3, Users, ArrowUpDown, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { type User, type EmailLog, getEmailLogs } from '../lib/supabase';

interface EmailAnalyticsProps {
  user: User | null;
}

type SortableKeys = 'processed_at' | 'sender_email' | 'category' | 'response_sent';

interface SortConfig {
  key: SortableKeys | null;
  direction: 'ascending' | 'descending';
}

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'processed_at', direction: 'descending' });

  const chartData = [ // This is mock data, actual chart should use emailLogs
    { day: 'Mon', orders: 45, support: 23, general: 67 },
    { day: 'Tue', orders: 52, support: 31, general: 78 },
    { day: 'Wed', orders: 38, support: 28, general: 54 },
    { day: 'Thu', orders: 61, support: 35, general: 89 },
    { day: 'Fri', orders: 49, support: 27, general: 72 },
    { day: 'Sat', orders: 33, support: 18, general: 45 },
    { day: 'Sun', orders: 28, support: 15, general: 39 }
  ];

  const maxValue = Math.max(...chartData.flatMap(d => [d.orders, d.support, d.general])); // Adjust if chart uses real data

  const insights = [ // These could also be derived from emailLogs
    {
      title: 'Peak Hours',
      value: '9 AM - 11 AM', // Placeholder - derive from logs
      description: 'Highest email volume',
      icon: Clock,
      color: 'text-gray-700'
    },
    {
      title: 'Top Category',
      value: 'General (58%)', // Placeholder - derive from logs
      description: 'Most common email type',
      icon: Target,
      color: 'text-gray-600'
    },
    {
      title: 'Avg. Response Time', // Renamed for clarity
      value: '2.3 seconds', // Placeholder - this is AI classification speed, not email response time
      description: 'AI classification speed',
      icon: TrendingUp,
      color: 'text-gray-800'
    },
    {
      title: 'Automated Responses', // Changed from Satisfaction
      value: emailLogs.filter(log => log.response_sent).length.toString(), // Example: count of sent responses
      description: 'Total automated replies sent',
      icon: Mail, // Changed icon
      color: 'text-gray-500'
    }
  ];

  useEffect(() => {
    if (user) {
      setLoadingLogs(true);
      getEmailLogs(user.id)
        .then(logs => {
          setEmailLogs(logs);
          setLoadingLogs(false);
        })
        .catch(error => {
          console.error("Error fetching email logs:", error);
          setLoadingLogs(false);
          // TODO: Add user-facing error message
        });
    } else {
      setEmailLogs([]);
      setLoadingLogs(false);
    }
  }, [user]);

  const sortedEmailLogs = useMemo(() => {
    let sortableItems = [...emailLogs];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [emailLogs, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKeys) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-12"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h3>
        <p className="text-gray-600 mb-6">Please sign in to view your email analytics</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth')}
          className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
        <h3 className="text-3xl font-bold text-gray-900">Email Analytics</h3>
        <p className="text-gray-600 mt-2">Track your email automation performance and insights</p>
      </div>

      {/* Insights Grid - Consider making these dynamic based on logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => ( // These insights are currently placeholders or simple counts
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <insight.icon className={`w-8 h-8 ${insight.color}`} />
              <BarChart3 className="w-4 h-4 text-gray-400" /> {/* Placeholder icon */}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{insight.value}</p>
              <p className="text-sm text-gray-800 font-medium mb-1">{insight.title}</p>
              <p className="text-xs text-gray-600">{insight.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Email Log Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">Processed Email Log</h4>
          {loadingLogs ? (
            <div className="flex justify-center items-center py-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full"
              />
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-10">
              <Mail size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No email logs found.</p>
              <p className="text-sm text-gray-500">Once emails are processed, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    {[
                      { label: 'Date', key: 'processed_at' as SortableKeys },
                      { label: 'Sender', key: 'sender_email' as SortableKeys },
                      { label: 'Subject', key: null }, // Not sorting by subject for now
                      { label: 'Category', key: 'category' as SortableKeys },
                      { label: 'Response Sent', key: 'response_sent' as SortableKeys },
                    ].map(header => (
                      <th
                        key={header.label}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => header.key && requestSort(header.key)}
                      >
                        <div className="flex items-center">
                          {header.label}
                          {header.key && getSortIndicator(header.key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedEmailLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(log.processed_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs" title={log.sender_email}>
                        {log.sender_email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 truncate max-w-sm" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.category === 'order' ? 'bg-blue-100 text-blue-800' :
                          log.category === 'support' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {log.response_sent ? (
                          <CheckCircle size={18} className="text-green-500 inline" title="Yes" />
                        ) : (
                          <XCircle size={18} className="text-red-500 inline" title="No" />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>


      {/* Existing Charts and Metrics (can be updated later to use real log data) */}
      {/* Weekly Chart - Placeholder Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-xl font-semibold text-gray-900">Weekly Email Distribution (Sample)</h4>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-800 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">Orders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-600 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm"></div>
              <span className="text-gray-700 font-medium">General</span>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {chartData.map((data, index) => ( // chartData is still mock data
            <motion.div /* ... existing chart rendering ... */ >
              {/* ... */}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Metrics - Placeholder Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* ... existing performance metrics sections ... */}
      </div>
    </motion.div>
  );
};

export default EmailAnalytics;