"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
// import { createServerClient } from "@/supabase/server";

import {
  notifyEventComment,
  notifyRegistrationSuccess,
} from "@/lib/notification-service";
import {
  sendRegistrationEmailNotification,
  sendCommentEmailNotification,
} from "@/lib/notification-actions";

export async function registerForEvent(
  eventId: string,
  userId: string,
  registrationDetails?: {
    fullName: string;
    rollNumber: string;
    branch: string;
    section: string;
    year: string;
    phone: string;
    wantReminder?: boolean;
  },
) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore as any,
  });

  // Check if already registered
  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return { error: "You are already registered for this event." };
  }

  // Fetch event details
  const { data: eventData } = await supabase
    .from("events")
    .select("title, date")
    .eq("id", eventId)
    .single();

  if (!eventData) {
    return { error: "Event not found." };
  }

  // Use provided details or fetch from profile as fallback
  let insertData: any = {
    event_id: eventId,
    user_id: userId,
    title: eventData.title,
    date: eventData.date,
    registration_date: new Date().toISOString(),
  };

  if (registrationDetails) {
    insertData = {
      ...insertData,
      full_name: registrationDetails.fullName,
      email: (await supabase.auth.getUser()).data.user?.email, // Get email from auth
      roll_number: registrationDetails.rollNumber,
      branch: registrationDetails.branch,
      section: registrationDetails.section,
      year: registrationDetails.year,
      phone: registrationDetails.phone,
    };
  } else {
    // Fallback to fetching profile if no details provided (legacy support)
    const { data: userProfile } = await supabase
      .from("users")
      .select("first_name, last_name, email, roll_number, branch, section")
      .eq("id", userId)
      .single();

    if (!userProfile) {
      return { error: "User profile not found. Please complete your profile." };
    }

    insertData = {
      ...insertData,
      full_name: `${userProfile.first_name || ""} ${
        userProfile.last_name || ""
      }`.trim(),
      email: userProfile.email,
      roll_number: userProfile.roll_number,
      branch: userProfile.branch,
      section: userProfile.section,
    };
  }

  // Insert registration
  const { error } = await supabase
    .from("registrations")
    .insert(insertData);

  if (error) {
    console.error("Registration error:", error);
    return { error: error.message };
  }

  // Send notification
  try {
    await notifyRegistrationSuccess(supabase, userId, eventId, eventData.title);
    
    // Also send email
    const { data: userAuth } = await supabase.auth.getUser();
    if (userAuth?.user) {
        await sendRegistrationEmailNotification(
            userAuth.user, 
            eventData.title, 
            new Date(eventData.date).toLocaleDateString(), 
            "See dashboard for venue"
        );
    }
  } catch (notifyError) {
    console.error("Failed to send registration notification:", notifyError);
  }

  // Create reminder if requested
  if (registrationDetails?.wantReminder) {
    try {
      const eventDate = new Date(eventData.date);
      // Set reminder for 24 hours before event, or 1 hour before if event is sooner
      const reminderTime = new Date(eventDate.getTime() - (24 * 60 * 60 * 1000));
      const now = new Date();
      
      const finalReminderTime = reminderTime > now ? reminderTime : new Date(now.getTime() + (5 * 60 * 1000)); // 5 mins from now if past

      await supabase.from('reminders').insert({
        user_id: userId,
        event_id: eventId,
        event_title: eventData.title,
        event_date: eventData.date,
        reminder_time: finalReminderTime.toISOString(),
        sent: false
      });
    } catch (remindError) {
        console.error("Failed to set reminder:", remindError);
    }
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function unregisterForEvent(eventId: string, userId: string) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore as any,
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const currentUserId = session.user.id;

  // 1. If user is unregistering themselves
  if (currentUserId === userId) {
    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) {
      return { error: "Failed to unregister." };
    }
  } else {
    // 2. If organizer/admin is removing someone else
    // Fetch event details to check organizer
    const { data: event } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", eventId)
      .single();

    // Fetch user profile to check admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUserId)
      .single();

    const isOrganizer = event?.created_by === currentUserId;
    const isAdmin = profile?.role === "admin";

    if (isOrganizer || isAdmin) {
      // RLS policies now allow Organizers and Admins to delete registrations
      const { error } = await supabase
        .from("registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) {
        console.error("Unregister error:", error);
        return { error: "Failed to remove user." };
      }
    } else {
      return { error: "Unauthorized to remove this user." };
    }
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function postComment(
  eventId: string,
  userId: string,
  content: string,
  parentId?: string,
) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore as any,
  });

  if (!content || content.trim().length === 0) {
    return { error: "Comment cannot be empty." };
  }

  // Fetch user details for notification
  const { data: userProfile } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();

  // Fetch event details for notification
  const { data: eventData } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single();

  const { error } = await supabase
    .from("comments")
    .insert({
      event_id: eventId,
      user_id: userId,
      content: content,
      parent_id: parentId || null,
    });

  if (error) {
    console.error("Post comment error:", error);
    return { error: error.message || "Failed to post comment." };
  }

  // Send notification to organizer (only for top-level comments or if organizer didn't reply to themselves)
  if (userProfile && eventData && !parentId) {
    try {
      const commenterName =
        `${userProfile.first_name} ${userProfile.last_name}`.trim() ||
        "Anonymous";
      await notifyEventComment(
        supabase,
        eventId,
        eventData.title,
        commenterName,
        content,
      );

      // Send Email to Organizer
      const { data: event } = await supabase.from("events").select("created_by").eq("id", eventId).single();
      if (event?.created_by) {
          const { data: organizer } = await supabase.from("users").select("*").eq("id", event.created_by).single();
          if (organizer) {
              await sendCommentEmailNotification(organizer, commenterName, content, eventData.title);
          }
      }
    } catch (notifyError) {
      console.error("Failed to send comment notification:", notifyError);
    }
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  return { success: true };
}

export async function toggleCommentLike(commentId: string, userId: string) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore as any,
  });

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .single();

  if (existingLike) {
    // Unlike
    await supabase
      .from("comment_likes")
      .delete()
      .eq("id", existingLike.id);
  } else {
    // Like
    await supabase
      .from("comment_likes")
      .insert({
        comment_id: commentId,
        user_id: userId,
      });
  }

  revalidatePath("/dashboard");
  return { success: true };
}
