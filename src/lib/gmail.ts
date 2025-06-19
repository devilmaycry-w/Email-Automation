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
  // Avoid logging clientSecret directly for security, but confirm its presence if needed.
  if (!config.clientSecret) {
    console.warn('[gmail.ts] exchangeCodeForToken: Client Secret is missing!');
  } else {
    console.log('[gmail.ts] exchangeCodeForToken: Client Secret is present (not logging value).');
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
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    console.log('[gmail.ts] exchangeCodeForToken: Response Status:', response.status);
    console.log('[gmail.ts] exchangeCodeForToken: Response Status Text:', response.statusText);

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
    console.log('[gmail.ts] exchangeCodeForToken: Successfully exchanged code for token. Response data:', data);
    return data;
  } catch (error) {
    console.error('[gmail.ts] exchangeCodeForToken: Error during token exchange process:', error);
    return null;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string, config: GmailConfig): Promise<GmailTokenResponse | null> => {
  console.log(`[Gmail refreshAccessToken] Called. Config redirectUri: ${config.redirectUri}, Refresh token present: ${!!refreshToken}`);

  if (!refreshToken) {
    console.warn('[Gmail refreshAccessToken] Refresh token is missing! Cannot proceed.');
    return null;
  }
  if (!config.clientId) {
    console.warn('[Gmail refreshAccessToken] Client ID is missing in config! Cannot proceed.');
    return null;
  }
  if (!config.clientSecret) {
    console.warn('[Gmail refreshAccessToken] Client Secret is missing in config! Cannot proceed.');
    // Technically, some OAuth flows might not require client_secret for refresh token grant,
    // but Google's typically does for web server flows. Better to check.
  }

  const requestBody = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret, // This will be sent in the body
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  console.log('[Gmail refreshAccessToken] Request body to Google (client_secret presence indicated, refresh_token presence indicated):',
    `client_id=${config.clientId}&client_secret=${config.clientSecret ? 'PRESENT' : 'MISSING'}&refresh_token=${refreshToken ? 'PRESENT' : 'MISSING'}&grant_type=refresh_token`
  );

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    console.log('[Gmail refreshAccessToken] Google API response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorDataFromGoogle = null;
      try {
        errorDataFromGoogle = await response.json();
      } catch (e) {
        const textError = await response.text();
        errorDataFromGoogle = { error: 'non_json_response', details: textError };
      }
      console.error('[Gmail refreshAccessToken] Google API error during refresh. Status:', response.status, 'Error data from Google:', errorDataFromGoogle);
      // Specific error handling for invalid_grant can be done by the caller (getValidAccessToken) based on the null return.
      throw new Error(`HTTP error! status: ${response.status}, Google Error: ${JSON.stringify(errorDataFromGoogle)}`);
    }

    const dataFromGoogle: GmailTokenResponse = await response.json();
    console.log('[Gmail refreshAccessToken] Refresh successful. New token data from Google (sanitized):', {
      access_token_present: !!dataFromGoogle.access_token,
      expires_in: dataFromGoogle.expires_in,
      scope: dataFromGoogle.scope,
      token_type: dataFromGoogle.token_type,
      refresh_token_returned: !!dataFromGoogle.refresh_token
    });
    return dataFromGoogle;
  } catch (error) {
    // Log the caught error which might be the one thrown above or a network error
    console.error('[Gmail refreshAccessToken] Error during token refresh fetch/processing:', error);
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
  console.log('[sendEmailResponse] Function called with:');
  console.log('[sendEmailResponse] To:', to);
  console.log('[sendEmailResponse] Subject:', subject);
  console.log('[sendEmailResponse] Body (type):', typeof body);
  console.log('[sendEmailResponse] Body (snippet):', (typeof body === 'string' ? body.substring(0, 200) : 'Body is not a string or is null/undefined'));
  console.log('[sendEmailResponse] Thread ID:', threadId);

  try {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      threadId ? `In-Reply-To: ${threadId}` : '',
      'Content-Type: text/html; charset=utf-8', // Assuming body is HTML, adjust if plain text
      '',
      body,
    ].join('\n');

    console.log('[sendEmailResponse] Raw email string before btoa (snippet):', email.substring(0, 500));

    let encodedEmail;
    try {
      // Note: btoa can throw if string contains chars outside Latin1 range.
      // Ensure `body` and `subject` are properly encoded if they can contain arbitrary Unicode.
      // For this task, we are logging and catching. A more robust solution might involve UTF-8 to Base64 direct conversion.
      encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');
    } catch (btoaError: any) {
      console.error('[sendEmailResponse] Error during btoa() encoding:', btoaError);
      console.error('[sendEmailResponse] Email string that caused btoa error (snippet):', email.substring(0, 500));
      throw new Error('Failed to base64 encode email content: ' + btoaError.message);
    }

    console.log('[sendEmailResponse] Encoded email (first 100 chars):', encodedEmail.substring(0,100));


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
  console.log('[personalizeTemplate] Called with template (snippet):', typeof template === 'string' ? template.substring(0, 300) : 'Template is not a string or is null/undefined');
  console.log('[personalizeTemplate] Variables:', variables);

  let personalizedTemplate = template;
  
  if (typeof template !== 'string') {
    console.error('[personalizeTemplate] Error: Input template is not a string. Returning original input.');
    return template; // Or handle error appropriately
  }
  if (typeof variables !== 'object' || variables === null) {
    console.error('[personalizeTemplate] Error: Input variables is not an object or is null. Returning original template string.');
    return template; // Or handle error appropriately
  }

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `[${key}]`;
    // Ensure value is a string for replacement, default to empty string if not.
    const replacementValue = (typeof value === 'string' || typeof value === 'number') ? String(value) : '';
    if (typeof value !== 'string' && typeof value !== 'number' && value !== undefined && value !== null) {
        console.warn(`[personalizeTemplate] Variable '${key}' has a non-primitive type (${typeof value}), using empty string for replacement.`);
    }
    personalizedTemplate = personalizedTemplate.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacementValue);
  });
  
  console.log('[personalizeTemplate] Personalized template (snippet):', typeof personalizedTemplate === 'string' ? personalizedTemplate.substring(0, 300) : 'Personalized template is not a string or is null/undefined');
  return personalizedTemplate;
};

export const testGmailProfileApi = async (accessToken: string) => {
  console.log("[gmail.ts testGmailProfileApi] Fetching user's Gmail profile. Token Present:", !!accessToken);
  if (!accessToken) {
    throw new Error("Access token is missing for testGmailProfileApi.");
  }
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  console.log('[gmail.ts testGmailProfileApi] Response Status:', response.status, response.statusText);

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
      console.error(`[gmail.ts testGmailProfileApi] API Error ${response.status} response body:`, errorDetails);
    } catch (e) {
      const textError = await response.text();
      console.error(`[gmail.ts testGmailProfileApi] API Error ${response.status} response body (not JSON):`, textError);
      errorDetails = { message: textError || response.statusText };
    }
    throw new Error(`Gmail Profile API Error ${response.status}: ${errorDetails?.error?.message || errorDetails.message || response.statusText}`);
  }

  const profileData = await response.json();
  console.log("[gmail.ts testGmailProfileApi] Successfully fetched profile:", profileData);
  return profileData;
};