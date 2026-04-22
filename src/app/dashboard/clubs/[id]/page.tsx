'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { Loader2, Calendar, MapPin, Mail, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventCard from '@/components/event-card';
import type { Event } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logo: string | null;
  organizer_id: string | null;
  created_at: string;
}

export default function ClubDetailsPage() {
  const { id } = useParams();
  const clubId = Array.isArray(id) ? id[0] : id;

  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClubData = async () => {
        setLoading(true);
        setError(null);

        // 1. Fetch Club Details
        const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', clubId)
            .single();

        if (clubError || !clubData) {
            setError("Club not found");
            setLoading(false);
            return;
        }

        setClub(clubData);

        // 2. Fetch Club Events
        // Note: Assuming 'club' column in events table stores the club NAME. 
        // Ideally it should be a foreign key to club ID, but schema says 'club TEXT'.
        // So we filter by club name.
        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('club', clubData.name) 
            .order('date', { ascending: false }); // Show newest first

        if (!eventsError) {
            setEvents(eventsData as Event[]);
        }

        setLoading(false);
    };

    if (clubId) {
        loadClubData();
    }
  }, [clubId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !club) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Club not found"}</AlertDescription>
        </Alert>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date() && !e.is_completed);
  const pastEvents = events.filter(e => new Date(e.date) < new Date() || e.is_completed);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-card p-6 rounded-lg border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
          {club.logo && <AvatarImage src={club.logo} alt={club.name} />}
          <AvatarFallback className="text-2xl">{club.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div>
            <h1 className="text-3xl font-bold font-headline">{club.name}</h1>
            {club.category && <Badge variant="secondary" className="mt-2">{club.category}</Badge>}
          </div>
          <p className="text-muted-foreground text-lg">{club.description || "No description provided."}</p>
        </div>
      </div>

      {/* Events Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="upcoming">Upcoming Events ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({pastEvents.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
            {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {upcomingEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/30">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No upcoming events scheduled.</p>
                </div>
            )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
            {pastEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pastEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/30">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No past events found.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
