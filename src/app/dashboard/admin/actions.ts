"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = createServerActionClient({ cookies });

    // 1. Verify the requester is an admin
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data: requesterProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || requesterProfile?.role !== "admin") {
        return { error: "Unauthorized: You must be an admin." };
    }

    // 2. Perform the update
    const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) {
        console.error("Error updating user role:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/admin");
    return { success: true };
}

export async function approveClub(clubId: string) {
    const supabase = createServerActionClient({ cookies });

    // 1. Verify Admin
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { data: requesterProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (requesterProfile?.role !== "admin") {
        return { error: "Unauthorized: Admins only." };
    }

    // 2. Fetch Club to get organizer_id
    const { data: club } = await supabase
        .from("clubs")
        .select("organizer_id")
        .eq("id", clubId)
        .single();

    // 3. Update Club Status
    const { error: clubError } = await supabase
        .from("clubs")
        .update({ status: "approved" })
        .eq("id", clubId);

    if (clubError) return { error: clubError.message };

    // 4. Automatically approve the user as a club_organizer and clear 'pending' badge
    if (club?.organizer_id) {
        await supabase
            .from("users")
            .update({ 
                role: "club_organizer", 
                organizer_status: "approved" 
            })
            .eq("id", club.organizer_id)
            .neq("role", "admin"); // Don't demote admins
    }

    revalidatePath("/dashboard/admin");
    return { success: true };
}

export async function rejectClub(clubId: string) {
    const supabase = createServerActionClient({ cookies });

    // 1. Verify Admin
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { data: requesterProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (requesterProfile?.role !== "admin") {
        return { error: "Unauthorized: Admins only." };
    }

    // 2. Update Club
    const { error } = await supabase
        .from("clubs")
        .update({ status: "rejected" })
        .eq("id", clubId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/admin");
    return { success: true };
}

export async function updateUserStatus(userId: string, newStatus: "active" | "banned") {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return { error: "Unauthorized: Admins only." };

    const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", userId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin");
    return { success: true };
}

export async function deleteUser(userId: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return { error: "Unauthorized: Admins only." };

    // Note: We only delete from public.users. Auth deletion requires Admin API.
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/admin");
    return { success: true };
}

export async function deleteEvent(eventId: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return { error: "Unauthorized: Admins only." };

    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/manage-events");
    revalidatePath("/dashboard/admin");
    return { success: true };
}
