import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Zap, ArrowRight, Sparkles, Code, Heart } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'codexCityTestingModalDismissed';

const TestingPurposeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const modalDismissed = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (modalDismissed !== 'true') {
      // Show modal after a short delay to let the page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  };

  const handleContactDeveloper = () => {
    window.open('mailto:codexcity.biz@gmail.com?subject=CodexCity Email Automation - Business Inquiry', '_blank');
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200/50 overflow-hidden"
          >
            {/* Header with animated background */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                  >
                    <Zap className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold">CodexCity Demo</h2>
                    <p className="text-blue-100">AI Email Automation Platform</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-all duration-200"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Main Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <h3 className="text-2xl font-bold text-gray-900">Experience the Future of Email</h3>
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    <strong className="text-purple-700">This is a demonstration project</strong> showcasing the power of 
                    AI-driven email automation. See how intelligent classification and personalized responses 
                    can revolutionize your inbox management.
                  </p>
                </div>
              </motion.div>

              {/* Features Showcase */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900">Smart Classification</h4>
                  <p className="text-sm text-blue-700">AI categorizes emails with 95% accuracy</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-900">Instant Responses</h4>
                  <p className="text-sm text-purple-700">Automated replies in under 3 seconds</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <Code className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-indigo-900">Custom Templates</h4>
                  <p className="text-sm text-indigo-700">Personalized responses for every scenario</p>
                </div>
              </motion.div>

              {/* Call to Action */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white text-center"
              >
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Heart className="w-5 h-5 text-red-400" />
                  <h4 className="text-xl font-bold">Ready to Revolutionize Your Business?</h4>
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-gray-300 mb-4">
                  Transform your customer communication with intelligent automation. 
                  Contact our developer to bring this technology to your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContactDeveloper}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Contact Developer</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 border border-white/20"
                  >
                    Explore Demo
                  </motion.button>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4"
              >
                <p>
                  <strong>Developer:</strong> <a href="mailto:codexcity.biz@gmail.com" className="text-blue-600 hover:underline">codexcity.biz@gmail.com</a>
                </p>
                <p className="mt-1">
                  Built with ❤️ for small businesses seeking intelligent automation
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TestingPurposeModal;