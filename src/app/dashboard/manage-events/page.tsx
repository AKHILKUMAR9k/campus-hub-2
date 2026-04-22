'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from "lucide-react";
import { supabase } from "@/supabase";
import { useAuth } from "@/supabase";
import type { Event } from "@/lib/types";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/event-card";

export default function ManageEventsPage() {
  const { user, isUserLoading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const EVENTS_PER_PAGE = 12;

  const loadEvents = React.useCallback(async (retryCount = 0, pageNumber = 0, reset = false) => {
    if (!user) return;
    if (reset) setLoading(true);
    // Don't clear error immediately if retrying, but good to clear on fresh load
    if (retryCount === 0) setError(null);

    const maxRetries = 3;
    const baseDelay = 1000;
    const from = pageNumber * EVENTS_PER_PAGE;
    const to = from + EVENTS_PER_PAGE - 1;

    try {
      // 1. Fetch user role first if not already known
      let currentRole = role;
      if (!currentRole) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        currentRole = profile?.role || 'student';
        setRole(currentRole);
      }

      // 2. Redirect students
      if (currentRole === 'student') {
        router.push('/dashboard');
        return;
      }

      // 3. Fetch events
      let query = supabase.from("events").select("*");
      
      // Filter by organizer if not admin
      if (currentRole === 'club_organizer') {
        query = query.eq("created_by", user.id);
      }
      
      const { data, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) {
        throw fetchError;
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
    } catch (err: any) {
      console.warn(`Load events failed (attempt ${retryCount + 1}):`, err.message);

      if (retryCount < maxRetries && (err.message === "TypeError: Failed to fetch" || err.message?.includes("fetch"))) {
        const delay = baseDelay * Math.pow(2, retryCount);
        setTimeout(() => loadEvents(retryCount + 1, pageNumber, reset), delay);
      } else {
        setError(err.message || "Failed to load events.");
        setLoading(false);
      }
    }
  }, [user, role, router]);

  // 🔹 Load events created by this user
  useEffect(() => {
    if (!user) return;
    loadEvents(0, 0, true);
  }, [user, loadEvents]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(0, nextPage, false);
  };

  const isLoadingPage = isUserLoading || loading;

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {role === 'admin' ? 'Manage All Events' : 'Manage Your Events'}
        </h1>

        <Button asChild>
          <Link href="/dashboard/create-event">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Event
          </Link>
        </Button>
      </div>

      {isLoadingPage && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading your events...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error loading your events</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => loadEvents()} className="w-fit">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoadingPage && !error && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  href={`/dashboard/manage-events/${event.id}`} 
                />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    You haven't created any events yet. Get started by creating a new event!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {hasMore && events.length > 0 && (
            <div className="flex justify-center mt-4 pb-8">
               <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                 {loading ? "Loading..." : "Load More Events"}
               </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
