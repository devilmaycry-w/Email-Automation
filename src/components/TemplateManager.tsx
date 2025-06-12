import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit3, Save, X, Plus, Mail, MessageSquare, HelpCircle } from 'lucide-react';
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
      color: 'from-gray-800 to-gray-600',
      description: 'Automated response for order-related inquiries'
    },
    {
      category: 'support' as const,
      icon: MessageSquare,
      color: 'from-gray-700 to-gray-500',
      description: 'Automated response for support requests'
    },
    {
      category: 'general' as const,
      icon: HelpCircle,
      color: 'from-gray-600 to-gray-800',
      description: 'General response for unclassified emails'
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Email Templates</h3>
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

      <div className="grid gap-8">
        {templateConfig.map((config, index) => {
          const template = templates.find(t => t.category === config.category);
          
          return (
            <motion.div
              key={config.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-4 rounded-2xl bg-gradient-to-r ${config.color} shadow-lg`}
                    >
                      <config.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 capitalize">
                        {config.category} Emails
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
                          <pre className="text-gray-800 whitespace-pre-wrap font-sans">{template.body}</pre>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-gray-800/10 rounded-2xl border border-gray-300">
                      <p className="text-sm text-gray-700">
                        <strong>Available variables:</strong> [Name], [Email], [Subject], [TicketID]
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No template found for {config.category} emails</p>
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