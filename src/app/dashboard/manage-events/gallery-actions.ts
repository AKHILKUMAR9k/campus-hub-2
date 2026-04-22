"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function uploadGalleryImage(
    eventId: string,
    imageUrl: string,
    caption?: string,
) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("event_gallery")
        .insert({
            event_id: eventId,
            image_url: imageUrl,
            caption: caption,
            uploaded_by: user.id,
        });

    if (error) {
        console.error("Gallery upload error:", error);
        return { error: "Failed to save image to gallery." };
    }

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/manage-events/${eventId}`);
    return { success: true };
}

export async function deleteGalleryImage(galleryId: string, eventId: string) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: async () => cookieStore,
    });

    const { error } = await supabase
        .from("event_gallery")
        .delete()
        .eq("id", galleryId);

    if (error) {
        return { error: "Failed to delete image." };
    }

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/manage-events/${eventId}`);
    return { success: true };
}
