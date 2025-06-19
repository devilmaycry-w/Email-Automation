import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on database schema
export interface User {
  id: string
  email?: string
  gmail_connected?: boolean
  manual_override_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface EmailTemplate {
  id?: string
  user_id: string
  category: 'order' | 'support' | 'general' | 'feedback' | 'followup' | 'welcome' | 'reengagement' | 'product_review' | 'billing' | 'shipping' | 'refund' | 'technical' | 'partnership' | 'newsletter' | 'appointment' | 'complaint' | 'compliment' | 'survey' | 'urgent' | 'spam'
  subject: string
  body: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface GmailTokens {
  id: string
  user_id: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  user_id: string
  gmail_message_id?: string
  sender_email: string
  subject: string
  category: 'order' | 'support' | 'general' | 'feedback' | 'followup' | 'welcome' | 'reengagement' | 'product_review' | 'billing' | 'shipping' | 'refund' | 'technical' | 'partnership' | 'newsletter' | 'appointment' | 'complaint' | 'compliment' | 'survey' | 'urgent' | 'spam'
  confidence_score: number
  response_sent: boolean
  response_template_id?: string
  processed_at: string
  created_at: string
}

// Get Gmail tokens for a user
export async function getGmailTokens(userId: string): Promise<GmailTokens | null> {
  console.log('[Supabase getGmailTokens] Fetching tokens for user:', userId);

  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase getGmailTokens] Error:', error);
    throw new Error(`Failed to fetch Gmail tokens: ${error.message}`);
  }

  if (data) {
    console.log('[Supabase getGmailTokens] Tokens found for user:', userId);
  } else {
    console.log('[Supabase getGmailTokens] No tokens found for user:', userId);
  }

  return data || null;
}

// Get current user with Gmail connection status
export async function getCurrentUser(): Promise<User | null> {
  console.log('[Supabase getCurrentUser] Getting current user');
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    console.log('[Supabase getCurrentUser] No authenticated user');
    return null;
  }

  // Try to get user profile from users table
  let userProfile: User | null = null;
  
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.warn('[Supabase getCurrentUser] Profile fetch error:', profileError.message);
    } else {
      userProfile = profileData;
    }
  } catch (e: any) {
    console.warn('[Supabase getCurrentUser] Profile fetch exception:', e.message);
  }

  // Check Gmail connection status
  let gmail_connected = false;
  try {
    const gmailTokens = await getGmailTokens(authUser.id);
    gmail_connected = !!gmailTokens;
  } catch (tokenError: any) {
    console.error('[Supabase getCurrentUser] Error checking Gmail tokens:', tokenError.message);
  }

  // Construct final user object
  const finalUser: User = {
    id: authUser.id,
    email: userProfile?.email || authUser.email,
    created_at: userProfile?.created_at || authUser.created_at,
    updated_at: userProfile?.updated_at || authUser.updated_at,
    manual_override_active: userProfile?.manual_override_active ?? false,
    gmail_connected: gmail_connected,
  };

  console.log('[Supabase getCurrentUser] Final user object created');
  return finalUser;
}

// Store Gmail tokens
export async function storeGmailTokens(userId: string, tokens: {
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
}): Promise<void> {
  console.log('[Supabase storeGmailTokens] Storing tokens for user:', userId);

  const tokenDataToStore = {
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at,
    scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.modify',
  };

  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .upsert(tokenDataToStore, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('[Supabase storeGmailTokens] Error:', error);
    throw new Error(`Failed to store Gmail tokens: ${error.message}`);
  }

  console.log('[Supabase storeGmailTokens] Tokens stored successfully');
}

