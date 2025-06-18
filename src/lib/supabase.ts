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
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) return null

  // Fetch full user profile from 'users' table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError) {
    console.error('Error fetching user profile:', profileError.message)
    // Return basic info from authUser if profile is missing, though this indicates an issue
    return {
      id: authUser.id,
      email: authUser.email,
      gmail_connected: false, // Cannot determine without profile or tokens call
      manual_override_active: false, // Default if profile is missing
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
    } as User
  }

  // Check if user has Gmail tokens using the existing function
  const gmailTokens = await getGmailTokens(authUser.id)

  return {
    ...userProfile, // Contains id, email, manual_override_active, etc. from 'users' table
    gmail_connected: !!gmailTokens, // Overwrite or set based on token check
  } as User
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