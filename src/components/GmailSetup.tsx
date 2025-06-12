import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, CheckCircle, AlertCircle, X, ExternalLink, Copy } from 'lucide-react';
import { initializeGmailAuth } from '../lib/gmail';
import { type User } from '../lib/supabase';

interface GmailSetupProps {
  user: User | null;
  onClose: () => void;
}

const GmailSetup: React.FC<GmailSetupProps> = ({ user, onClose }) => {
  const [currentStep, setCurrentStep] = useState(user?.gmail_connected ? 3 : 1);
  const [isConnecting, setIsConnecting] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'Google Cloud Setup',
      description: 'OAuth 2.0 credentials configured',
      icon: Lock
    },
    {
      id: 2,
      title: 'Gmail API Enable',
      description: 'Enable Gmail API access',
      icon: Mail
    },
    {
      id: 3,
      title: 'Connect Account',
      description: 'Authorize CodexCity',
      icon: CheckCircle
    }
  ];

  const redirectURIs = [
    'http://localhost:5173/auth/gmail/callback',
    'https://your-domain.com/auth/gmail/callback'
  ];

  const handleConnect = () => {
    if (!user) {
      alert('Please sign in first to connect your Gmail account.');
      return;
    }

    setIsConnecting(true);
    
    const config = {
      clientId: import.meta.env.VITE_GMAIL_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI
    };

    if (!config.clientId || !config.clientSecret) {
      alert('Gmail credentials not configured. Please check your environment variables.');
      setIsConnecting(false);
      return;
    }

    try {
      const authUrl = initializeGmailAuth(config);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Gmail auth:', error);
      setIsConnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-800/10 to-gray-600/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gmail Integration Setup</h2>
              <p className="text-gray-600 mt-1">Connect your Gmail account for AI-powered email automation</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: currentStep >= step.id ? 1 : 0.8 }}
                  whileHover={{ scale: currentStep >= step.id ? 1.1 : 0.8 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                    currentStep >= step.id
                      ? 'bg-gradient-to-r from-gray-800 to-gray-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </motion.div>
                <div className="ml-3 flex-1">
                  <p className={`font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 transition-all duration-300 ${currentStep > step.id ? 'bg-gradient-to-r from-gray-800 to-gray-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-800">OAuth 2.0 Credentials Configured!</h3>
                  </div>
                  <p className="text-green-700 mb-4">Your Gmail OAuth credentials are already set up and ready to use.</p>
                  <div className="bg-white/80 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-gray-700 mb-2"><strong>Client ID:</strong></p>
                    <code className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      {import.meta.env.VITE_GMAIL_CLIENT_ID}
                    </code>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 shadow-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Authorized Redirect URIs</h4>
                  <p className="text-gray-600 text-sm mb-4">These redirect URIs are configured in your OAuth 2.0 setup:</p>
                  <div className="space-y-2">
                    {redirectURIs.map((uri, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-blue-200 shadow-sm">
                        <code className="text-sm text-gray-800">{uri}</code>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigator.clipboard.writeText(uri)}
                          className="p-1 text-gray-600 hover:text-gray-900 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Next: Enable Gmail API
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-green-50 rounded-2xl p-6 shadow-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Step 2: Enable Gmail API</h3>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="font-medium text-gray-900">Navigate to API Library</p>
                        <p className="text-gray-600 text-sm">In Google Cloud Console, go to APIs & Services → Library</p>
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          href="https://console.cloud.google.com/apis/library"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 mt-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <span>Open API Library</span>
                          <ExternalLink className="w-4 h-4" />
                        </motion.a>
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-medium text-gray-900">Search for Gmail API</p>
                        <p className="text-gray-600 text-sm">Find and select the Gmail API from the library</p>
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-medium text-gray-900">Enable the API</p>
                        <p className="text-gray-600 text-sm">Click the "Enable" button to activate Gmail API access</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Ready to Connect</p>
                      <p className="text-yellow-700 text-sm">Once you've enabled the Gmail API, you can proceed to connect your account.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Previous
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isConnecting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <span>Connect Gmail Account</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg border border-green-200"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Gmail Successfully Connected!</h3>
                  <p className="text-gray-600 mt-2">Your Gmail account is now integrated with CodexCity. AI-powered email automation is ready to use.</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-6 shadow-lg border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
                  <ul className="text-left space-y-2 text-gray-700">
                    <motion.li
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Customize your email response templates</span>
                    </motion.li>
                    <motion.li
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Monitor AI classification accuracy</span>
                    </motion.li>
                    <motion.li
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Track automation analytics</span>
                    </motion.li>
                  </ul>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  Go to Dashboard
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GmailSetup;