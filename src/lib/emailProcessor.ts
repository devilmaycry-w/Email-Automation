import {
  pollNewEmails,
  getEmailDetails,
  classifyEmail,
  sendEmailResponse,
  personalizeTemplate as gmailPersonalizeTemplate,
  type EmailClassification
} from './gmail';
import {
  getTemplates,
  logEmailProcessing,
  getCurrentUser,
  hasRecentResponse,
  type EmailTemplate,
  type User,
  type EmailLog
} from './supabase';

// Helper functions for Base64URL and UTF-8 decoding (Browser-compatible)
function base64UrlDecodeToBinaryString(base64Url: string): string {
  if (typeof base64Url !== 'string') {
    console.error('[EmailProcessor base64UrlDecodeToBinaryString] Input was not a string:', typeof base64Url);
    return '';
  }
  if (!base64Url) return '';
  
  let standardBase64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if necessary
  while (standardBase64.length % 4) {
    standardBase64 += '=';
  }
  
  try {
    return atob(standardBase64);
  } catch (e) {
    console.error('[EmailProcessor base64UrlDecodeToBinaryString] Error in atob decoding:', e);
    return '';
  }
}

function binaryStringToUtf8String(binaryString: string): string {
  if (typeof binaryString !== 'string') {
    console.error('[EmailProcessor binaryStringToUtf8String] Input was not a string:', typeof binaryString);
    return '';
  }
  if (!binaryString) return '';
  
  try {
    const uint8Array = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  } catch (e) {
    console.error('[EmailProcessor binaryStringToUtf8String] Error in TextDecoder:', e);
    // Fallback: return the binary string as-is if UTF-8 decoding fails
    return binaryString;
  }
}

