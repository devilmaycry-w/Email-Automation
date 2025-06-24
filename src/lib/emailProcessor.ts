import stringSimilarity from 'string-similarity';
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
  getRecentEmailLogs,
  type EmailTemplate,
  type User,
  type EmailLog
} from './supabase';

// Helper functions for Base64URL and UTF-8 decoding (Browser-compatible)
function base64UrlDecodeToBinaryString(base64Url: string): string {
  if (typeof base64Url !== 'string') return '';
  if (!base64Url) return '';
  let standardBase64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (standardBase64.length % 4) {
    standardBase64 += '=';
  }
  try {
    return atob(standardBase64);
  } catch {
    return '';
  }
}

function binaryStringToUtf8String(binaryString: string): string {
  if (typeof binaryString !== 'string') return '';
  if (!binaryString) return '';
  try {
    const uint8Array = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  } catch {
    return binaryString;
  }
}

const extractNameFromEmail = (emailSender: string): string => {
  if (!emailSender) return 'Customer';
  const match = emailSender.match(/^(.*?)\s*<.*>$/);
  if (match && match[1]) return match[1].trim();
  const emailPart = emailSender.split('@')[0];
  return emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const extractEmailAddress = (emailSender: string): string => {
  if (!emailSender) return '';
  const match = emailSender.match(/<(.+?)>/);
  if (match && match[1]) return match[1].trim();
  return emailSender.trim();
};

const extractEmailBody = (payload: any): string => {
  let bodyText = '';
  const processPart = (part: any): string => {
    if (!part) return '';
    if (part.parts && Array.isArray(part.parts)) {
      const plainPart = part.parts.find((p: any) => p.mimeType === 'text/plain');
      if (plainPart) {
        const result = processPart(plainPart);
        if (result) return result;
      }
      const htmlPart = part.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart) {
        const result = processPart(htmlPart);
        if (result) return result;
      }
      for (const subPart of part.parts) {
        const result = processPart(subPart);
        if (result) return result;
      }
    }
    if (part.body && part.body.data && typeof part.body.data === 'string' && part.body.data.length > 0) {
      try {
        const decodedBinary = base64UrlDecodeToBinaryString(part.body.data);
        if (!decodedBinary) return '';
        let decodedText = binaryStringToUtf8String(decodedBinary);
        if (part.mimeType === 'text/html') {
          decodedText = decodedText
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }
        return decodedText;
      } catch {
        return '';
      }
    }
    return '';
  };
  if (payload.parts && Array.isArray(payload.parts)) {
    const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (plainPart) bodyText = processPart(plainPart);
    if (!bodyText) {
      const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart) bodyText = processPart(htmlPart);
    }
    if (!bodyText) {
      for (const part of payload.parts) {
        bodyText = processPart(part);
        if (bodyText) break;
      }
    }
  } else {
    bodyText = processPart(payload);
  }
  return bodyText;
};

const isSimilarToRecent = (
  currentSubject: string,
  currentBody: string,
  recentLogs: EmailLog[],
  threshold = 0.85
) => {
  for (const log of recentLogs) {
    const subjectSimilarity = stringSimilarity.compareTwoStrings(currentSubject, log.subject || '');
    const bodySimilarity = stringSimilarity.compareTwoStrings(
      (currentBody || '').slice(0, 2000),
      (log.body || '').slice(0, 2000)
    );
    if (subjectSimilarity > threshold || bodySimilarity > threshold) {
      return true;
    }
  }
  return false;
};

