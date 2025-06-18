import {
  pollNewEmails,
  getEmailDetails,
  classifyEmail,
  sendEmailResponse,
  personalizeTemplate as gmailPersonalizeTemplate, // Renaming to avoid conflict
  type EmailClassification
} from './gmail';
import {
  getTemplates,
  logEmailProcessing,
  getCurrentUser,           // Added for checking manual override status
  updateUserLastPollTimestamp, // Added for updating last poll timestamp
  type EmailTemplate,
  type User,
  type EmailLog
} from './supabase';

// Helper to extract name from email string (simple version)
const extractNameFromEmail = (emailSender: string): string => {
  if (!emailSender) return 'Customer';
  // Example: "John Doe <john.doe@example.com>"
  const match = emailSender.match(/^(.*?)\s*<.*>$/);
  if (match && match[1]) {
    return match[1].trim(); // "John Doe"
  }
  // Example: "john.doe@example.com"
  const emailPart = emailSender.split('@')[0];
  // Capitalize first letter and remove common separators
  return emailPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const processInbox = async (
  userId: string,
  accessToken: string,
  lastPollTimestamp?: string // Accept lastPollTimestamp as parameter
): Promise<{ processedCount: number; newLastPollTimestamp: string }> => {
  let processedCount = 0;
  const currentPollTime = new Date().toISOString();

  try {
    console.log(`[EmailProcessor] Starting inbox processing for user ${userId}`);
    console.log(`[EmailProcessor] Last poll timestamp: ${lastPollTimestamp || 'none'}`);

    // 0. Check manual override status first
    const user = await getCurrentUser(); // Assuming this fetches the user including manual_override_active
    if (user?.manual_override_active) {
      console.log(`[EmailProcessor] User ${userId} has manual override enabled. Skipping automated processing.`);
      return { processedCount: 0, newLastPollTimestamp: lastPollTimestamp || currentPollTime };
    }

    // 1. Poll for new emails
    console.log(`[EmailProcessor] Polling for new emails...`);
    const messages = await pollNewEmails(accessToken, lastPollTimestamp);

    if (!messages || messages.length === 0) {
      console.log(`[EmailProcessor] No new messages for user ${userId} since ${lastPollTimestamp || 'the beginning'}.`);
      // Update timestamp even if no messages to avoid re-checking the same period
      await updateUserLastPollTimestamp(userId, currentPollTime);
      return { processedCount: 0, newLastPollTimestamp: currentPollTime };
    }

    console.log(`[EmailProcessor] Fetched ${messages.length} new messages for user ${userId}.`);

    // 2. Get active templates for the user
    const allTemplates = await getTemplates(userId);
    const activeTemplates = allTemplates.filter(t => t.is_active);

    if (activeTemplates.length === 0) {
      console.warn(`[EmailProcessor] No active templates found for user ${userId}. Cannot process emails.`);
      // Update timestamp even if no templates to avoid re-checking
      await updateUserLastPollTimestamp(userId, currentPollTime);
      return { processedCount: 0, newLastPollTimestamp: currentPollTime };
    }

    console.log(`[EmailProcessor] Found ${activeTemplates.length} active templates`);

    for (const message of messages) {
      try {
        console.log(`[EmailProcessor] Processing message ID: ${message.id}`);

        // 3. Get email details
        const emailDetails = await getEmailDetails(accessToken, message.id);
        if (!emailDetails || !emailDetails.payload) {
          console.warn(`[EmailProcessor] Could not retrieve details for message ID: ${message.id}`);
          continue;
        }

        const headers = emailDetails.payload.headers;
        const subjectHeader = headers.find((h:any) => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find((h:any) => h.name.toLowerCase() === 'from');
        const messageIdHeader = headers.find((h:any) => h.name.toLowerCase() === 'message-id');

        const subject = subjectHeader ? subjectHeader.value : 'No Subject';
        const senderEmail = fromHeader ? fromHeader.value : 'Unknown Sender';
        const gmailMessageId = messageIdHeader ? messageIdHeader.value : message.id; // Use API message ID if header is missing

        console.log(`[EmailProcessor] Email details - Subject: "${subject}", From: "${senderEmail}"`);

        // Extract body (simplistic, might need improvement for multipart emails)
        let body = '';
        if (emailDetails.payload.parts) {
          const part = emailDetails.payload.parts.find((p:any) => p.mimeType === 'text/plain');
          if (part && part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          } else { // Fallback to html part if plain text not found
            const htmlPart = emailDetails.payload.parts.find((p:any) => p.mimeType === 'text/html');
            if (htmlPart && htmlPart.body && htmlPart.body.data) {
               // Basic HTML to text conversion for now
              body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
              body = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          }
        } else if (emailDetails.payload.body && emailDetails.payload.body.data) {
          body = Buffer.from(emailDetails.payload.body.data, 'base64').toString('utf-8');
           if (emailDetails.payload.mimeType === 'text/html') {
             body = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
           }
        }

        if (!body) {
            console.log(`[EmailProcessor] Email ${message.id} has no parsable body content. Skipping.`);
            // Optionally log this skipped email with minimal info
            await logEmailProcessing({
              gmail_message_id: gmailMessageId,
              sender_email: senderEmail,
              subject: subject,
              category: 'general', // Default category for logging
              confidence_score: 0,
              response_sent: false,
              response_template_id: undefined,
              processed_at: new Date().toISOString(),
              // error_message: "No parsable body content" // Could add an error field to logs
            }, userId);
            continue;
        }

        console.log(`[EmailProcessor] Email body extracted (${body.length} characters)`);

        // 4. Classify email
        const classification: EmailClassification = await classifyEmail(subject, body);
        console.log(`[EmailProcessor] Email classified as: ${classification.category} (confidence: ${classification.confidence})`);

        // 5. Select template
        const template = activeTemplates.find(t => t.category === classification.category);

        let responseSent = false;
        let templateIdUsed: string | undefined = undefined;

        if (template) {
          templateIdUsed = template.id;
          console.log(`[EmailProcessor] Found template for category: ${classification.category}`);
          
          // 6. Personalize template
          const extractedName = extractNameFromEmail(senderEmail);
          const variables: Record<string, string> = {
            Name: extractedName,
            Email: senderEmail, // The sender's email
            Subject: subject,
            TicketID: message.threadId, // Using threadId as a TicketID proxy
            OrderNumber: 'N/A' // Placeholder, real order number extraction would be complex
          };
          const personalizedSubject = gmailPersonalizeTemplate(template.subject, variables);
          const personalizedBody = gmailPersonalizeTemplate(template.body, variables);

          console.log(`[EmailProcessor] Template personalized for ${extractedName}`);

          // 7. Send reply
          try {
            await sendEmailResponse(
              accessToken,
              senderEmail, // Send back to the original sender
              personalizedSubject,
              personalizedBody,
              message.threadId // Reply in the same thread
            );
            responseSent = true;
            console.log(`[EmailProcessor] Successfully replied to email: ${subject} from ${senderEmail}`);
          } catch (sendError) {
            console.error(`[EmailProcessor] Error sending reply for message ID ${message.id}:`, sendError);
            // Log this error if needed, responseSent remains false
          }
        } else {
          console.log(`[EmailProcessor] No active template found for category: ${classification.category} for email: ${subject}`);
        }

        // 8. Log processing
        const logEntry: Omit<EmailLog, 'id' | 'created_at' | 'user_id'> = {
          gmail_message_id: gmailMessageId,
          sender_email: senderEmail,
          subject: subject,
          category: classification.category,
          confidence_score: classification.confidence,
          response_sent: responseSent,
          response_template_id: templateIdUsed,
          processed_at: new Date(emailDetails.internalDate || Date.now()).toISOString(),
        };
        await logEmailProcessing(logEntry, userId);

        processedCount++;
        console.log(`[EmailProcessor] Successfully processed email ${processedCount}/${messages.length}`);

      } catch (error) {
        console.error(`[EmailProcessor] Error processing message ID ${message.id}:`, error);
        // Optionally log error to a specific error log or the main log with an error field
        try {
          await logEmailProcessing({
              gmail_message_id: message.id,
              sender_email: 'Unknown (error before parsing)',
              subject: 'Unknown (error before parsing)',
              category: 'general',
              confidence_score: 0,
              response_sent: false,
              processed_at: new Date().toISOString(),
              // error_message: error.message // Example
          }, userId);
        } catch (logError) {
          console.error(`[EmailProcessor] Failed to log error for message ${message.id}:`, logError);
        }
      }
    }

    // 9. Update the user's last poll timestamp
    console.log(`[EmailProcessor] Updating last poll timestamp to: ${currentPollTime}`);
    await updateUserLastPollTimestamp(userId, currentPollTime);

    console.log(`[EmailProcessor] Processing complete. Processed ${processedCount} emails.`);
    return { processedCount, newLastPollTimestamp: currentPollTime };

  } catch (error) {
    console.error(`[EmailProcessor] Failed to process inbox for user ${userId}:`, error);
    return { processedCount: 0, newLastPollTimestamp: lastPollTimestamp || currentPollTime }; // Return old timestamp on major failure
  }
};

// Example of how this might be called (e.g., by a background worker or scheduler)
// This is for illustration and testing; actual scheduling is outside this script.
/*
async function runEmailProcessingCycle(userId: string, accessToken: string) {
  let lastPollTime = undefined; // Store this persistently per user, e.g., in Supabase user profile or a dedicated table

  // Load lastPollTime for the user from your persistent storage
  // For example: const userProfile = await supabase.from('user_profiles').select('last_poll_time').eq('user_id', userId).single();
  // if (userProfile.data) lastPollTime = userProfile.data.last_poll_time;

  const result = await processInbox(userId, accessToken, lastPollTime);

  if (result.processedCount > 0 || result.newLastPollTimestamp !== lastPollTime) {
    // Save result.newLastPollTimestamp to persistent storage for this user
    // For example: await supabase.from('user_profiles').update({ last_poll_time: result.newLastPollTimestamp }).eq('user_id', userId);
    console.log(`Processing cycle complete. Processed ${result.processedCount} emails. New poll time: ${result.newLastPollTimestamp}`);
  } else {
    console.log('No new emails processed in this cycle.');
  }
}
*/

// Note: The actual scheduling (e.g., cron job, serverless function on a schedule)
// to call runEmailProcessingCycle regularly is not implemented here.
// Also, robust management of lastPollTimestamp per user is crucial.
// Access token refresh logic would also be needed for long-running processes.

// For personalizing templates, more sophisticated placeholder extraction might be needed.
// E.g., [OrderNumber] would require parsing the email body or subject for an order ID.
// The current `personalizeTemplate` function in gmail.ts is generic.
// The `extractNameFromEmail` is a basic helper.
// Error handling and logging can be further enhanced.
// Body parsing needs to be robust for various email formats (multipart, html, etc.).
// The current body parsing is a simplified version.

console.log('Email processor module loaded. Call processInbox() to start.');