// Helper to extract name from email string
const extractNameFromEmail = (emailSender: string): string => {
  if (!emailSender) return 'Customer';
  
  // Example: "John Doe <john.doe@example.com>"
  const match = emailSender.match(/^(.*?)\s*<.*>$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Example: "john.doe@example.com"
  const emailPart = emailSender.split('@')[0];
  return emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper to extract clean email address from sender string
const extractEmailAddress = (emailSender: string): string => {
  if (!emailSender) return '';
  
  // Example: "John Doe <john.doe@example.com>"
  const match = emailSender.match(/<(.+?)>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no angle brackets, assume the whole string is the email
  return emailSender.trim();
};

// Enhanced email body extraction with better multipart handling
const extractEmailBody = (payload: any): string => {
  console.log('[EmailProcessor extractEmailBody] Processing payload structure:', {
    hasParts: !!payload.parts,
    hasBody: !!payload.body,
    mimeType: payload.mimeType,
    partsCount: payload.parts?.length || 0
  });

  let bodyText = '';

  const processPart = (part: any, partIdentifier: string): string => {
    if (!part) return '';
    
    console.log(`[EmailProcessor extractEmailBody] Processing ${partIdentifier}:`, {
      mimeType: part.mimeType,
      hasBody: !!part.body,
      hasData: !!part.body?.data,
      dataLength: part.body?.data?.length || 0,
      hasParts: !!part.parts
    });

    // Handle nested parts (multipart/alternative, multipart/mixed, etc.)
    if (part.parts && Array.isArray(part.parts)) {
      // Try to find text/plain first, then text/html
      const plainPart = part.parts.find((p: any) => p.mimeType === 'text/plain');
      if (plainPart) {
        const result = processPart(plainPart, `${partIdentifier} > text/plain`);
        if (result) return result;
      }
      
      const htmlPart = part.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart) {
        const result = processPart(htmlPart, `${partIdentifier} > text/html`);
        if (result) return result;
      }
      
      // If no text parts found, try any part recursively
      for (const subPart of part.parts) {
        const result = processPart(subPart, `${partIdentifier} > ${subPart.mimeType}`);
        if (result) return result;
      }
    }

    // Process body data if available
    if (part.body && part.body.data && typeof part.body.data === 'string' && part.body.data.length > 0) {
      try {
        const decodedBinary = base64UrlDecodeToBinaryString(part.body.data);
        if (!decodedBinary) {
          console.warn(`[EmailProcessor extractEmailBody] Failed to decode ${partIdentifier}`);
          return '';
        }

        let decodedText = binaryStringToUtf8String(decodedBinary);
        
        // Enhanced HTML stripping for better text extraction
        if (part.mimeType === 'text/html') {
          decodedText = decodedText
            // Remove style and script tags completely
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            // Convert common HTML elements to text equivalents
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            // Remove all remaining HTML tags
            .replace(/<[^>]+>/g, ' ')
            // Decode HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }

        console.log(`[EmailProcessor extractEmailBody] Successfully decoded ${partIdentifier}, length: ${decodedText.length}`);
        return decodedText;
      } catch (error) {
        console.error(`[EmailProcessor extractEmailBody] Error processing ${partIdentifier}:`, error);
        return '';
      }
    }

    return '';
  };

  if (payload.parts && Array.isArray(payload.parts)) {
    // Multipart email - prefer text/plain, fallback to text/html
    const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plainPart) {
      bodyText = processPart(plainPart, 'text/plain part');
    }

    if (!bodyText) {
      const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart) {
        bodyText = processPart(htmlPart, 'text/html part');
      }
    }

    // If still no body, try any part with body data
    if (!bodyText) {
      for (const part of payload.parts) {
        bodyText = processPart(part, `fallback part (${part.mimeType})`);
        if (bodyText) break;
      }
    }
  } else {
    // Single part email
    bodyText = processPart(payload, 'single part body');
  }

  console.log(`[EmailProcessor extractEmailBody] Final body text length: ${bodyText.length}`);
  return bodyText;
};

export const processInbox = async (
  userId: string,
  lastPollTimestamp?: string
): Promise<{ processedCount: number; newLastPollTimestamp: string; error?: string }> => {
  console.log(`[EmailProcessor processInbox] Starting for user ${userId}, lastPoll: ${lastPollTimestamp}`);
  
  let processedCount = 0;
  const currentPollTime = new Date().toISOString();

  try {
    // Check manual override status
    const user = await getCurrentUser();
    if (user?.manual_override_active) {
      console.log('[EmailProcessor processInbox] Manual override is active. Skipping processing.');
      return { processedCount: 0, newLastPollTimestamp: lastPollTimestamp || currentPollTime };
    }

    // Get valid access token
    const gmailConfig = {
      clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
      clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
      redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
    };

    const { getValidAccessToken } = await import('./supabase');
    const validAccessToken = await getValidAccessToken(userId, gmailConfig);

    if (!validAccessToken) {
      console.error('[EmailProcessor processInbox] No valid access token available');
      return { 
        processedCount: 0, 
        newLastPollTimestamp: lastPollTimestamp || currentPollTime, 
        error: 'No valid Gmail access token' 
      };
    }

    // Poll for new emails
    const messages = await pollNewEmails(validAccessToken, lastPollTimestamp);
    
    if (!messages || messages.length === 0) {
      console.log('[EmailProcessor processInbox] No new messages found');
      return { processedCount: 0, newLastPollTimestamp: currentPollTime };
    }

    console.log(`[EmailProcessor processInbox] Found ${messages.length} new messages`);

    // Get active templates
    const allTemplates = await getTemplates(userId);
    const activeTemplates = allTemplates.filter(t => t.is_active);

    if (activeTemplates.length === 0) {
      console.warn('[EmailProcessor processInbox] No active templates found');
      return { processedCount: 0, newLastPollTimestamp: currentPollTime };
    }

    // Process each message
    for (const message of messages) {
      try {
        console.log(`[EmailProcessor processInbox] Processing message ${message.id}`);
        
        // Get email details
        const emailDetails = await getEmailDetails(validAccessToken, message.id);
        if (!emailDetails || !emailDetails.payload) {
          console.warn(`[EmailProcessor processInbox] Could not get details for message ${message.id}`);
          continue;
        }

        // Extract headers
        const headers = emailDetails.payload.headers || [];
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
        const messageIdHeader = headers.find((h: any) => h.name.toLowerCase() === 'message-id');

        const subject = subjectHeader?.value || 'No Subject';
        const senderEmail = fromHeader?.value || 'Unknown Sender';
        const cleanSenderEmail = extractEmailAddress(senderEmail);
        const gmailMessageId = messageIdHeader?.value || message.id;

        console.log(`[EmailProcessor processInbox] Email details:`, {
          subject: subject.substring(0, 50),
          sender: senderEmail,
          cleanSender: cleanSenderEmail,
          messageId: gmailMessageId
        });

        // Check for duplicate responses (prevent sending multiple responses to same sender)
        const hasRecent = await hasRecentResponse(userId, cleanSenderEmail, 24); // 24 hours threshold
        if (hasRecent) {
          console.log(`[EmailProcessor processInbox] Skipping ${cleanSenderEmail} - already responded recently`);
          
          // Log the skipped email
          await logEmailProcessing({
            gmail_message_id: gmailMessageId,
            sender_email: cleanSenderEmail,
            subject: subject,
            category: 'general',
            confidence_score: 0,
            response_sent: false,
            response_template_id: undefined,
            processed_at: new Date().toISOString(),
          }, userId);
          
          processedCount++;
          continue;
        }

        // Extract email body
        const bodyText = extractEmailBody(emailDetails.payload);

        if (!bodyText || bodyText.trim().length === 0) {
          console.warn(`[EmailProcessor processInbox] Empty body for message ${message.id}, skipping`);
          
          // Log the skipped email
          await logEmailProcessing({
            gmail_message_id: gmailMessageId,
            sender_email: cleanSenderEmail,
            subject: subject,
            category: 'general',
            confidence_score: 0,
            response_sent: false,
            response_template_id: undefined,
            processed_at: new Date().toISOString(),
          }, userId);
          
          continue;
        }

        // Classify email
        const classification: EmailClassification = await classifyEmail(subject, bodyText);
        console.log(`[EmailProcessor processInbox] Classification:`, classification);

        // Find matching template
        // Find matching template for classified category
let template = activeTemplates.find(t => t.category === classification.category);

// Fallback: Use 'general' template if no match found
let usedFallback = false;
if (!template) {
  template = activeTemplates.find(t => t.category === 'general');
  usedFallback = true;
}

let responseSent = false;
let templateIdUsed: string | undefined = template?.id;

if (template) {
  // Personalize as before
  const extractedName = extractNameFromEmail(senderEmail);
  const variables: Record<string, string> = {
    Name: extractedName,
    Email: cleanSenderEmail,
    Subject: subject,
    TicketID: message.threadId || message.id,
    OrderNumber: 'N/A'
  };

  let personalizedSubject = gmailPersonalizeTemplate(template.subject, variables);
  let personalizedBody = gmailPersonalizeTemplate(template.body, variables);

  // Optionally, note fallback in the body/subject
  if (usedFallback) {
    personalizedBody = `[Automated note: No template for "${classification.category}", using general reply.]\n\n` + personalizedBody;
  }

  try {
    await sendEmailResponse(
      validAccessToken,
      cleanSenderEmail,
      personalizedSubject,
      personalizedBody,
      message.threadId
    );
    responseSent = true;
    console.log(`[EmailProcessor processInbox] Successfully sent reply for message ${message.id}`);
  } catch (sendError) {
    console.error(`[EmailProcessor processInbox] Failed to send reply for message ${message.id}:`, sendError);
  }
} else {
  console.warn(`[EmailProcessor processInbox] No matching or fallback template found. No response sent.`);
}

// Log processing, noting fallback
const logEntry: Omit<EmailLog, 'id' | 'created_at' | 'user_id'> = {
  gmail_message_id: gmailMessageId,
  sender_email: cleanSenderEmail,
  subject: subject,
  category: classification.category + (usedFallback ? ' (fallback to general)' : ''),
  confidence_score: classification.confidence,
  response_sent: responseSent,
  response_template_id: templateIdUsed,
  processed_at: new Date().toISOString(),
};

await logEmailProcessing(logEntry, userId);
        processedCount++;

        console.log(`[EmailProcessor processInbox] Successfully processed message ${message.id}`);

      } catch (error) {
        console.error(`[EmailProcessor processInbox] Error processing message ${message.id}:`, error);
        
        // Log error
        try {
          await logEmailProcessing({
            gmail_message_id: message.id,
            sender_email: 'Error during processing',
            subject: 'Error during processing',
            category: 'general',
            confidence_score: 0,
            response_sent: false,
            processed_at: new Date().toISOString(),
          }, userId);
        } catch (logError) {
          console.error(`[EmailProcessor processInbox] Failed to log error for message ${message.id}:`, logError);
        }
      }
    }

    console.log(`[EmailProcessor processInbox] Completed processing ${processedCount} messages`);
    return { processedCount, newLastPollTimestamp: currentPollTime };

  } catch (error) {
    console.error(`[EmailProcessor processInbox] Fatal error:`, error);
    return { 
      processedCount: 0, 
      newLastPollTimestamp: lastPollTimestamp || currentPollTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
