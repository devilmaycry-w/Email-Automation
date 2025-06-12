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
      color: 'from-blue-500 to-blue-600',
      description: 'Automated response for order-related inquiries'
    },
    {
      category: 'support' as const,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      description: 'Automated response for support requests'
    },
    {
      category: 'general' as const,
      icon: HelpCircle,
      color: 'from-green-500 to-green-600',
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
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h3>
        <p className="text-gray-600 mb-6">Please sign in to manage your email templates</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth')}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Sign In
        </motion.button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
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
          <h3 className="text-3xl font-bold text-gray-800">Email Templates</h3>
          <p className="text-gray-600 mt-2">Customize your automated responses for different email categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddTemplate}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
              className="bg-white/90 backdrop-blur-lg rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${config.color} shadow-lg`}>
                      <config.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 capitalize">
                        {config.category} Emails
                      </h4>
                      <p className="text-sm text-gray-500">{config.description}</p>
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
                          className="p-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors shadow-lg"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(template.id!)}
                        className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-lg"
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
                          className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        />
                      ) : (
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
                          <p className="font-medium text-gray-800">{template.subject}</p>
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
                          className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none bg-white/80 backdrop-blur-sm"
                        />
                      ) : (
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
                          <pre className="text-gray-700 whitespace-pre-wrap font-sans">{template.body}</pre>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/50">
                      <p className="text-sm text-blue-700">
                        <strong>Available variables:</strong> [Name], [Email], [Subject], [TicketID]
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No template found for {config.category} emails</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddTemplate}
                      className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
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