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

// Fetch emails from Gmail
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

// Get email details
export const getEmailDetails = async (accessToken: string, messageId: string) => {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
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
    return data;
  } catch (error) {
    console.error('Error fetching email details:', error);
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending email response:', error);
    throw error;
  }
};

// Simple AI classification (replace with actual AI service)
export const classifyEmail = async (subject: string, body: string): Promise<EmailClassification> => {
  // Mock AI classification - replace with actual AI service like Hugging Face
  const orderKeywords = ['order', 'purchase', 'buy', 'payment', 'invoice', 'delivery', 'shipping', 'product', 'item'];
  const supportKeywords = ['help', 'support', 'problem', 'issue', 'error', 'bug', 'broken', 'fix', 'trouble'];
  
  const text = (subject + ' ' + body).toLowerCase();
  
  let orderScore = 0;
  let supportScore = 0;
  
  orderKeywords.forEach(keyword => {
    if (text.includes(keyword)) orderScore++;
  });
  
  supportKeywords.forEach(keyword => {
    if (text.includes(keyword)) supportScore++;
  });
  
  if (orderScore > supportScore && orderScore > 0) {
    return { category: 'order', confidence: Math.min(orderScore / orderKeywords.length, 1) };
  } else if (supportScore > 0) {
    return { category: 'support', confidence: Math.min(supportScore / supportKeywords.length, 1) };
  } else {
    return { category: 'general', confidence: 0.5 };
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