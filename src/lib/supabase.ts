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
  category: 'order' | 'support' | 'general'
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
  category: 'order' | 'support' | 'general'
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

// Create default templates for a user
export async function createDefaultTemplates(userId: string): Promise<void> {
  const defaultTemplates = [
    {
      user_id: userId,
      category: 'order' as const,
      subject: 'Thank you for your order inquiry',
      body: 'Dear [Name],\n\nThank you for your order inquiry! We have received your request and will process it shortly. You will receive a confirmation email once your order is ready.\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\nCustomer Service Team',
      is_active: true
    },
    {
      user_id: userId,
      category: 'support' as const,
      subject: 'We received your support request',
      body: 'Dear [Name],\n\nThank you for contacting our support team. We have received your message and will get back to you within 24 hours.\n\nTicket ID: [TicketID]\n\nIf this is urgent, please call our support line.\n\nBest regards,\nSupport Team',
      is_active: true
    },
    {
      user_id: userId,
      category: 'general' as const,
      subject: 'Thank you for your message',
      body: 'Dear [Name],\n\nThank you for reaching out to us. We have received your message and will respond as soon as possible. We appreciate your interest in our services.\n\nBest regards,\nCustomer Service Team',
      is_active: true
    }
  ]

  const { error } = await supabase
    .from('email_templates')
    .upsert(defaultTemplates, {
      onConflict: 'user_id,category',
      ignoreDuplicates: true
    })

  if (error) {
    throw new Error(`Failed to create default templates: ${error.message}`)
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