// Create default templates for a user with comprehensive categories
export async function createDefaultTemplates(userId: string): Promise<void> {
  const defaultTemplates = [
    {
      user_id: userId,
      category: 'order' as const,
      subject: 'Thank you for your order inquiry - [TicketID]',
      body: 'Dear [Name],\n\nThank you for your order inquiry! We have received your request and are processing it with the highest priority.\n\nOrder Details:\n- Inquiry ID: [TicketID]\n- Customer Email: [Email]\n- Subject: [Subject]\n\nOur team will review your order and send you a detailed confirmation within 2-4 hours. You will receive tracking information once your order ships.\n\nIf you have any urgent questions, please don\'t hesitate to contact our customer service team.\n\nBest regards,\nThe CodexCity Team\nCustomer Service Department',
      is_active: true
    },
    {
      user_id: userId,
      category: 'support' as const,
      subject: 'We received your support request - [TicketID]',
      body: 'Dear [Name],\n\nThank you for contacting our support team. We have received your message and understand your concern.\n\nSupport Ticket Details:\n- Ticket ID: [TicketID]\n- Customer Email: [Email]\n- Subject: [Subject]\n\nOur technical support specialists will review your case and respond within 24 hours. For urgent technical issues, please call our priority support line.\n\nWe appreciate your patience and look forward to resolving your inquiry quickly.\n\nBest regards,\nThe CodexCity Team\nTechnical Support Department',
      is_active: true
    },
    {
      user_id: userId,
      category: 'general' as const,
      subject: 'Thank you for contacting us - [TicketID]',
      body: 'Dear [Name],\n\nThank you for reaching out to CodexCity. We have received your message and appreciate you taking the time to contact us.\n\nMessage Details:\n- Reference ID: [TicketID]\n- Your Email: [Email]\n- Subject: [Subject]\n\nOur team will review your message and respond as soon as possible. We typically respond to general inquiries within 24-48 hours.\n\nWe value your interest in our services and look forward to assisting you.\n\nBest regards,\nThe CodexCity Team\nCustomer Relations Department',
      is_active: true
    },
    {
      user_id: userId,
      category: 'feedback' as const,
      subject: 'Thank you for your valuable feedback - [TicketID]',
      body: 'Dear [Name],\n\nThank you for taking the time to share your feedback with us. Your input is incredibly valuable and helps us improve our services.\n\nFeedback Details:\n- Reference ID: [TicketID]\n- Your Email: [Email]\n- Subject: [Subject]\n\nWe take all feedback seriously and will review your suggestions with our product development team. If your feedback requires a direct response, we will get back to you within 3-5 business days.\n\nWe truly appreciate customers like you who help us grow and improve.\n\nBest regards,\nThe CodexCity Team\nProduct Development Department',
      is_active: true
    },
    {
      user_id: userId,
      category: 'followup' as const,
      subject: 'Following up on your inquiry - [TicketID]',
      body: 'Dear [Name],\n\nWe wanted to follow up on your recent inquiry to ensure you received the information you needed.\n\nOriginal Inquiry:\n- Reference ID: [TicketID]\n- Your Email: [Email]\n- Subject: [Subject]\n\nIf you have any additional questions or need further assistance, please don\'t hesitate to reach out. Our team is here to help you succeed.\n\nWe value your business and look forward to continuing our partnership.\n\nBest regards,\nThe CodexCity Team\nCustomer Success Department',
      is_active: true
    },
    {
      user_id: userId,
      category: 'welcome' as const,
      subject: 'Welcome to CodexCity! Let\'s get you started - [TicketID]',
      body: 'Dear [Name],\n\nWelcome to CodexCity! We\'re thrilled to have you join our community of innovative businesses.\n\nWelcome Package:\n- Account ID: [TicketID]\n- Your Email: [Email]\n- Getting Started Guide: Attached\n\nTo help you get the most out of our platform, we\'ve prepared a comprehensive onboarding guide. Our customer success team will also reach out within 24 hours to schedule a personalized walkthrough.\n\nIf you have any immediate questions, our support team is ready to assist you.\n\nWelcome aboard!\n\nBest regards,\nThe CodexCity Team\nCustomer Success Department',
      is_active: true
    },
    {
      user_id: userId,
      category: 'billing' as const,
      subject: 'Billing inquiry received - [TicketID]',
      body: 'Dear [Name],\n\nThank you for contacting us regarding your billing inquiry. We understand the importance of resolving billing matters promptly.\n\nBilling Inquiry Details:\n- Reference ID: [TicketID]\n- Account Email: [Email]\n- Subject: [Subject]\n\nOur billing specialists will review your account and respond within 24 hours with detailed information. For immediate billing concerns, please call our dedicated billing support line.\n\nWe appreciate your business and are committed to resolving this matter quickly.\n\nBest regards,\nThe CodexCity Team\nBilling Department',
      is_active: true
    }
  ];

  const { error } = await supabase
    .from('email_templates')
    .upsert(defaultTemplates, {
      onConflict: 'user_id,category',
      ignoreDuplicates: true
    });

  if (error) {
    throw new Error(`Failed to create default templates: ${error.message}`);
  }
}

