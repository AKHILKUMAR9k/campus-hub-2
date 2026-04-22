import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Use Route Handler Client which automatically handles cookies/auth
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore as any,
    });

    // Internal check: Get the user from the session
    const { data: { session }, error: sessionError } = await supabase.auth
      .getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || !["club_organizer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not allowed: Organizers only" }, {
        status: 403,
      });
    }

    // Prepare event row
    const insertObj = {
      created_by: userId,
      club: body.clubName,
      club_name: body.clubName, // Required by DB constraint
      title: body.title,
      description: body.description,
      long_description: body.longDescription,
      date: body.date,
      time: body.time || null,
      venue: body.venue,
      category: body.category,
      tags: body.tags || [],
      image: body.imageUrl || null,
      registration_link: body.registrationLink || null,
      registration_count: 0, // Column exists
      is_past: new Date(body.date) < new Date(), // Column exists
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // is_completed: false // Removed: Column missing in DB caused error
    };

    // Insert event
    const { data, error } = await supabase
      .from("events")
      .insert(insertObj)
      .select()
      .single();

    if (error) {
      console.error("Insert Error:", error);
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
