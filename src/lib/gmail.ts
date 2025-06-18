// Gmail API integration utilities
export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface EmailClassification {
  category: 'order' | 'support' | 'general';
  confidence: number;
}

export interface GmailTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// OAuth 2.0 Gmail authentication
export const initializeGmailAuth = (config: GmailConfig) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
    `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.modify')}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  return authUrl;
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string, config: GmailConfig): Promise<GmailTokenResponse | null> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string, config: GmailConfig): Promise<GmailTokenResponse | null> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};

// Fetch emails from Gmail (can be used as a fallback or for general fetching)
export const fetchEmails = async (accessToken: string, maxResults: number = 10) => {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

// Poll for new emails received after a specific timestamp
export const pollNewEmails = async (
  accessToken: string,
  lastProcessedTimestamp?: string, // ISO 8601 string e.g., "2023-10-26T10:00:00Z"
  maxResults: number = 100 // Fetch more emails during polling
): Promise<any[]> => {
  try {
    let query = 'is:unread'; // Basic query to fetch unread emails, good for polling
    if (lastProcessedTimestamp) {
      const lastProcessedSeconds = Math.floor(new Date(lastProcessedTimestamp).getTime() / 1000);
      query += ` after:${lastProcessedSeconds}`;
    } else {
      // Optional: if no timestamp, fetch emails from the last day or a short period
      // For simplicity, if no timestamp, we rely on 'is:unread' and maxResults.
      // Alternatively, one could add: `after:${Math.floor((Date.now() - 24*60*60*1000)/1000)}` for last 24h
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodedQuery}`;

    // Enhanced logging for debugging
    console.log('[Gmail] Polling URL:', url);
    console.log('[Gmail] Query string:', query);
    console.log('[Gmail] Last processed timestamp:', lastProcessedTimestamp);
    console.log('[Gmail] Encoded query:', encodedQuery);

    const response = await fetch(url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    console.log('[Gmail] API Response status:', response.status);
    console.log('[Gmail] API Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail] API Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gmail] API Response data:', data);
    console.log('[Gmail] Number of messages found:', data.messages?.length || 0);
    console.log('[Gmail] Result size estimate:', data.resultSizeEstimate);
    
    // Log first few message IDs for debugging
    if (data.messages && data.messages.length > 0) {
      console.log('[Gmail] First few message IDs:', data.messages.slice(0, 3).map((m: any) => m.id));
    }
    
    // data.messages is a list of {id, threadId}.
    // data.resultSizeEstimate might be 0 if no new emails.
    return data.messages || [];
  } catch (error) {
    console.error('[Gmail] Error polling new emails:', error);
    throw error; // Rethrow to be handled by the caller
  }
};

// Get email details
export const getEmailDetails = async (accessToken: string, messageId: string) => {
  try {
    console.log('[Gmail] Fetching details for message ID:', messageId);
    
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    console.log('[Gmail] Email details response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail] Email details error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gmail] Email details received for message:', messageId);
    console.log('[Gmail] Email internal date:', data.internalDate);
    console.log('[Gmail] Email snippet:', data.snippet);
    
    return data;
  } catch (error) {
    console.error('[Gmail] Error fetching email details:', error);
    throw error;
  }
};

// Send email response
export const sendEmailResponse = async (
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
) => {
  try {
    console.log('[Gmail] Sending email response to:', to);
    console.log('[Gmail] Subject:', subject);
    console.log('[Gmail] Thread ID:', threadId);
    
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      threadId ? `In-Reply-To: ${threadId}` : '',
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ].join('\n');

    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    console.log('[Gmail] Send email response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail] Send email error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gmail] Email sent successfully, message ID:', data.id);
    return data;
  } catch (error) {
    console.error('[Gmail] Error sending email response:', error);
    throw error;
  }
};

