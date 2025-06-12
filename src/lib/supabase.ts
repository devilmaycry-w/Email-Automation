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

// Get current user with Gmail connection status
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Check if user has Gmail tokens
  const { data: gmailTokens } = await supabase
    .from('user_gmail_tokens')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email,
    gmail_connected: !!gmailTokens,
    created_at: user.created_at,
    updated_at: user.updated_at
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

// Get Gmail tokens for a user
export async function getGmailTokens(userId: string): Promise<GmailTokens | null> {
  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch Gmail tokens: ${error.message}`)
  }

  return data || null
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