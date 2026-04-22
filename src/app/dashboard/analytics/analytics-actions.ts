"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getSystemStats(filterByOrganizerId?: string) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
    });

    if (filterByOrganizerId) {
        // Stats for a specific organizer
        const [eventsResult, allRegistrations] = await Promise.all([
            supabase.from("events").select("*", { count: "exact", head: true })
                .eq("created_by", filterByOrganizerId),
            supabase.from("events")
                .select("id, registrations(user_id)")
                .eq("created_by", filterByOrganizerId)
        ]);

        const events = allRegistrations.data || [];
        const uniqueUserIds = new Set();
        let totalRegistrations = 0;
        
        events.forEach(e => {
            const regs = (e as any).registrations || [];
            totalRegistrations += regs.length;
            regs.forEach((r: any) => uniqueUserIds.add(r.user_id));
        });

        const uniqueRegistrants = uniqueUserIds.size;
        const avgEngagement = eventsResult.count ? totalRegistrations / eventsResult.count : 0;

        return {
            totalEvents: eventsResult.count || 0,
            totalUsers: uniqueRegistrants,
            totalClubs: 1,
            pendingClubs: 0,
            avgEngagement: Math.round(avgEngagement * 10) / 10, // Avg registrations per event
        };
    }

    // Parallelize queries for better performance (Admin/System-wide)
    const [eventsResult, usersResult, clubsResult, clubsPendingResult] =
        await Promise.all([
            supabase.from("events").select("*", { count: "exact", head: true }),
            supabase.from("users").select("*", { count: "exact", head: true }),
            supabase.from("clubs").select("*", { count: "exact", head: true }),
            supabase.from("clubs").select("*", { count: "exact", head: true })
                .eq("status", "pending"),
        ]);

    // Calculate Average Engagement (Unique registrants / Total users)
    const { data: uniqueRegistrantsData } = await supabase
        .from("registrations")
        .select("user_id");
    
    const uniqueRegistrantsCount = new Set(uniqueRegistrantsData?.map(r => r.user_id)).size;
    const avgEngagement = usersResult.count ? (uniqueRegistrantsCount / usersResult.count) * 100 : 0;

    return {
        totalEvents: eventsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalClubs: clubsResult.count || 0,
        pendingClubs: clubsPendingResult.count || 0,
        avgEngagement: Math.round(avgEngagement),
    };
}

export async function getRegistrationTrends(filterByOrganizerId?: string) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
    });

    // Get registrations from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
        .from("registrations")
        .select("registration_date, event_id")
        .gte("registration_date", thirtyDaysAgo.toISOString());

    if (filterByOrganizerId) {
        // Filter by events created by this organizer
        const { data: organizerEvents } = await supabase
            .from("events")
            .select("id")
            .eq("created_by", filterByOrganizerId);
        
        const eventIds = organizerEvents?.map(e => e.id) || [];
        query = query.in("event_id", eventIds);
    }

    const { data, error } = await query.order("registration_date", { ascending: true });

    if (error || !data) return [];

    // Group by date
    const trends: Record<string, number> = {};
    data.forEach((reg) => {
        if (!reg.registration_date) return;
        const date = reg.registration_date.split("T")[0];
        trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPopularEvents(filterByOrganizerId?: string) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
        cookies: () => cookieStore as any,
    });

    let query = supabase
        .from("events")
        .select(`
            id,
            title,
            registrations (count)
        `);

    if (filterByOrganizerId) {
        query = query.eq("created_by", filterByOrganizerId);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    const finalData = data.map((e: any) => ({
        name: e.title,
        value: e.registrations[0]?.count || 0,
    }));

    return finalData
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
}
