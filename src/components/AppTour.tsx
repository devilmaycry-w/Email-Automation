import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Zap, Settings, CheckCircle } from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: Zap,
    title: 'Connect Your Gmail',
    content: 'Start by securely connecting your Gmail account. This allows CodexCity to process incoming emails and send automated replies on your behalf.',
    highlight: 'Connect Gmail',
  },
  {
    icon: Settings,
    title: 'Set Up Email Templates',
    content: 'Customize pre-defined templates for different email categories like Orders, Support, and General inquiries. You can define the subject and body for each.',
    highlight: 'Set Templates',
  },
  {
    icon: CheckCircle,
    title: 'Automate Your Responses!',
    content: 'Once connected and templates are set, CodexCity will automatically classify new emails and send appropriate, personalized responses. You can monitor everything from your dashboard.',
    highlight: 'Automate',
  },
];

const LOCAL_STORAGE_KEY = 'codexCityTourCompleted';

const AppTour: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (tourCompleted !== 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose(); // Finish tour
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = (skipped: boolean = false) => {
    setIsOpen(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    if (skipped) {
      console.log('Tour skipped by user.');
    } else {
      console.log('Tour completed by user.');
    }
  };

  if (!isOpen) {
    return null;
  }

  const CurrentIcon = TOUR_STEPS[currentStep].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[100] p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50"
          >
            {/* Header with Icon and Skip Button */}
            <div className="p-6 flex items-center justify-between border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <motion.div
                  key={currentStep} // Re-trigger animation on step change
                  initial={{ scale:0.8, opacity:0 }}
                  animate={{ scale:1, opacity:1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10}}
                  className="p-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-lg"
                >
                  <CurrentIcon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white">
                  {TOUR_STEPS[currentStep].title}
                </h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleClose(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close tour"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {TOUR_STEPS[currentStep].content}
              </p>

              {/* Progress Dots */}
              <div className="flex justify-center space-x-2 pt-2">
                {TOUR_STEPS.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                      index === currentStep ? 'bg-blue-500 scale-125' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    onClick={() => setCurrentStep(index)}
                    whileHover={{ scale: 1.5 }}
                  ></motion.div>
                ))}
              </div>
            </div>

            {/* Footer with Navigation Buttons */}
            <div className="p-6 flex justify-between items-center border-t border-gray-700/50">
              <motion.button
                onClick={handlePrev}
                disabled={currentStep === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg
                  ${currentStep === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
              >
                <ArrowLeft size={16} />
                <span>Prev</span>
              </motion.button>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span>{currentStep === TOUR_STEPS.length - 1 ? 'Got it!' : 'Next'}</span>
                {currentStep < TOUR_STEPS.length - 1 && <ArrowRight size={16} />}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppTour;
