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
  console.log('[Supabase] getGmailTokens: Attempting to fetch tokens for userID:', userId);

  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .select('*') // Consider selecting specific non-sensitive fields if tokens are too sensitive for any logs
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] getGmailTokens: Error fetching Gmail tokens for userID:', userId, error);
    // Depending on RLS, an error might not be thrown for "no rows found" with maybeSingle(),
    // but other errors (network, policy violation for select if stricter) could occur.
    throw new Error(`Failed to fetch Gmail tokens: ${error.message}`);
  }

  if (data) {
    console.log('[Supabase] getGmailTokens: Successfully fetched Gmail tokens for userID:', userId,
      // Log non-sensitive parts of the token data
      {
        id: data.id,
        user_id: data.user_id,
        has_access_token: !!data.access_token,
        has_refresh_token: !!data.refresh_token,
        expires_at: data.expires_at,
        scope: data.scope,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    );
  } else {
    console.log('[Supabase] getGmailTokens: No Gmail tokens found for userID:', userId);
  }

  return data || null;
}

// Get current user with Gmail connection status
export async function getCurrentUser(): Promise<User | null> {
  console.log('[Supabase getCurrentUser] Function called - starting execution.');
  const { data: { user: authUser } } = await supabase.auth.getUser();
  console.log('[Supabase getCurrentUser] supabase.auth.getUser() response:', authUser ? {id: authUser.id, email: authUser.email} : null);

  if (!authUser) {
    console.log('[Supabase getCurrentUser] No authUser found by supabase.auth.getUser(), returning null.');
    return null;
  }

  let userProfile: User | Partial<User> | null = null; // To hold the profile data from 'users' table
  let profileErrorOccurred = false;

  try {
    console.log('[Supabase getCurrentUser] Attempting to fetch profile from "users" table for user ID:', authUser.id);
    const { data: fetchedProfileData, error: profileQueryError } = await supabase
      .from('users') // Public 'users' table
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle(); // Changed from .single()

    if (profileQueryError) {
      console.error('[Supabase getCurrentUser] Error fetching user profile from "users" table (maybeSingle):', profileQueryError.message);
      profileErrorOccurred = true; // Mark that an error occurred, even if maybeSingle doesn't throw for "no rows"
      // We will proceed with minimal user object construction using authUser data.
    }
    userProfile = fetchedProfileData; // This will be null if no row found or if an error (like RLS) prevented row return

  } catch (e: any) {
    console.error('[Supabase getCurrentUser] Exception during profile fetch from "users" table:', e.message);
    profileErrorOccurred = true; // An unexpected exception occurred
  }

  // Handle case where profile is not found (new user or error)
  if (!userProfile && !profileErrorOccurred) { // Explicitly no profile found, and no major error fetching it
    console.warn('[Supabase getCurrentUser] User profile not found in "users" table (likely new user or trigger/RLS issue if error was silent). Constructing minimal user object.');
    return {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      gmail_connected: false, // New user won't have Gmail connected yet
      manual_override_active: false, // Default for new user
    } as User;
  }

  if (profileErrorOccurred && !userProfile) { // An error occurred AND we have no profile data
     console.warn('[Supabase getCurrentUser] Due to profile fetch error and no profile data, constructing minimal user object.');
     return {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      gmail_connected: false,
      manual_override_active: false,
    } as User;
  }

  // If profile WAS found:
  console.log('[Supabase getCurrentUser] Profile fetched or constructed for "users" table processing:', userProfile);

  let gmail_connected = false;
  try {
    console.log('[Supabase getCurrentUser] Attempting to fetch Gmail tokens for user ID:', authUser.id);
    const gmailTokens = await getGmailTokens(authUser.id); // getGmailTokens already has good logging
    if (gmailTokens) {
      console.log('[Supabase getCurrentUser] Gmail tokens found by getGmailTokens.');
      gmail_connected = true;
    } else {
      console.log('[Supabase getCurrentUser] No Gmail tokens found by getGmailTokens.');
    }
  } catch (tokenError: any) {
    console.error('[Supabase getCurrentUser] Error fetching Gmail tokens:', tokenError.message);
    // Proceed with gmail_connected as false
  }

  // Construct the final User object using the fetched profile (which might be minimal if only authUser data was used due to profile error)
  // and the determined gmail_connected status.
  const finalUser = {
    id: authUser.id, // Always from authUser as source of truth for ID
    email: userProfile?.email || authUser.email, // Prefer profile email, fallback to authUser
    created_at: userProfile?.created_at || authUser.created_at,
    updated_at: userProfile?.updated_at || authUser.updated_at,
    manual_override_active: (userProfile as User)?.manual_override_active ?? false, // Default to false if not in profile
    gmail_connected: gmail_connected,
  } as User;

  console.log('[Supabase getCurrentUser] Returning final User object:', finalUser);
  return finalUser;
}

