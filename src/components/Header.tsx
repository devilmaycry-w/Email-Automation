import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Settings, Zap, LogOut, User } from 'lucide-react';
import { supabase, type User as UserType } from '../lib/supabase';

interface HeaderProps {
  user: UserType | null;
  onShowSetup: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onShowSetup }) => {
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      handleSignOut();
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleGmailSetup = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    onShowSetup();
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-gray-300 to-white rounded-full shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                CodexCity
              </h1>
              <p className="text-sm text-gray-600 font-medium">AI Email Automation</p>
            </div>
          </motion.div>

          <div className="flex items-center space-x-4">
            {user && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGmailSetup}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Gmail Setup</span>
              </motion.button>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-200 rounded-full flex items-center justify-center text-gray-800 font-semibold text-sm shadow-lg"
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <div className="flex items-center space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-2 h-2 rounded-full ${user.gmail_connected ? 'bg-green-500' : 'bg-yellow-500'} shadow-sm`}
                      />
                      <p className="text-xs text-gray-600">
                        {user.gmail_connected ? 'Gmail Connected' : 'Setup Required'}
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAuthAction}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span>Get Started</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;