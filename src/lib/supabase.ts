import { createClient } from '@supabase/supabase-js';

// These would be set in your .env file in a real application
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User interface
export interface User {
  id: string;
  email: string;
  gmail_connected: boolean;
}

// Gmail tokens interface
export interface GmailTokens {
  id?: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  created_at?: string;
  updated_at?: string;
}

// Email template interface
export interface EmailTemplate {
  id?: string;
  user_id: string;
  category: 'order' | 'support' | 'general';
  subject: string;
  body: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Email log interface
export interface EmailLog {
  id?: string;
  user_id: string;
  gmail_message_id?: string;
  sender_email: string;
  subject: string;
  category: 'order' | 'support' | 'general';
  confidence_score?: number;
  response_sent?: boolean;
  response_template_id?: string;
  processed_at?: string;
  created_at?: string;
}

// Gmail token functions
export const storeGmailTokens = async (tokens: Omit<GmailTokens, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .upsert([tokens], { onConflict: 'user_id' })
    .select();
  
  if (error) {
    console.error('Error storing Gmail tokens:', error);
    return null;
  }
  
  return data;
};

export const getGmailTokens = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching Gmail tokens:', error);
    return null;
  }
  
  return data;
};

export const deleteGmailTokens = async (userId: string) => {
  const { error } = await supabase
    .from('user_gmail_tokens')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting Gmail tokens:', error);
    return false;
  }
  
  return true;
};

// Template functions
export const createDefaultTemplates = async (userId: string) => {
  const defaultTemplates = [
    {
      user_id: userId,
      category: 'order' as const,
      subject: 'Order Update - We\'re on it! 📦',
      body: 'Hi [Name],\n\nThank you for your order inquiry! We\'ve received your message and our team is already working on getting back to you with all the details.\n\nExpected response time: Within 2 hours\nOrder tracking will be available soon.\n\nBest regards,\nThe CodexCity Team'
    },
    {
      user_id: userId,
      category: 'support' as const,
      subject: 'Support Ticket Created - We\'re here to help! 🛠️',
      body: 'Hi [Name],\n\nWe\'ve received your support request and want to help you resolve this quickly!\n\nTicket ID: #[TicketID]\nPriority: Normal\nExpected resolution: 24 hours\n\nOur support team will review your case and get back to you shortly.\n\nBest regards,\nCodexCity Support Team'
    },
    {
      user_id: userId,
      category: 'general' as const,
      subject: 'Thanks for reaching out! 💫',
      body: 'Hi [Name],\n\nThank you for contacting CodexCity! We appreciate you taking the time to reach out to us.\n\nWe\'ve received your message and will review it carefully. Our team typically responds within 24 hours during business days.\n\nIf your matter is urgent, please don\'t hesitate to mark it as high priority.\n\nBest regards,\nThe CodexCity Team'
    }
  ];

  const { data, error } = await supabase
    .from('email_templates')
    .upsert(defaultTemplates, { onConflict: 'user_id,category' })
    .select();
  
  if (error) {
    console.error('Error creating default templates:', error);
    return null;
  }
  
  return data;
};

export const getTemplates = async (userId: string) => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('category');
  
  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
  
  return data;
};

export const updateTemplate = async (id: string, template: Partial<EmailTemplate>) => {
  const { data, error } = await supabase
    .from('email_templates')
    .update(template)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating template:', error);
    return null;
  }
  
  return data;
};

// Email log functions
export const createEmailLog = async (emailLog: Omit<EmailLog, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('email_logs')
    .insert([emailLog])
    .select();
  
  if (error) {
    console.error('Error creating email log:', error);
    return null;
  }
  
  return data;
};

export const getEmailAnalytics = async (userId: string) => {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('user_id', userId)
    .order('processed_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching email analytics:', error);
    return [];
  }
  
  return data;
};

// Auth helper functions
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Check if Gmail is connected
  const gmailTokens = await getGmailTokens(user.id);
  
  return {
    id: user.id,
    email: user.email || '',
    gmail_connected: !!gmailTokens
  };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  return true;
};