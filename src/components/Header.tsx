import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, Zap, LogOut, User, Menu, X } from 'lucide-react';
import { supabase, type User as UserType } from '../lib/supabase';

interface HeaderProps {
  user: UserType | null;
  onShowSetup: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onShowSetup }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white/95 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
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
                className="w-8 h-8 bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg flex items-center justify-center shadow-md"
              >
                <Zap className="w-4 h-4 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-gray-300 to-white rounded-full shadow-sm"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                CodexCity
              </h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">One Stop Email Automation</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGmailSetup}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  user.gmail_connected
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>{user.gmail_connected ? 'Gmail Settings' : 'Connect Gmail'}</span>
              </motion.button>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded-full flex items-center justify-center text-gray-800 font-semibold text-sm shadow-sm"
                  >
                    {user.email?.charAt(0).toUpperCase()}
                  </motion.div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user.email}</p>
                    <div className="flex items-center space-x-1">
                      <motion.div
                        animate={{ scale: user.gmail_connected ? [1, 1.2, 1] : [1, 1.3, 1] }}
                        transition={{ duration: user.gmail_connected ? 2 : 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-2 h-2 rounded-full ${user.gmail_connected ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}
                      />
                      <p className={`text-xs font-medium ${user.gmail_connected ? 'text-gray-500' : 'text-red-600'}`}>
                        {user.gmail_connected ? 'Connected' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Sign Out Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAuthAction}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span>Get Started</span>
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: mobileMenuOpen ? 'auto' : 0, opacity: mobileMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden border-t border-gray-200/60"
        >
          <div className="py-4 space-y-3">
            {user ? (
              <>
                {/* User Info Mobile */}
                <div className="flex items-center space-x-3 px-2 py-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-200 rounded-full flex items-center justify-center text-gray-800 font-semibold shadow-sm"
                  >
                    {user.email?.charAt(0).toUpperCase()}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    <div className="flex items-center space-x-1">
                      <motion.div
                        animate={{ scale: user.gmail_connected ? [1, 1.2, 1] : [1, 1.3, 1] }}
                        transition={{ duration: user.gmail_connected ? 2 : 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-2 h-2 rounded-full ${user.gmail_connected ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}
                      />
                      <p className={`text-xs font-medium ${user.gmail_connected ? 'text-gray-500' : 'text-red-600'}`}>
                        {user.gmail_connected ? 'Gmail Connected' : 'Gmail Not Connected'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gmail Setup Mobile */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGmailSetup}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    user.gmail_connected
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{user.gmail_connected ? 'Gmail Settings' : 'Connect Gmail'}</span>
                </motion.button>

                {/* Sign Out Mobile */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAuthAction}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg text-sm font-medium shadow-md"
              >
                <User className="w-4 h-4" />
                <span>Get Started</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