// Simple AI classification (replace with actual AI service)
export const classifyEmail = async (subject: string, body: string): Promise<EmailClassification> => {
  console.log('[Gmail] Classifying email with subject:', subject);
  console.log('[Gmail] Email body length:', body.length);
  
  // Define keywords for each category
  const orderInquiryKeywords = [
    'order status', 'where is my order', 'order number', 'purchase inquiry',
    'invoice request', 'delivery status', 'shipping inquiry', 'product availability'
  ];
  const supportRequestKeywords = [
    'help', 'support', 'assistance', 'problem', 'issue', 'error', 'bug',
    'technical support', 'cannot login', 'forgot password', 'broken', 'fix'
  ];
  // General category will be the fallback if no specific keywords are matched strongly.

  const text = (subject + ' ' + body).toLowerCase();
  
  let orderInquiryScore = 0;
  orderInquiryKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      orderInquiryScore++;
      console.log('[Gmail] Found order keyword:', keyword);
    }
  });
  
  let supportRequestScore = 0;
  supportRequestKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      supportRequestScore++;
      console.log('[Gmail] Found support keyword:', keyword);
    }
  });
  
  console.log('[Gmail] Classification scores - Order:', orderInquiryScore, 'Support:', supportRequestScore);
  
  // Determine category based on keyword matches
  // If both scores are 0, or they are equal but low, it's general.
  // Otherwise, the higher score determines the category.
  if (orderInquiryScore > supportRequestScore && orderInquiryScore > 0) {
    console.log('[Gmail] Classified as: order');
    return { category: 'order', confidence: orderInquiryScore };
  } else if (supportRequestScore > orderInquiryScore && supportRequestScore > 0) {
    console.log('[Gmail] Classified as: support');
    return { category: 'support', confidence: supportRequestScore };
  } else if (orderInquiryScore > 0 && orderInquiryScore === supportRequestScore) {
    // If scores are equal and positive, could be either, let's default to support for now or add more logic
    // For now, let's make it 'general' if scores are equal and positive but low, or default to one.
    // Sticking to the prompt, highest score wins, if equal, one must be chosen or be general.
    // Let's make it 'general' if scores are equal and positive, for now.
    // This part could be refined based on business rules.
    // Let's re-evaluate: if one category has significantly more keywords, its score might naturally be higher.
    // The request is "simple count of keyword matches".
    // If orderInquiryScore is 1 and supportRequestScore is 1, it's ambiguous.
    // Let's say if scores are equal but positive, it's general.
    console.log('[Gmail] Classified as: general (equal scores)');
    return { category: 'general', confidence: orderInquiryScore + supportRequestScore }; // Sum of matches as confidence
  } else { // Covers cases where both scores are 0
    console.log('[Gmail] Classified as: general (no keywords)');
    return { category: 'general', confidence: 0 }; // No relevant keywords found
  }
};

// Personalize email template
export const personalizeTemplate = (template: string, variables: Record<string, string>) => {
  let personalizedTemplate = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    personalizedTemplate = personalizedTemplate.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return personalizedTemplate;
};

// Debug utility to test Gmail API connection
export const testGmailConnection = async (accessToken: string) => {
  try {
    console.log('[Gmail] Testing Gmail API connection...');
    
    // Test basic profile access
    const profileResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    console.log('[Gmail] Profile API response status:', profileResponse.status);

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('[Gmail] Profile API error:', errorText);
      throw new Error(`Profile API error! status: ${profileResponse.status}, body: ${errorText}`);
    }

    const profileData = await profileResponse.json();
    console.log('[Gmail] Profile data:', profileData);

    // Test messages list access (without query)
    const messagesResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    console.log('[Gmail] Messages API response status:', messagesResponse.status);

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('[Gmail] Messages API error:', errorText);
      throw new Error(`Messages API error! status: ${messagesResponse.status}, body: ${errorText}`);
    }

    const messagesData = await messagesResponse.json();
    console.log('[Gmail] Messages data:', messagesData);
    console.log('[Gmail] Total messages in mailbox:', messagesData.resultSizeEstimate);

    return {
      success: true,
      profile: profileData,
      totalMessages: messagesData.resultSizeEstimate,
      recentMessages: messagesData.messages?.length || 0
    };

  } catch (error) {
    console.error('[Gmail] Connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};