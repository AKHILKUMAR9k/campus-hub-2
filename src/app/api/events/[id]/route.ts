import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({
            cookies: () => cookieStore as any,
        });

        // 1. Auth Check
        const { data: { session }, error: sessionError } = await supabase.auth
            .getSession();
        if (sessionError || !session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const userId = session.user.id;

        // 2. Ownership Check
        const { data: event, error: fetchError } = await supabase
            .from("events")
            .select("created_by")
            .eq("id", id)
            .single();

        if (fetchError || !event) {
            return NextResponse.json({ error: "Event not found" }, {
                status: 404,
            });
        }

        if (event.created_by !== userId) {
            // Also allow admins?
            const { data: profile } = await supabase.from("users").select(
                "role",
            ).eq("id", userId).single();
            if (profile?.role !== "admin") {
                return NextResponse.json({
                    error: "Unauthorized to edit this event",
                }, { status: 403 });
            }
        }

        // 3. Prepare Update Payload
        const updateObj: any = {
            title: body.title,
            description: body.description,
            long_description: body.longDescription,
            date: body.date,
            time: body.time || null,
            venue: body.venue,
            category: body.category,
            tags: body.tags || [],
            updated_at: new Date().toISOString(),
        };

        // Only update image if provided (to avoid clearing it)
        if (body.imageUrl) {
            updateObj.image = body.imageUrl;
        }

        if (body.clubName) {
            updateObj.club = body.clubName;
            updateObj.club_name = body.clubName;
        }

        // 4. Update
        const { data, error } = await supabase
            .from("events")
            .update(updateObj)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Update Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, event: data });
    } catch (err: any) {
        console.error("API Error:", err);
        return NextResponse.json(
            { error: err.message || "Server Error" },
            { status: 500 },
        );
    }
}
