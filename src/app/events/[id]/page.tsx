import { createServerClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowLeft, Clock, GraduationCap, Share2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function PublicEventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    notFound();
  }

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
        <Button variant="ghost" className="mb-8" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border">
              <Image 
                src={event.image_url || "/images/placeholder-event.jpg"} 
                alt={event.title}
                fill
                className="object-cover"
              />
              <Badge className="absolute top-6 left-6 text-lg py-1 px-4">{event.category}</Badge>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">{event.title}</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>

            <Separator />

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">About this event</h2>
              <p className="whitespace-pre-wrap text-lg text-foreground/80">
                {event.long_description || event.description || "No further details provided."}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border rounded-3xl p-8 shadow-xl sticky top-24">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                    <p className="text-lg font-bold">{formatDate(event.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Time</p>
                    <p className="text-lg font-bold">{event.time ? formatTime(event.time) : 'To be announced'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Venue</p>
                    <p className="text-lg font-bold">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Organized by</p>
                    <p className="text-lg font-bold">{event.club || "Campus Hub"}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" asChild>
                  <Link href="/signup">Register Now</Link>
                </Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-medium" asChild>
                   <Link href={`/login?redirect=/dashboard/events/${event.id}`}>
                      Login to join
                   </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share with friends</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
