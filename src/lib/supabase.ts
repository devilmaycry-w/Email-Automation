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
  manual_override_active?: boolean // Added for manual override feature
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
  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch Gmail tokens: ${error.message}`)
  }

  return data || null
}

// Get current user with Gmail connection status
export async function getCurrentUser(): Promise<User | null> {
  console.log('[Supabase] getCurrentUser: Function called - starting execution');
  
  try {
    console.log('[Supabase] getCurrentUser: About to call supabase.auth.getUser()');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('[Supabase] getCurrentUser: supabase.auth.getUser() completed');
    
    if (authError) {
      console.error('[Supabase] getCurrentUser: Auth error occurred:', authError);
      return null;
    }
    
    if (!authUser) {
      console.log('[Supabase] getCurrentUser: No authenticated user found.');
      return null;
    }
    
    console.log('[Supabase] getCurrentUser: authUser found:', authUser.id, authUser.email);

    let userProfileData: Partial<User> = { // Use Partial<User> to build up the profile
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      manual_override_active: false, // Default
    };
    let gmail_connected = false;

    try {
      // Fetch full user profile from 'users' table
      console.log('[Supabase] getCurrentUser: Attempting to fetch profile from "users" table for user ID:', authUser.id);
      const { data: fetchedProfile, error: profileError } = await supabase
        .from('users') // Assuming 'users' is your public table for profiles
        .select('*')
        .eq('id', authUser.id)
        .single();

      console.log('[Supabase] getCurrentUser: Profile query completed. Error:', profileError, 'Data:', fetchedProfile);

      if (profileError) {
        // Do not throw if RLS makes it return no rows, or if profile is simply not there yet.
        // Log the error but proceed with basic authUser data.
        console.warn('[Supabase] getCurrentUser: Error fetching user profile from "users" table:', profileError.message, 'Code:', profileError.code);
        // userProfileData remains the default from authUser, which is intended.
        // If the error is critical (e.g. table doesn't exist, network issue), it might still bubble up if not caught by Supabase client.
      } else if (fetchedProfile) {
        console.log('[Supabase] getCurrentUser: Profile fetched successfully from "users" table:', fetchedProfile);
        userProfileData = { ...userProfileData, ...fetchedProfile }; // Merge authUser info with profile info
      } else {
        console.log('[Supabase] getCurrentUser: No profile found in "users" table for user ID:', authUser.id, 'Will use default data from auth.user.');
        // This case means the query was successful but no row was returned.
        // userProfileData will be the default from authUser.
      }
    } catch (e: any) {
      console.error('[Supabase] getCurrentUser: Exception while fetching profile from "users" table:', e.message, e);
      // userProfileData remains the default from authUser.
    }

    try {
      // Check if user has Gmail tokens using the existing function
      console.log('[Supabase] getCurrentUser: Attempting to fetch Gmail tokens for user ID:', authUser.id);
      const gmailTokens = await getGmailTokens(authUser.id);
      console.log('[Supabase] getCurrentUser: Gmail tokens query completed. Tokens found:', !!gmailTokens);
      if (gmailTokens) {
        console.log('[Supabase] getCurrentUser: Gmail tokens found.');
        gmail_connected = true;
      } else {
        console.log('[Supabase] getCurrentUser: No Gmail tokens found.');
        gmail_connected = false;
      }
    } catch (e: any) {
      console.error('[Supabase] getCurrentUser: Exception while fetching Gmail tokens:', e.message, e);
      gmail_connected = false; // Ensure it's false if token fetching fails
    }

    const finalUserObject: User = {
      id: userProfileData.id!, // id is guaranteed from authUser
      email: userProfileData.email,
      manual_override_active: userProfileData.manual_override_active ?? false,
      created_at: userProfileData.created_at,
      updated_at: userProfileData.updated_at,
      gmail_connected: gmail_connected,
    };

    console.log('[Supabase] getCurrentUser: Returning final User object:', finalUserObject);
    return finalUserObject;
    
  } catch (error: any) {
    console.error('[Supabase] getCurrentUser: Critical error in getCurrentUser function:', error.message, error);
    console.error('[Supabase] getCurrentUser: Error stack:', error.stack);
    return null;
  }
}

// Store Gmail tokens
export async function storeGmailTokens(userId: string, tokens: {
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
}): Promise<void> {
  const { error } = await supabase
    .from('user_gmail_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.modify'
    })

  if (error) {
    throw new Error(`Failed to store Gmail tokens: ${error.message}`)
  }
}

// Create default templates for a user
export async function createDefaultTemplates(userId: string): Promise<void> {
  const defaultTemplates = [
    {
      user_id: userId,
      category: 'order' as const,
      subject: 'Thank you for your order',
      body: 'Thank you for your order! We have received your request and will process it shortly. You will receive a confirmation email once your order is ready.',
      is_active: true
    },
    {
      user_id: userId,
      category: 'support' as const,
      subject: 'We received your support request',
      body: 'Thank you for contacting our support team. We have received your message and will get back to you within 24 hours. If this is urgent, please call our support line.',
      is_active: true
    },
    {
      user_id: userId,
      category: 'general' as const,
      subject: 'Thank you for your message',
      body: 'Thank you for reaching out to us. We have received your message and will respond as soon as possible. We appreciate your interest in our services.',
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
  const { data, error } = await supabase
    .from('email_logs')
    .insert([{ ...logEntry, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error('Error logging email processing:', error.message);
    // Depending on desired error handling, you might throw, or return null/specific error object
    throw new Error(`Failed to log email processing: ${error.message}`);
  }

  return data;
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