// Get templates for a user
export async function getTemplates(userId: string): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', userId)
    .order('category')

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }

  return data || []
}

// Create a new template
export async function createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> {
  console.log('[Supabase createTemplate] Creating new template for user:', template.user_id);

  const { data, error } = await supabase
    .from('email_templates')
    .insert([template])
    .select()
    .single();

  if (error) {
    console.error('[Supabase createTemplate] Error creating template:', error);
    throw new Error(`Failed to create template: ${error.message}`);
  }

  console.log('[Supabase createTemplate] Template created successfully');
  return data;
}

// Utility to get a valid access token, refreshing if necessary
export async function getValidAccessToken(
  userId: string,
  gmailConfig: { clientId: string; clientSecret: string; redirectUri: string; }
): Promise<string | null> {
  console.log('[Supabase getValidAccessToken] Getting valid token for user:', userId);

  const storedTokens = await getGmailTokens(userId);
  
  if (!storedTokens || !storedTokens.access_token) {
    console.warn('[Supabase getValidAccessToken] No stored tokens found');
    return null;
  }

  // Check for expiry
  const bufferMilliseconds = 10 * 60 * 1000; // 10 minutes buffer
  const expiresAt = storedTokens.expires_at ? new Date(storedTokens.expires_at).getTime() : 0;

  if (expiresAt > Date.now() + bufferMilliseconds) {
    console.log('[Supabase getValidAccessToken] Token is still valid');
    return storedTokens.access_token;
  }

  console.log('[Supabase getValidAccessToken] Token expired, attempting refresh');

  if (!storedTokens.refresh_token) {
    console.error('[Supabase getValidAccessToken] No refresh token available');
    return null;
  }

  // Refresh token
  const { refreshAccessToken } = await import('../lib/gmail');
  const newTokens = await refreshAccessToken(storedTokens.refresh_token, gmailConfig);

  if (newTokens && newTokens.access_token) {
    console.log('[Supabase getValidAccessToken] Token refreshed successfully');
    
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

    try {
      await storeGmailTokens(userId, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || storedTokens.refresh_token,
        expires_at: newExpiresAt,
        scope: newTokens.scope || storedTokens.scope,
      });
      
      return newTokens.access_token;
    } catch (storeError) {
      console.error('[Supabase getValidAccessToken] Failed to store refreshed tokens:', storeError);
      return null;
    }
  } else {
    console.error('[Supabase getValidAccessToken] Token refresh failed');
    return null;
  }
}

// Delete Gmail tokens for a user
export async function deleteGmailTokens(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('user_gmail_tokens')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting Gmail tokens:', error.message)
    return { error: new Error(`Failed to delete Gmail tokens: ${error.message}`) }
  }

  return { error: null }
}

