"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { getRecommendedEvents, EventRecommendation } from "@/lib/recommendations";
import EventCard from "@/components/event-card"; // Assuming you have this
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/supabase/provider";

export default function RecommendedEvents() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<EventRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const data = await getRecommendedEvents(user.id);
        setRecommendations(data);
      } catch (e) {
        console.error("Failed to load recommendations", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
     return <Skeleton className="h-[200px] w-full rounded-xl" />;
  }

  if (recommendations.length === 0) {
    return null; // Don't show if nothing relevant
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-xl font-bold">Picked for You</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((rec) => (
          <div key={rec.event.id} className="relative group">
            <div className="absolute -top-3 left-2 z-10 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-200 shadow-sm">
                {rec.reason}
            </div>
            <EventCard event={rec.event} href={`/dashboard/events/${rec.event.id}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
