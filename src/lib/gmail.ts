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
  console.log('[gmail.ts] exchangeCodeForToken: Attempting to exchange code for token.');
  console.log('[gmail.ts] exchangeCodeForToken: Using Client ID:', config.clientId);
  console.log('[gmail.ts] exchangeCodeForToken: Using Redirect URI:', config.redirectUri);

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

    console.log('[gmail.ts] exchangeCodeForToken: Response Status:', response.status);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
        console.error('[gmail.ts] exchangeCodeForToken: Token exchange error response body:', errorData);
      } catch (e) {
        const textError = await response.text();
        console.error('[gmail.ts] exchangeCodeForToken: Token exchange error response body (not JSON):', textError);
      }
      throw new Error(`HTTP error! status: ${response.status}, Error: ${JSON.stringify(errorData) || 'Unknown error structure'}`);
    }

    const data: GmailTokenResponse = await response.json();
    console.log('[gmail.ts] exchangeCodeForToken: Successfully exchanged code for token.');
    return data;
  } catch (error) {
    console.error('[gmail.ts] exchangeCodeForToken: Error during token exchange process:', error);
    return null;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string, config: GmailConfig): Promise<GmailTokenResponse | null> => {
  console.log(`[Gmail refreshAccessToken] Called with refresh token present: ${!!refreshToken}`);

  if (!refreshToken) {
    console.warn('[Gmail refreshAccessToken] Refresh token is missing!');
    return null;
  }

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

    console.log('[Gmail refreshAccessToken] Google API response status:', response.status);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        const textError = await response.text();
        errorData = { error: 'non_json_response', details: textError };
      }
      console.error('[Gmail refreshAccessToken] Google API error during refresh:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, Google Error: ${JSON.stringify(errorData)}`);
    }

    const data: GmailTokenResponse = await response.json();
    console.log('[Gmail refreshAccessToken] Refresh successful.');
    return data;
  } catch (error) {
    console.error('[Gmail refreshAccessToken] Error during token refresh:', error);
    return null;
  }
};

// Poll for new emails received after a specific timestamp
export const pollNewEmails = async (
  accessToken: string,
  lastProcessedTimestamp?: string,
  maxResults: number = 50
): Promise<any[]> => {
  console.log('[Gmail pollNewEmails] Polling for new emails', {
    hasToken: !!accessToken,
    lastTimestamp: lastProcessedTimestamp,
    maxResults
  });

  try {
    let query = 'in:inbox -in:spam -in:trash';
    
    if (lastProcessedTimestamp) {
      const lastProcessedSeconds = Math.floor(new Date(lastProcessedTimestamp).getTime() / 1000);
      query += ` after:${lastProcessedSeconds}`;
    } else {
      // If no timestamp, get emails from the last 24 hours
      const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      query += ` after:${oneDayAgo}`;
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodedQuery}`;

    console.log('[Gmail pollNewEmails] Query:', query);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail pollNewEmails] API error:', response.status, errorText);
      throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];
    
    console.log(`[Gmail pollNewEmails] Found ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error('[Gmail pollNewEmails] Error polling emails:', error);
    throw error;
  }
};

// Get email details
export const getEmailDetails = async (accessToken: string, messageId: string) => {
  console.log(`[Gmail getEmailDetails] Getting details for message: ${messageId}`);
  
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail getEmailDetails] API error:', response.status, errorText);
      throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Gmail getEmailDetails] Successfully retrieved details for message: ${messageId}`);
    return data;
  } catch (error) {
    console.error('[Gmail getEmailDetails] Error fetching email details:', error);
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
  console.log('[Gmail sendEmailResponse] Sending email response', {
    to: to.substring(0, 20) + '...',
    subject: subject.substring(0, 30) + '...',
    hasThreadId: !!threadId
  });

  try {
    // Create email in RFC 2822 format
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      threadId ? `In-Reply-To: ${threadId}` : '',
      threadId ? `References: ${threadId}` : '',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].filter(line => line !== '').join('\r\n');

    console.log('[Gmail sendEmailResponse] Email format created');

    // Encode email as base64url
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody: any = {
      raw: encodedEmail,
    };

    if (threadId) {
      requestBody.threadId = threadId;
    }

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail sendEmailResponse] API error:', response.status, errorText);
      throw new Error(`Gmail send API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gmail sendEmailResponse] Email sent successfully');
    return data;
  } catch (error) {
    console.error('[Gmail sendEmailResponse] Error sending email:', error);
    throw error;
  }
};

// Simple AI classification (replace with actual AI service)
export const classifyEmail = async (subject: string, body: string): Promise<EmailClassification> => {
  console.log('[Gmail classifyEmail] Classifying email', {
    subjectLength: subject.length,
    bodyLength: body.length
  });

  // Define keywords for each category
  const orderInquiryKeywords = [
    'order status', 'where is my order', 'order number', 'purchase inquiry',
    'invoice request', 'delivery status', 'shipping inquiry', 'product availability',
    'order', 'purchase', 'buy', 'payment', 'invoice', 'receipt', 'delivery',
    'shipping', 'tracking', 'product', 'item'
  ];
  
  const supportRequestKeywords = [
    'help', 'support', 'assistance', 'problem', 'issue', 'error', 'bug',
    'technical support', 'cannot login', 'forgot password', 'broken', 'fix',
    'trouble', 'difficulty', 'not working', 'malfunction', 'repair'
  ];

  const text = (subject + ' ' + body).toLowerCase();
  
  let orderInquiryScore = 0;
  orderInquiryKeywords.forEach(keyword => {
    const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
    orderInquiryScore += matches;
  });
  
  let supportRequestScore = 0;
  supportRequestKeywords.forEach(keyword => {
    const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
    supportRequestScore += matches;
  });
  
  console.log('[Gmail classifyEmail] Scores:', {
    order: orderInquiryScore,
    support: supportRequestScore
  });

  // Determine category based on keyword matches
  if (orderInquiryScore > supportRequestScore && orderInquiryScore > 0) {
    return { category: 'order', confidence: Math.min(orderInquiryScore / 5, 1) };
  } else if (supportRequestScore > orderInquiryScore && supportRequestScore > 0) {
    return { category: 'support', confidence: Math.min(supportRequestScore / 5, 1) };
  } else {
    return { category: 'general', confidence: 0.5 };
  }
};

// Personalize email template
export const personalizeTemplate = (template: string, variables: Record<string, string>) => {
  console.log('[Gmail personalizeTemplate] Personalizing template');

  if (typeof template !== 'string') {
    console.error('[Gmail personalizeTemplate] Template is not a string');
    return template;
  }

  let personalizedTemplate = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    const replacementValue = (typeof value === 'string' || typeof value === 'number') ? String(value) : '';
    personalizedTemplate = personalizedTemplate.replace(
      new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
      replacementValue
    );
  });
  
  console.log('[Gmail personalizeTemplate] Template personalized');
  return personalizedTemplate;
};

// Test Gmail profile API
export const testGmailProfileApi = async (accessToken: string) => {
  console.log("[Gmail testGmailProfileApi] Testing Gmail profile API");
  
  if (!accessToken) {
    throw new Error("Access token is missing for testGmailProfileApi.");
  }
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  console.log('[Gmail testGmailProfileApi] Response Status:', response.status);

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch (e) {
      const textError = await response.text();
      errorDetails = { message: textError || response.statusText };
    }
    throw new Error(`Gmail Profile API Error ${response.status}: ${errorDetails?.error?.message || errorDetails.message || response.statusText}`);
  }

  const profileData = await response.json();
  console.log("[Gmail testGmailProfileApi] Profile fetched successfully");
  return profileData;
};