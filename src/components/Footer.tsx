import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, Github, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="bg-white/10 backdrop-blur-xl border-t border-white/20 mt-16 shadow-lg"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-4"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-[#292966] to-[#5C5C99] rounded-2xl flex items-center justify-center shadow-xl"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#CCCCFF] to-white rounded-full shadow-lg"
              />
            </div>
            <div>
              <p className="font-bold bg-gradient-to-r from-white to-[#CCCCFF] bg-clip-text text-transparent text-lg">
                Powered by CodexCity
              </p>
              <p className="text-xs text-white/70">AI Email Automation Platform</p>
            </div>
          </motion.div>

          <div className="flex items-center space-x-8">
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors group"
            >
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Export to GitHub</span>
            </motion.a>
            
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="#"
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors group"
            >
              <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Share Live Link</span>
            </motion.a>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 text-white/70"
          >
            <span className="text-sm font-medium">Made with</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="w-5 h-5 text-red-400" />
            </motion.div>
            <span className="text-sm font-medium">for small businesses</span>
          </motion.div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-xs text-white/50">
            © 2025 CodexCity. Streamlining email automation with intelligent AI classification and personalized responses.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;