import type { User } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateCommentNotificationEmail,
  generateRegistrationConfirmationEmail,
} from "@/lib/email-service";

export interface Notification {
  id?: string;
  userId: string;
  type: "reminder" | "comment" | "registration" | "event_update" | "system";
  title: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

/**
 * Create an in-app notification
 */
export async function createNotification(
  supabase: SupabaseClient,
  notification: Omit<Notification, "id" | "read" | "createdAt">,
): Promise<void> {
  const fullNotification: Omit<Notification, "id"> = {
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("notifications").insert(
    fullNotification,
  );

  if (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  // This would require a more complex query to update multiple documents
  // For now, we'll handle this in the component
}

/**
 * Create notification for new comment on event
 */
export async function notifyEventComment(
  supabase: SupabaseClient,
  eventId: string,
  eventTitle: string,
  commenterName: string,
  commentText: string,
): Promise<void> {
  // Get event organizer - we need to fetch the event data
  const { data: event } = await supabase.from("events").select("created_by").eq(
    "id",
    eventId,
  ).single();

  // Note: 'created_by' is the standard field, checking backwards compatibility
  const organizerId = event?.created_by || (event as any)?.organizerId;

  if (!organizerId) return;

  await createNotification(supabase, {
    userId: organizerId,
    type: "comment",
    title: "New Comment on Your Event",
    message: `${commenterName} commented on "${eventTitle}": "${
      commentText.substring(0, 100)
    }${commentText.length > 100 ? "..." : ""}"`,
    eventId,
    eventTitle,
    actionUrl: `/dashboard/events/${eventId}`,
  });
}

/**
 * Create notification for event reminder
 */
export async function notifyEventReminder(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  eventTitle: string,
  reminderTime: Date,
): Promise<void> {
  await createNotification(supabase, {
    userId,
    type: "reminder",
    title: "Event Reminder",
    message:
      `Reminder: "${eventTitle}" is happening soon (${reminderTime.toLocaleString()})`,
    eventId,
    eventTitle,
    actionUrl: `/dashboard/events/${eventId}`,
  });
}

/**
 * Create notification for successful registration
 */
export async function notifyRegistrationSuccess(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await createNotification(supabase, {
    userId,
    type: "registration",
    title: "Registration Confirmed",
    message: `You have successfully registered for "${eventTitle}"`,
    eventId,
    eventTitle,
    actionUrl: `/dashboard/events/${eventId}`,
  });
}

/**
 * Get notification preferences for a user
 */
export function getNotificationPreferences(user: User) {
  return {
    emailReminders: user.emailPreferences?.eventReminders !== false,
    emailComments: user.emailPreferences?.commentReplies !== false,
    emailRegistrations: false, // Not implemented yet
    inAppNotifications: false, // Not implemented yet
  };
}