export const processInbox = async (
  userId: string,
  lastPollTimestamp?: string
): Promise<{ processedCount: number; newLastPollTimestamp: string; error?: string }> => {
  let processedCount = 0;
  const currentPollTime = new Date().toISOString();

  try {
    const user = await getCurrentUser();
    if (user?.manual_override_active) {
      return { processedCount: 0, newLastPollTimestamp: lastPollTimestamp || currentPollTime };
    }

    const gmailConfig = {
      clientId: import.meta.env.VITE_GMAIL_CLIENT_ID!,
      clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET!,
      redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI!
    };

    const { getValidAccessToken } = await import('./supabase');
    const validAccessToken = await getValidAccessToken(userId, gmailConfig);

    if (!validAccessToken) {
      return { processedCount: 0, newLastPollTimestamp: lastPollTimestamp || currentPollTime, error: 'No valid Gmail access token' };
    }

    const messages = await pollNewEmails(validAccessToken, lastPollTimestamp);
    if (!messages || messages.length === 0) {
      return { processedCount: 0, newLastPollTimestamp: currentPollTime };
    }

    const allTemplates = await getTemplates(userId);
    const activeTemplates = allTemplates.filter(t => t.is_active);

    if (activeTemplates.length === 0) {
      return { processedCount: 0, newLastPollTimestamp: currentPollTime };
    }

    for (const message of messages) {
      try {
        const emailDetails = await getEmailDetails(validAccessToken, message.id);
        if (!emailDetails || !emailDetails.payload) continue;

        const headers = emailDetails.payload.headers || [];
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
        const messageIdHeader = headers.find((h: any) => h.name.toLowerCase() === 'message-id');

        const subject = subjectHeader?.value || 'No Subject';
        const senderEmail = fromHeader?.value || 'Unknown Sender';
        const cleanSenderEmail = extractEmailAddress(senderEmail);
        const gmailMessageId = messageIdHeader?.value || message.id;

        const bodyText = extractEmailBody(emailDetails.payload);

        // Smart duplicate check (subject/body similarity)
        const recentLogs = await getRecentEmailLogs(userId, cleanSenderEmail, 24, 5);
        if (isSimilarToRecent(subject, bodyText, recentLogs)) {
          await logEmailProcessing({
            gmail_message_id: gmailMessageId,
            sender_email: cleanSenderEmail,
            subject: subject,
            body: bodyText,
            category: 'general',
            confidence_score: 0,
            response_sent: false,
            response_template_id: undefined,
            processed_at: new Date().toISOString(),
          }, userId);
          processedCount++;
          continue;
        }

        // Fallback: 24h "already responded" block
        const hasRecent = await hasRecentResponse(userId, cleanSenderEmail, 24);
        if (hasRecent) {
          await logEmailProcessing({
            gmail_message_id: gmailMessageId,
            sender_email: cleanSenderEmail,
            subject: subject,
            body: bodyText,
            category: 'general',
            confidence_score: 0,
            response_sent: false,
            response_template_id: undefined,
            processed_at: new Date().toISOString(),
          }, userId);
          processedCount++;
          continue;
        }

        if (!bodyText || bodyText.trim().length === 0) {
          await logEmailProcessing({
            gmail_message_id: gmailMessageId,
            sender_email: cleanSenderEmail,
            subject: subject,
            body: bodyText,
            category: 'general',
            confidence_score: 0,
            response_sent: false,
            response_template_id: undefined,
            processed_at: new Date().toISOString(),
          }, userId);
          continue;
        }

        const classification: EmailClassification = await classifyEmail(subject, bodyText);

        let template = activeTemplates.find(t => t.category === classification.category);
        let usedFallback = false;
        if (!template) {
          template = activeTemplates.find(t => t.category === 'general');
          usedFallback = true;
        }

        let responseSent = false;
        let templateIdUsed: string | undefined = template?.id;

        if (template) {
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
          } catch {}
        }

        await logEmailProcessing({
          gmail_message_id: gmailMessageId,
          sender_email: cleanSenderEmail,
          subject: subject,
          body: bodyText,
          category: usedFallback ? 'general' : classification.category,
          confidence_score: classification.confidence,
          response_sent: responseSent,
          response_template_id: templateIdUsed,
          processed_at: new Date().toISOString(),
        }, userId);
        processedCount++;

      } catch {
        // Optionally: log error
      }
    }

    return { processedCount, newLastPollTimestamp: currentPollTime };

  } catch (error) {
    return { 
      processedCount: 0, 
      newLastPollTimestamp: lastPollTimestamp || currentPollTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};