"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Building } from "lucide-react";
import { supabase } from "@/supabase/client";
import type { Event } from "@/lib/types";
import EventCard from "@/components/event-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import RecommendedEvents from "@/components/recommended-events";
import { useDebounce } from "@/hooks/use-debounce";
import { DashboardSkeleton } from "@/components/skeletons";

const CATEGORIES = ["All", "Tech", "Music", "Sports", "Art", "Cultural", "Career"];

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedClub, setSelectedClub] = useState("All");
  const [clubs, setClubs] = useState<{id: string, name: string}[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const EVENTS_PER_PAGE = 12;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadEvents = async (pageNumber: number, reset = false) => {
    if (reset) setLoading(true);

    const from = pageNumber * EVENTS_PER_PAGE;
    const to = from + EVENTS_PER_PAGE - 1;

    // Fetch only upcoming events
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("date", new Date().toISOString()) // Only future events
      .order("date", { ascending: true })
      .range(from, to);

      if (error) {
        console.error("Error loading events (Detailed):", JSON.stringify(error, null, 2));
        console.log("Supabase URL used:", process.env.NEXT_PUBLIC_SUPABASE_URL); // Verify env var
        setLoading(false);
        // Don't return, let the UI show empty state or retry button
        return;
      }
  
      if (data) {
        if (reset) {
          setEvents(data);
        } else {
          setEvents((prev) => [...prev, ...data]);
        }
        
        if (data.length < EVENTS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
      setLoading(false);
  };

  useEffect(() => {
    loadEvents(0, true);
    
    // Load clubs for filter
    const fetchClubs = async () => {
      const { data } = await supabase.from('clubs').select('id, name').eq('status', 'approved');
      if (data) setClubs(data);
    };
    fetchClubs();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(nextPage);
  };

  useEffect(() => {
    let result = events;

    // Filter by Search
    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(lowerQuery) ||
          event.venue.toLowerCase().includes(lowerQuery) ||
          event.club?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by Category
    if (selectedCategory !== "All") {
      result = result.filter((event) => event.category === selectedCategory);
    }

    // Filter by Club
    if (selectedClub !== "All") {
      result = result.filter((event) => event.club === selectedClub);
    }

    setFilteredEvents(result);
  }, [debouncedSearchQuery, selectedCategory, selectedClub, events]);

  if (loading && events.length === 0) {
    return <DashboardSkeleton />;
  }

  // Error State / Empty State with Retry
  if (!loading && events.length === 0 && !searchQuery && selectedCategory === "All") {
       return (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-slate-50 dark:bg-slate-900 border-dashed space-y-4">
             <div className="rounded-full bg-red-100 p-4 mb-3">
                <Search className="h-6 w-6 text-red-500" />
             </div>
             <h3 className="text-lg font-semibold">Could not load events</h3>
             <p className="text-muted-foreground max-w-sm">
                There was a problem connecting to the server.
             </p>
             <Button onClick={() => window.location.reload()} variant="outline">
                Reload Page
             </Button>
             <Button onClick={() => loadEvents(0, true)}>
                Retry Fetch
             </Button>
        </div>
       );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Upcoming Events</h1>
          <p className="text-muted-foreground">Discover what's happening on campus</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Club Filter */}
          <Select value={selectedClub} onValueChange={setSelectedClub}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <SelectValue placeholder="Club" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Clubs</SelectItem>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.name}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Recommendations */}
      <RecommendedEvents />

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-slate-50 dark:bg-slate-900 border-dashed">
          <div className="rounded-full bg-muted p-4 mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No events found</h3>
          <p className="text-muted-foreground max-w-sm mt-1">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} href={`/dashboard/events/${event.id}`} />
            ))}
          </div>

          {hasMore && !searchQuery && selectedCategory === "All" && (
            <div className="flex justify-center mt-4 pb-8">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                 {loading ? "Loading..." : "Load More Events"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
