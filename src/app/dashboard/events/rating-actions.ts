"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitRating(
    eventId: string,
    rating: number,
    feedback: string,
) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
    });

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
        return { error: "You must be logged in to rate an event." };
    }

    const userId = session.session.user.id;

    // Check if user already rated
    const { data: existing } = await supabase
        .from("ratings")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

    if (existing) {
        return { error: "You have already rated this event." };
    }

    const { error } = await supabase.from("ratings").insert({
        event_id: eventId,
        user_id: userId,
        rating,
        feedback,
    });

    if (error) {
        console.error("Error submitting rating:", error);
        return { error: "Failed to submit rating." };
    }

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
}

export async function getEventRatings(eventId: string) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
    });

    const { data: ratings, error } = await supabase
        .from("ratings")
        .select(`
      id,
      rating,
      feedback,
      created_at,
      user_id, 
      users (
        first_name,
        last_name
      )
    `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching ratings:", error);
        return { ratings: [], average: 0, count: 0 };
    }

    const count = ratings.length;
    const average = count > 0
        ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / count
        : 0;

    return { ratings, average, count };
}
