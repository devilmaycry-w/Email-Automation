import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, Github, MessageSquare } from 'lucide-react'; // Ensured MessageSquare is imported, ExternalLink removed

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 mt-16 shadow-lg"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          {/* Powered by CodexCity Badge */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center" // Removed space-x-4, badge is self-contained
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors cursor-default"
            >
              <Zap className="w-5 h-5" />
              <span className="text-sm font-semibold">Powered by CodexCity</span>
            </motion.div>
          </motion.div>

          {/* Links: GitHub and Feedback */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-4">
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://github.com/your-repo/codexcity" // TODO: Replace with actual GitHub link
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">View on GitHub</span>
            </motion.a>
            
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://forms.gle/example123" // Placeholder Google Form URL
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Share Feedback</span>
            </motion.a>
          </div>

          {/* Made with Love Section */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 text-gray-600"
          >
            <span className="text-sm font-medium">Made with</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="w-5 h-5 text-red-500" />
            </motion.div>
            <span className="text-sm font-medium">for small businesses</span>
          </motion.div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © 2025 CodexCity. Streamlining email automation with intelligent AI classification and personalized responses.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;