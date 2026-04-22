import { supabase } from "@/supabase/client";

export interface EventRecommendation {
    event: any;
    score: number;
    reason: string;
}

export async function getRecommendedEvents(
    userId: string,
): Promise<EventRecommendation[]> {
    // const supabase = createClientComponentClient();

    // 1. Fetch User Profile & Past Registrations
    const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("branch") // Removed interest_tags as it might not exist yet
        .eq("id", userId)
        .single();

    if (userError) {
        console.warn(
            "Recommendations: Failed to fetch user profile",
            userError,
        );
    }

    const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select("event_id, events(category, club_id)")
        .eq("user_id", userId);

    if (regError) {
        console.warn(
            "Recommendations: Failed to fetch registrations",
            regError,
        );
    }

    // 2. Fetch Upcoming Events
    const { data: events } = await supabase
        .from("events")
        .select("*, clubs(name)")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true });

    if (!events || events.length === 0) return [];

    // 3. Simple Scoring Algorithm
    const recommendations: EventRecommendation[] = events.map((event) => {
        let score = 0;
        let reasons: string[] = [];

        // Factor A: Branch Match (Target Audience)
        // If event description or title mentions branch, boost score
        if (
            userProfile?.branch && (
                event.title.toLowerCase().includes(
                    userProfile.branch.toLowerCase(),
                ) ||
                event.description?.toLowerCase().includes(
                    userProfile.branch.toLowerCase(),
                )
            )
        ) {
            score += 5;
            reasons.push(`Relevant to ${userProfile.branch}`);
        }

        // Factor B: Category Affinity (based on past registrations)
        const pastCategories = new Set(
            registrations?.map((r: any) => r.events?.category).filter(Boolean),
        );
        if (pastCategories.has(event.category)) {
            score += 3;
            reasons.push(`Because you like ${event.category} events`);
        }

        // Factor C: Club Affinity
        const pastClubs = new Set(
            registrations?.map((r: any) => r.events?.club_id).filter(Boolean),
        );
        if (pastClubs.has(event.club_id)) {
            score += 2;
            reasons.push(`From a club you follow`);
        }

        // Factor D: Popularity (Registration Count)
        // (In a real app, we'd query this count properly. For now, we simulate basic random popularity boost)
        // score += Math.random() * 2;

        return {
            event,
            score,
            reason: reasons[0] || "Popular event",
        };
    });

    // 4. Sort and Filter
    return recommendations
        .filter((rec) => rec.score > 0) // Only show relevant ones
        .sort((a, b) => b.score - a.score)
        .slice(0, 4); // Top 4
}
