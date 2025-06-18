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

    const response = await fetch(url,
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
    // data.messages is a list of {id, threadId}.
    // data.resultSizeEstimate might be 0 if no new emails.
    return data.messages || [];
  } catch (error) {
    console.error('Error polling new emails:', error);
    throw error; // Rethrow to be handled by the caller
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
    if (text.includes(keyword)) orderInquiryScore++;
  });
  
  let supportRequestScore = 0;
  supportRequestKeywords.forEach(keyword => {
    if (text.includes(keyword)) supportRequestScore++;
  });
  
  // Determine category based on keyword matches
  // If both scores are 0, or they are equal but low, it's general.
  // Otherwise, the higher score determines the category.
  if (orderInquiryScore > supportRequestScore && orderInquiryScore > 0) {
    return { category: 'order', confidence: orderInquiryScore };
  } else if (supportRequestScore > orderInquiryScore && supportRequestScore > 0) {
    return { category: 'support', confidence: supportRequestScore };
  } else if (orderInquiryScore > 0 && orderInquiryScore === supportRequestScore) {
    // If scores are equal and positive, could be either, let's default to support for now or add more logic
    // For now, let's prioritize support if scores are equal and positive.
    // Or, we can sum them up for a general category if that makes more sense.
    // Sticking to the prompt, highest score wins, if equal, one must be chosen or be general.
    // Let's make it 'general' if scores are equal and positive but low, or default to one.
    // For simplicity, if scores are equal and positive, let's call it 'general' for now.
    // This part could be refined based on business rules.
    // Let's re-evaluate: if one category has significantly more keywords, its score might naturally be higher.
    // The request is "simple count of keyword matches".
    // If orderInquiryScore is 1 and supportRequestScore is 1, it's ambiguous.
    // Let's say if scores are equal but positive, it's general.
    return { category: 'general', confidence: orderInquiryScore + supportRequestScore }; // Sum of matches as confidence
  } else { // Covers cases where both scores are 0
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