// Store Gmail tokens
export async function storeGmailTokens(userId: string, tokens: {
  access_token: string
  refresh_token?: string
  expires_at?: string
  scope?: string
}): Promise<void> {
  console.log('[Supabase] storeGmailTokens: Storing tokens for userID:', userId);
  // Avoid logging the full access/refresh tokens for security in shared logs.
  // Log structure or specific non-sensitive parts if necessary for debugging.
  console.log('[Supabase] storeGmailTokens: Token details (excluding sensitive values):', {
    has_access_token: !!tokens.access_token,
    has_refresh_token: !!tokens.refresh_token,
    expires_at: tokens.expires_at,
    scope: tokens.scope,
  });

  const tokenDataToStore = {
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at,
    scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.modify',
    // updated_at will be set by default by Supabase (if column default is now())
    // or could be added here: updated_at: new Date().toISOString()
  };

  console.log(`[Supabase storeGmailTokens] Attempting to upsert tokens for userId: ${userId}`, tokenDataToStore);
  const { data, error } = await supabase
    .from('user_gmail_tokens')
    .upsert(tokenDataToStore, { onConflict: 'user_id' }) // Specify conflict target
    .select();

  if (error) {
    console.error('[Supabase storeGmailTokens] Error upserting Gmail tokens:', error);
    // Throw a new error to ensure the caller knows the storage failed.
    throw new Error(`Failed to store Gmail tokens: ${error.message}`);
  } else {
    console.log('[Supabase storeGmailTokens] Tokens upserted successfully. Returned data (check for RLS on SELECT):', data);
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

// Utility to get a valid access token, refreshing if necessary
export async function getValidAccessToken(
  userId: string,
  gmailConfig: { clientId: string; clientSecret: string; redirectUri: string; } // Re-using GmailConfig type structure
): Promise<string | null> {
  console.log('[Supabase getValidAccessToken] Called for userId:', userId);

  const storedTokens = await getGmailTokens(userId); // getGmailTokens already has logging
  console.log('[Supabase getValidAccessToken] Tokens retrieved by getGmailTokens:', storedTokens ? 'Found' : 'Not Found/Null');

  if (!storedTokens || !storedTokens.access_token) {
    console.warn(`[Supabase getValidAccessToken] No stored tokens or access_token field is missing for userID: ${userId}. Returning null.`);
    return null;
  }

  // Check for expiry
  console.log('[Supabase getValidAccessToken] Checking token expiry. Expires_at:', storedTokens.expires_at, 'Current time:', new Date().toISOString());
  const bufferMilliseconds = 10 * 60 * 1000; // 10 minutes buffer
  const expiresAt = storedTokens.expires_at ? new Date(storedTokens.expires_at).getTime() : 0;

  if (expiresAt > Date.now() + bufferMilliseconds) {
    console.log(`[Supabase getValidAccessToken] Token is valid (not expired) for userID: ${userId}. Returning current access_token.`);
    return storedTokens.access_token;
  }

  console.log(`[Supabase getValidAccessToken] Token expired or needs proactive refresh for userID: ${userId}.`);

  if (!storedTokens.refresh_token) {
    console.error(`[Supabase getValidAccessToken] Token expired for userID: ${userId}, but NO refresh_token found. Cannot refresh. Returning null.`);
    // Optionally, could delete the invalid tokens here: await deleteGmailTokens(userId);
    return null;
  }

  console.log(`[Supabase getValidAccessToken] Attempting to refresh token for userID: ${userId} using refresh_token:`, storedTokens.refresh_token ? 'Exists' : 'MISSING!');
  console.log('[Supabase getValidAccessToken] Gmail config being passed to refreshAccessToken:', { clientId: gmailConfig.clientId, clientSecretExists: !!gmailConfig.clientSecret, redirectUri: gmailConfig.redirectUri });

  // Dynamically import refreshAccessToken to avoid circular dependencies or if structure is rigid
  const { refreshAccessToken } = await import('../lib/gmail');

  const newTokensFromRefresh = await refreshAccessToken(storedTokens.refresh_token, gmailConfig);
  console.log('[Supabase getValidAccessToken] Response from refreshAccessToken:', newTokensFromRefresh ? 'Received new tokens' : 'Did NOT receive new tokens (null)');


  if (newTokensFromRefresh && newTokensFromRefresh.access_token) {
    console.log(`[Supabase getValidAccessToken] Successfully refreshed token for userID: ${userId}. New access_token (first 10 chars):`, newTokensFromRefresh.access_token.substring(0,10));
    const newExpiresAt = new Date(Date.now() + newTokensFromRefresh.expires_in * 1000).toISOString();

    console.log('[Supabase getValidAccessToken] Storing new tokens after successful refresh...');
    try {
      await storeGmailTokens(userId, {
        access_token: newTokensFromRefresh.access_token,
        refresh_token: newTokensFromRefresh.refresh_token || storedTokens.refresh_token,
        expires_at: newExpiresAt,
        scope: newTokensFromRefresh.scope || storedTokens.scope,
      });
      console.log(`[Supabase getValidAccessToken] New tokens stored for userID: ${userId}. Returning new access_token.`);
      return newTokensFromRefresh.access_token;
    } catch (storeError) {
      console.error(`[Supabase getValidAccessToken] CRITICAL: Failed to store new tokens after refresh for userID: ${userId}. Error:`, storeError);
      // If storing fails, we should not return the new token as it might lead to inconsistent state.
      // The old token is expired, new one couldn't be saved. Re-auth might be best.
      return null;
    }
  } else {
    console.error(`[Supabase getValidAccessToken] Token refresh failed for userID: ${userId}. refreshAccessToken returned null/undefined or no access_token. Returning null.`);
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
  userId: string // This should be auth.uid() from the caller
): Promise<EmailLog | null> {
  // Log the userId received by the function AND the current auth.uid() if possible from this context
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const currentAuthUid = sessionData?.session?.user?.id;

  console.log(`[Supabase logEmailProcessing] Called for (passed in) userId: ${userId}`);
  if(sessionError) {
    console.error('[Supabase logEmailProcessing] Error fetching session:', sessionError.message);
  } else {
    console.log(`[Supabase logEmailProcessing] Current session auth.uid(): ${currentAuthUid}`);
  }

  if (!userId) {
    console.error('[Supabase logEmailProcessing] CRITICAL: userId parameter is null or undefined. Cannot insert log.');
    // throw new Error('userId parameter is null or undefined for logEmailProcessing'); // Or return null if preferred by caller
    return null;
  }
  if (currentAuthUid && userId !== currentAuthUid) {
    console.warn(`[Supabase logEmailProcessing] WARNING: Passed userId (${userId}) does not match current session auth.uid() (${currentAuthUid}). This might cause RLS issues if RLS is based on auth.uid().`);
  }

  const logDataToInsert = { ...logEntry, user_id: userId };
  console.log('[Supabase logEmailProcessing] Attempting to insert log data:', logDataToInsert);

  const { data, error } = await supabase
    .from('email_logs')
    .insert([logDataToInsert]) // Ensure it's an array of objects
    .select()
    .single();

  if (error) {
    console.error('[Supabase logEmailProcessing] Error inserting email log:', error.message, error); // Log full error object
    // Consider the specific error message: "new row violates row-level security policy"
    if (error.message.includes('violates row-level security policy') || error.message.includes('RLS')) {
        console.error(`[Supabase logEmailProcessing] RLS VIOLATION LIKELY: This means the policy check failed.
        Auth UID from session: ${currentAuthUid}, user_id in attempted insert: ${userId}`);
    }
    throw new Error(`Failed to log email processing: ${error.message}`);
  }

  console.log('[Supabase logEmailProcessing] Email log inserted successfully. Returned data:', data);
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