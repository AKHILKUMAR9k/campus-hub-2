'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { supabase } from '@/supabase/client';
import { useAuth } from '@/supabase';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/* -------------------- TYPES -------------------- */

type CalendarRegistration = {
  id: string;
  event_id: string;
  title: string;
  date: string;
  clubName?: string;
  venue?: string;
  time?: string;
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    eventId: string;
    clubName: string;
    venue: string;
    time: string;
  };
}

/* -------------------- CALENDAR SETUP -------------------- */

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/* -------------------- COMPONENT -------------------- */

export default function CalendarView() {
  const { user, isUserLoading } = useAuth();

  const [registrations, setRegistrations] = useState<CalendarRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  /* -------- LOAD REGISTRATIONS -------- */

  useEffect(() => {
    if (!user) return;

    const loadRegistrations = async () => {
      setLoading(true);

      // Join with events table to get details
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id, 
          event_id, 
          title, 
          date, 
          events!registrations_event_id_fkey (
            club,
            venue
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error("Calendar load error:", error);
        setError(error.message);
        setRegistrations([]);
      } else {
        setRegistrations(
          (data ?? []).map((r: any) => ({
            id: String(r.id),
            event_id: r.event_id,
            title: r.title,
            date: r.date,
            // Access nested data from the join
            clubName: r.events?.club || 'Unknown Club',
            venue: r.events?.venue || 'TBD',
            time: format(new Date(r.date), 'p'), // Format time from the date timestamp
          }))
        );
      }

      setLoading(false);
    };

    loadRegistrations();
  }, [user]);

  /* -------- MAP TO CALENDAR EVENTS -------- */

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return registrations
      .filter((r) => !!r.date)
      .map((r) => {
        const d = new Date(r.date);

        return {
          id: r.id,
          title: r.title || 'Event',
          start: d,
          end: d,
          resource: {
            eventId: r.event_id,
            clubName: r.clubName ?? 'Unknown Club',
            venue: r.venue ?? 'TBD',
            time: r.time ?? 'TBD',
          },
        };
      });
  }, [registrations]);

  const upcomingEvents = calendarEvents
    .filter((e: CalendarEvent) => e.start >= new Date())
    .sort(
      (a: CalendarEvent, b: CalendarEvent) =>
        a.start.getTime() - b.start.getTime()
    )
    .slice(0, 5);

  /* -------------------- UI -------------------- */

  if (isUserLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading calendar</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight font-headline">
        My Calendar
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-4">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={['month', 'week', 'day']}
              defaultView="month"
              popup
              selectable
              onSelectEvent={(event: CalendarEvent) =>
                setSelectedEvent(event)
              }
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Event */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Event Details</h3>

            {selectedEvent ? (
              <div className="space-y-2">
                <h4 className="font-medium">{selectedEvent.title}</h4>

                <p className="text-sm text-muted-foreground">
                  <strong>Club:</strong>{' '}
                  {selectedEvent.resource.clubName}
                </p>

                <p className="text-sm text-muted-foreground">
                  <strong>Date:</strong>{' '}
                  {format(selectedEvent.start, 'PPP')}
                </p>

                <p className="text-sm text-muted-foreground">
                  <strong>Time:</strong>{' '}
                  {selectedEvent.resource.time}
                </p>

                <p className="text-sm text-muted-foreground">
                  <strong>Venue:</strong>{' '}
                  {selectedEvent.resource.venue}
                </p>

                <Link
                  href={`/dashboard/events/${selectedEvent.resource.eventId}`}
                  className="inline-block mt-2 text-sm text-primary hover:underline"
                >
                  View Event Details →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click on an event to view details
              </p>
            )}
          </div>

          {/* Upcoming */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Upcoming Events</h3>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((e: CalendarEvent) => (
                  <div
                    key={e.id}
                    className="p-2 rounded border cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedEvent(e)}
                  >
                    <p className="font-medium text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(e.start, 'MMM d, yyyy')} at{' '}
                      {e.resource.time}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming events
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
