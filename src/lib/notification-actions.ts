'use server';

import { User } from "@/lib/types";
import { 
    generateCommentNotificationEmail, 
    generateRegistrationConfirmationEmail 
} from "@/lib/email-service";
import { sendEmailServer } from "@/lib/email-server";

/**
 * Send email notification for comment (Server Action)
 */
export async function sendCommentEmailNotification(
  organizer: User,
  commenterName: string,
  commentText: string,
  eventTitle: string,
): Promise<void> {
  if (
    !organizer.email || organizer.emailPreferences?.commentReplies === false
  ) {
    return;
  }

  const emailData = generateCommentNotificationEmail(
    eventTitle,
    commenterName,
    commentText,
  );
  emailData.to = organizer.email;

  try {
    await sendEmailServer(emailData);
  } catch (error) {
    console.error("Failed to send comment notification email:", error);
  }
}

/**
 * Send email notification for registration (Server Action)
 */
export async function sendRegistrationEmailNotification(
  user: any,
  eventTitle: string,
  eventDate: string,
  venue: string,
): Promise<void> {
  if (!user.email) return;

  const emailData = generateRegistrationConfirmationEmail(
    eventTitle,
    eventDate,
    "Check event details",
    venue,
  );
  emailData.to = user.email;

  try {
    await sendEmailServer(emailData);
  } catch (error) {
    console.error("Failed to send registration confirmation email:", error);
  }
}
