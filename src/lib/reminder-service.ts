import { setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { sendEmail, generateReminderEmail } from '@/lib/email-service';
import { formatDate, formatTime } from '@/lib/utils';
import type { Event, User } from '@/lib/types';

export interface Reminder {
  id?: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reminderTime: string; // ISO string
  createdAt: string;
  sent?: boolean;
}

/**
 * Create a reminder for an event
 */
export async function createReminder(
  user: User,
  event: Event,
  reminderTime: Date
): Promise<void> {
  if (!user.email) {
    throw new Error('User email is required for reminders');
  }

  // Check if user has reminders enabled
  if (user.emailPreferences?.eventReminders === false) {
    return; // Silently skip if reminders are disabled
  }

  const reminder: Omit<Reminder, 'id'> = {
    userId: user.id,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    reminderTime: reminderTime.toISOString(),
    createdAt: new Date().toISOString(),
    sent: false,
  };

  await addDocumentNonBlocking('reminders', reminder);

  // Send immediate confirmation email
  try {
    const emailData = generateReminderEmail(
      event.title,
      formatDate(event.date),
      formatTime(event.time || ''),
      reminderTime
    );
    emailData.to = user.email;

    await sendEmail(emailData);
  } catch (error) {
    console.error('Failed to send reminder confirmation email:', error);
    // Don't throw error, reminder is still set
  }
}

/**
 * Get reminders for a user
 */
export async function getUserReminders(userId: string): Promise<Reminder[]> {
  // This would typically use a Supabase query
  // For now, we'll assume it's handled by the component using useCollection
  return [];
}

/**
 * Update reminder sent status
 */
export async function markReminderAsSent(reminderId: string): Promise<void> {
  await updateDocumentNonBlocking('reminders', { sent: true }, reminderId);
}

/**
 * Calculate default reminder time (1 day before event)
 */
export function getDefaultReminderTime(eventDate: string, eventTime?: string): Date {
  const eventDateTime = new Date(`${eventDate.split('T')[0]}T${eventTime || '00:00'}`);
  const reminderTime = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000); // 1 day before
  return reminderTime;
}

/**
 * Calculate reminder time options
 */
export function getReminderTimeOptions(eventDate: string, eventTime?: string): Array<{ label: string; value: Date }> {
  const eventDateTime = new Date(`${eventDate.split('T')[0]}T${eventTime || '00:00'}`);

  return [
    {
      label: '1 hour before',
      value: new Date(eventDateTime.getTime() - 60 * 60 * 1000),
    },
    {
      label: '1 day before',
      value: new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      label: '1 week before',
      value: new Date(eventDateTime.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  ].filter(option => option.value > new Date()); // Only future reminders
}
