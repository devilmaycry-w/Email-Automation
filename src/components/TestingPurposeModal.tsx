import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Zap } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'codexCityTestingModalCompleted';

const TestingPurposeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const MODAL_STEPS = [
    {
      icon: Zap,
      title: 'Testing Purpose Only',
      content: 'This project is for testing and demonstration purposes. Experience how AI-powered email automation can transform your business workflow.',
      highlight: 'Demo Project',
    },
    {
      icon: Zap,
      title: 'Want Real Automation?',
      content: 'If you want to implement this email automation system for your business, contact our developer for a custom solution.',
      highlight: 'Get Custom Solution',
    },
    {
      icon: Zap,
      title: 'Contact Developer',
      content: 'Ready to automate your email system? Reach out to our developer at codexcity.biz@gmail.com to discuss your business needs.',
      highlight: 'Contact Now',
    },
  ];

  useEffect(() => {
    const modalCompleted = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (modalCompleted !== 'true') {
      // Show modal after AppTour would typically complete
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < MODAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose(); // Finish modal
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
      console.log('Testing modal skipped by user.');
    } else {
      console.log('Testing modal completed by user.');
    }
  };

  const handleContactDeveloper = () => {
    window.open('mailto:codexcity.biz@gmail.com?subject=CodexCity Email Automation - Business Inquiry', '_blank');
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  const CurrentIcon = MODAL_STEPS[currentStep].icon;

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
            className="bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl w-full max-w-md border border-purple-700/50"
          >
            {/* Header with Icon and Skip Button */}
            <div className="p-6 flex items-center justify-between border-b border-purple-700/50">
              <div className="flex items-center space-x-3">
                <motion.div
                  key={currentStep} // Re-trigger animation on step change
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  className="p-2 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg shadow-lg"
                >
                  <CurrentIcon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white">
                  {MODAL_STEPS[currentStep].title}
                </h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleClose(true)}
                className="text-purple-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-purple-300 text-sm leading-relaxed">
                {MODAL_STEPS[currentStep].content}
              </p>

              {/* Progress Dots */}
              <div className="flex justify-center space-x-2 pt-2">
                {MODAL_STEPS.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                      index === currentStep ? 'bg-purple-500 scale-125' : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                    onClick={() => setCurrentStep(index)}
                    whileHover={{ scale: 1.5 }}
                  ></motion.div>
                ))}
              </div>
            </div>

            {/* Footer with Navigation Buttons */}
            <div className="p-6 flex justify-between items-center border-t border-purple-700/50">
              <motion.button
                onClick={handlePrev}
                disabled={currentStep === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg
                  ${currentStep === 0
                    ? 'bg-purple-600 text-purple-400 cursor-not-allowed opacity-50'
                    : 'bg-purple-700 hover:bg-purple-600 text-white'
                  }`}
              >
                <ArrowLeft size={16} />
                <span>Prev</span>
              </motion.button>

              {currentStep === MODAL_STEPS.length - 1 ? (
                <motion.button
                  onClick={handleContactDeveloper}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>Contact Developer</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TestingPurposeModal;