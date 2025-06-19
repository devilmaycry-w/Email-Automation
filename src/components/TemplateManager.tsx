import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit3, Save, X, Plus, Mail, MessageSquare, HelpCircle, Heart, Users, Star, AlertTriangle, DollarSign, Truck, RefreshCw, Wrench, Handshake, FileText, Calendar, Frown, Smile, BarChart3, Clock, Zap } from 'lucide-react';
import { getTemplates, updateTemplate, type User, type EmailTemplate } from '../lib/supabase';

interface TemplateManagerProps {
  user: User | null;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ user }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const templateConfig = [
    {
      category: 'order' as const,
      icon: Mail,
      color: 'from-blue-600 to-blue-400',
      description: 'Automated response for order-related inquiries'
    },
    {
      category: 'support' as const,
      icon: MessageSquare,
      color: 'from-green-600 to-green-400',
      description: 'Automated response for support requests'
    },
    {
      category: 'general' as const,
      icon: HelpCircle,
      color: 'from-gray-600 to-gray-400',
      description: 'General response for unclassified emails'
    },
    {
      category: 'feedback' as const,
      icon: Star,
      color: 'from-yellow-600 to-yellow-400',
      description: 'Response for customer feedback and suggestions'
    },
    {
      category: 'followup' as const,
      icon: RefreshCw,
      color: 'from-purple-600 to-purple-400',
      description: 'Follow-up messages for ongoing conversations'
    },
    {
      category: 'welcome' as const,
      icon: Heart,
      color: 'from-pink-600 to-pink-400',
      description: 'Welcome messages for new customers'
    },
    {
      category: 'reengagement' as const,
      icon: Users,
      color: 'from-indigo-600 to-indigo-400',
      description: 'Re-engagement emails for inactive customers'
    },
    {
      category: 'product_review' as const,
      icon: Star,
      color: 'from-orange-600 to-orange-400',
      description: 'Product review and rating requests'
    },
    {
      category: 'billing' as const,
      icon: DollarSign,
      color: 'from-emerald-600 to-emerald-400',
      description: 'Billing and payment related inquiries'
    },
    {
      category: 'shipping' as const,
      icon: Truck,
      color: 'from-cyan-600 to-cyan-400',
      description: 'Shipping and delivery status updates'
    },
    {
      category: 'refund' as const,
      icon: RefreshCw,
      color: 'from-red-600 to-red-400',
      description: 'Refund and return process assistance'
    },
    {
      category: 'technical' as const,
      icon: Wrench,
      color: 'from-slate-600 to-slate-400',
      description: 'Technical support and troubleshooting'
    },
    {
      category: 'partnership' as const,
      icon: Handshake,
      color: 'from-teal-600 to-teal-400',
      description: 'Business partnership and collaboration inquiries'
    },
    {
      category: 'newsletter' as const,
      icon: FileText,
      color: 'from-violet-600 to-violet-400',
      description: 'Newsletter subscription and updates'
    },
    {
      category: 'appointment' as const,
      icon: Calendar,
      color: 'from-rose-600 to-rose-400',
      description: 'Appointment scheduling and confirmations'
    },
    {
      category: 'complaint' as const,
      icon: Frown,
      color: 'from-red-700 to-red-500',
      description: 'Customer complaint resolution'
    },
    {
      category: 'compliment' as const,
      icon: Smile,
      color: 'from-green-700 to-green-500',
      description: 'Thank you messages for positive feedback'
    },
    {
      category: 'survey' as const,
      icon: BarChart3,
      color: 'from-blue-700 to-blue-500',
      description: 'Survey and feedback collection'
    },
    {
      category: 'urgent' as const,
      icon: AlertTriangle,
      color: 'from-red-800 to-red-600',
      description: 'Urgent priority responses'
    },
    {
      category: 'spam' as const,
      icon: X,
      color: 'from-gray-800 to-gray-600',
      description: 'Spam detection and handling'
    }
  ];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserTemplates = async () => {
      try {
        const userTemplates = await getTemplates(user.id);
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTemplates();
  }, [user]);

  const handleEdit = (templateId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditingId(templateId);
      setEditForm({ subject: template.subject, body: template.body });
    }
  };

  const handleSave = async () => {
    if (!editingId || !user) return;
    
    try {
      const updatedTemplate = await updateTemplate(editingId, {
        subject: editForm.subject,
        body: editForm.body
      });

      if (updatedTemplate) {
        setTemplates(prev => prev.map(template => 
          template.id === editingId 
            ? { ...template, subject: editForm.subject, body: editForm.body }
            : template
        ));
      }
      setEditingId(null);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ subject: '', body: '' });
  };

  const handleAddTemplate = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    console.log('Add template functionality');
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
        <p className="text-gray-600 mb-6">Please sign in to manage your email templates</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Email Templates</h3>
          <p className="text-gray-600 mt-2">Customize your automated responses for different email categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddTemplate}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Template</span>
        </motion.button>
      </div>

      <div className="grid gap-6 sm:gap-8">
        {templateConfig.map((config, index) => {
          const template = templates.find(t => t.category === config.category);
          
          return (
            <motion.div
              key={config.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-4 rounded-2xl bg-gradient-to-r ${config.color} shadow-lg`}
                    >
                      <config.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize">
                        {config.category.replace('_', ' ')} Emails
                      </h4>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  
                  {template && (
                    editingId === template.id ? (
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleSave}
                          className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg"
                        >
                          <Save className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCancel}
                          className="p-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors shadow-lg"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(template.id!)}
                        className="p-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-lg"
                      >
                        <Edit3 className="w-5 h-5" />
                      </motion.button>
                    )
                  )}
                </div>

                {template ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Subject Line</label>
                      {editingId === template.id ? (
                        <input
                          type="text"
                          value={editForm.subject}
                          onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                          className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                        />
                      ) : (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                          <p className="font-medium text-gray-900">{template.subject}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Email Body</label>
                      {editingId === template.id ? (
                        <textarea
                          value={editForm.body}
                          onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                          rows={8}
                          className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 resize-none bg-white text-gray-900 placeholder-gray-500"
                        />
                      ) : (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                          <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm">{template.body}</pre>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-gray-800/10 rounded-2xl border border-gray-300">
                      <p className="text-sm text-gray-700">
                        <strong>Available variables:</strong> [Name], [Email], [Subject], [TicketID], [OrderNumber]
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No template found for {config.category.replace('_', ' ')} emails</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddTemplate}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Create Template
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TemplateManager;