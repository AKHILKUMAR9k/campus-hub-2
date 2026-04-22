'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/supabase';
import { supabase } from '@/supabase/client';
import EventForm from '@/components/event-form';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditEventPage() {
  const { id } = useParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const { user, isUserLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !user) return;

    const fetchEvent = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        setError(error.message);
        setEvent(null);
      } else {
        setEvent(data);
      }

      setLoading(false);
    };

    fetchEvent();
  }, [eventId, user]);

  if (isUserLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading event details...
        </CardContent>
      </Card>
    );
  }

  if (!event && !error) {
    notFound();
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading event</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // 🔐 Ownership check
  if (!user || event?.created_by !== user.id) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>
          You are not allowed to edit this event.
        </AlertDescription>
      </Alert>
    );
  }

  return <EventForm existingEvent={event} />;
}
