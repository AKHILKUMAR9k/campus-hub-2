
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSameDay, parseISO, isPast } from "date-fns";
import { Loader2 } from "lucide-react";

import { supabase } from "@/supabase";
import { useAuth } from "@/supabase";
import type { Registration } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export default function MyEventsPage() {
  const { user, isUserLoading } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 🔹 Load registrations from Supabase
  useEffect(() => {
    if (!user) return;

    const loadRegistrations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
        setRegistrations([]);
      } else {
        setRegistrations(data || []);
      }

      setLoading(false);
    };

    loadRegistrations();
  }, [user]);

  const upcomingRegistrations = registrations.filter(
    (reg) => reg.date && !isPast(new Date(reg.date))
  );

  const pastRegistrations = registrations.filter(
    (reg) => reg.date && isPast(new Date(reg.date))
  );

  const eventsForSelectedDate = upcomingRegistrations.filter(
    (reg) =>
      reg.date &&
      selectedDate &&
      isSameDay(parseISO(reg.date), selectedDate)
  );

  const isLoadingPage = isUserLoading || loading;

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          My Registered Events
        </h1>
      </div>

      {isLoadingPage && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error loading your events</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoadingPage && !error && (
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* UPCOMING */}
          <TabsContent value="upcoming">
            {upcomingRegistrations.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8 mt-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Event Calendar
                  </h2>
                  <Card>
                    <CardContent className="p-2">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="p-0"
                        components={{
                          DayContent: ({ date }) => {
                            const hasEvent = upcomingRegistrations.some(
                              (reg) =>
                                reg.date &&
                                isSameDay(parseISO(reg.date), date)
                            );
                            return (
                              <div className="relative h-full w-full flex items-center justify-center">
                                <span>{date.getDate()}</span>
                                {hasEvent && (
                                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                                )}
                              </div>
                            );
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Events on{" "}
                    {selectedDate
                      ? selectedDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })
                      : "selected date"}
                  </h2>

                  <div className="space-y-4">
                    {eventsForSelectedDate.length > 0 ? (
                      eventsForSelectedDate.map((reg) => (
                        <Link
                          key={reg.id}
                          href={`/dashboard/events/${reg.event_id}`}
                        >
                          <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="pt-6">
                              <CardTitle className="text-md">
                                {reg.title}
                              </CardTitle>
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm text-center pt-8">
                        No registered events on this day.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="mt-6">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  You haven't registered for any upcoming events yet.
                  <Button asChild variant="link">
                    <Link href="/dashboard">Explore events</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PAST */}
          <TabsContent value="past">
            {pastRegistrations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {pastRegistrations.map((reg) => (
                  <Link
                    key={reg.id}
                    href={`/dashboard/events/${reg.event_id}`}
                  >
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-md">
                          {reg.title}
                        </CardTitle>
                        <CardDescription>
                          {new Date(reg.date!).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="mt-6">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  You have no past event registrations.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