// Check if we've already responded to this sender recently (duplicate prevention)
export async function hasRecentResponse(userId: string, senderEmail: string, hoursThreshold: number = 24): Promise<boolean> {
  const thresholdTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('sender_email', senderEmail)
    .eq('response_sent', true)
    .gte('processed_at', thresholdTime)
    .limit(1);

  if (error) {
    console.error('[Supabase hasRecentResponse] Error checking recent responses:', error);
    return false; // If we can't check, allow the response to be safe
  }

  const hasRecent = (data && data.length > 0);
  console.log(`[Supabase hasRecentResponse] Recent response check for ${senderEmail}: ${hasRecent ? 'FOUND' : 'NOT FOUND'}`);
  
  return hasRecent;
}

// Log email processing details
export async function logEmailProcessing(
  logEntry: Omit<EmailLog, 'id' | 'created_at' | 'user_id'>,
  userId: string
): Promise<EmailLog | null> {
  console.log('[Supabase logEmailProcessing] Logging email processing for user:', userId);

  if (!userId) {
    console.error('[Supabase logEmailProcessing] No userId provided');
    return null;
  }

  const logDataToInsert = { 
    ...logEntry, 
    user_id: userId,
    // Ensure confidence_score is a valid number
    confidence_score: Math.max(0, Math.min(1, logEntry.confidence_score || 0))
  };

  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert([logDataToInsert])
      .select()
      .single();

    if (error) {
      console.error('[Supabase logEmailProcessing] Error inserting log:', error);
      throw new Error(`Failed to log email processing: ${error.message}`);
    }

    console.log('[Supabase logEmailProcessing] Email log inserted successfully');
    return data;
  } catch (error: any) {
    console.error('[Supabase logEmailProcessing] Exception during insert:', error);
    throw error;
  }
}

// Update user's manual override status
export async function updateUserManualOverride(userId: string, status: boolean): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ manual_override_active: status, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating manual override status:', error.message)
    throw new Error(`Failed to update manual override status: ${error.message}`)
  }

  return data
}

// Update a template
export async function updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`)
  }

  return data
}

// Get email logs for a user
export async function getEmailLogs(userId: string, limit = 50): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('user_id', userId)
    .order('processed_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch email logs: ${error.message}`)
  }

  return data || []
}

// Get email statistics for dashboard
export async function getEmailStats(userId: string): Promise<{
  totalProcessed: number;
  totalSent: number;
  todayProcessed: number;
  todaySent: number;
  categoryBreakdown: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching email stats:', error);
    return {
      totalProcessed: 0,
      totalSent: 0,
      todayProcessed: 0,
      todaySent: 0,
      categoryBreakdown: {}
    };
  }

  const logs = data || [];
  const today = new Date().toISOString().split('T')[0];
  
  const todayLogs = logs.filter(log => 
    log.processed_at.startsWith(today)
  );

  const categoryBreakdown = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalProcessed: logs.length,
    totalSent: logs.filter(log => log.response_sent).length,
    todayProcessed: todayLogs.length,
    todaySent: todayLogs.filter(log => log.response_sent).length,
    categoryBreakdown
  };
}

// Check daily usage limit (100 emails per day for free plan)
export async function checkDailyUsageLimit(userId: string): Promise<{
  todayCount: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  resetTime: string;
}> {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('response_sent', true)
    .gte('processed_at', `${today}T00:00:00.000Z`)
    .lt('processed_at', `${today}T23:59:59.999Z`);

  if (error) {
    console.error('Error checking daily usage:', error);
    return {
      todayCount: 0,
      isNearLimit: false,
      isOverLimit: false,
      resetTime: tomorrow.toISOString()
    };
  }

  const todayCount = data?.length || 0;
  const DAILY_LIMIT = 100;
  const NEAR_LIMIT_THRESHOLD = 80; // 80% of limit

  return {
    todayCount,
    isNearLimit: todayCount >= NEAR_LIMIT_THRESHOLD && todayCount < DAILY_LIMIT,
    isOverLimit: todayCount >= DAILY_LIMIT,
    resetTime: tomorrow.toISOString()
  };
}