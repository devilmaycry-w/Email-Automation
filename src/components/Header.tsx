import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Settings, Zap, LogOut, User } from 'lucide-react';
import { signOut, type User as UserType } from '../lib/supabase';

interface HeaderProps {
  user: UserType | null;
  onShowSetup: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onShowSetup }) => {
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      // Show user menu or sign out
      handleSignOut();
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    await signOut();
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
      className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-lg"
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
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                CodexCity
              </h1>
              <p className="text-sm text-gray-500 font-medium">AI Email Automation</p>
            </div>
          </motion.div>

          <div className="flex items-center space-x-4">
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGmailSetup}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Gmail Setup</span>
              </motion.button>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{user.email}</p>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${user.gmail_connected ? 'bg-green-400' : 'bg-yellow-400'} shadow-sm`}></div>
                      <p className="text-xs text-gray-500">
                        {user.gmail_connected ? 'Gmail Connected' : 'Setup Required'}
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAuthAction}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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