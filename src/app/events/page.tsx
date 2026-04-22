import { createServerClient } from "@/supabase/server";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; query?: string }>;
}) {
  const supabase = createServerClient();
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const query = resolvedParams.query;

  let dbQuery = supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (category && category !== "All") {
    dbQuery = dbQuery.eq("category", category);
  }

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  const { data: events } = await dbQuery;

  const categories = ["All", "Tech", "Music", "Sports", "Art", "Cultural", "Career"];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl font-headline">Campus Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Join Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold font-headline mb-2">Explore Events</h1>
            <p className="text-muted-foreground">Discover what's happening across campus.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-9 rounded-full"
                // In a real app, this would update URL params via client-side router
              />
            </div>
            <Button variant="outline" className="rounded-full">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((c) => (
            <Link 
              key={c} 
              href={`/events?category=${c}`}
              className={`px-6 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                (category === c || (!category && c === "All"))
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Events Grid */}
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
            <p className="text-xl text-muted-foreground font-medium">No events found matching your criteria.</p>
            <Button variant="link" className="mt-2" asChild>
              <Link href="/events">Clear all filters</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-10 border-t mt-20">
        <div className="container text-center text-muted-foreground text-sm">
          Built for the campus community with ❤️
        </div>
      </footer>
    </div>
  );
}
