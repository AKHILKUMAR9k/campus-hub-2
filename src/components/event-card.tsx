import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Event } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDate, formatTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { motion } from 'framer-motion';

type EventCardProps = {
  event: Event;
  href?: string;
};

export default function EventCard({ event, href }: EventCardProps) {
  const targetHref = href || `/events/${event.id}`;
  // Deterministic image based on event ID to avoid hydration mismatches
  const placeholderIndex = event.id.charCodeAt(0) % PlaceHolderImages.length;
  const eventImage = PlaceHolderImages[placeholderIndex];
  const imageUrl = event.image_url || eventImage?.imageUrl;

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 border-border/50">
        {/* ... (Card Content) ... */}
        <CardHeader className="p-0 relative">
        <Link href={targetHref}>
            {imageUrl ? (
            <Image
                src={imageUrl}
                alt={event.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
                data-ai-hint={eventImage?.imageHint}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
            />
            ) : <div className="w-full h-48 bg-muted" />}
        </Link>
        {event.category && <Badge variant="secondary" className="absolute top-2 right-2 backdrop-blur-md bg-background/80">{event.category}</Badge>}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start gap-3 mb-2">
           <div>
              <CardTitle className="text-lg font-headline mb-1 leading-tight group-hover:text-primary transition-colors">{event.title}</CardTitle>
              <CardDescription className="text-sm">{(event as any).clubName || (event as any).club}</CardDescription>
           </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.date)} at {event.time ? formatTime(event.time) : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.venue}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 border-t">
        <div className="flex items-center w-full">
            <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{event.registrationCount ?? 0} going</span>
            </div>
             <Button asChild size="sm" className="ml-auto hover:scale-105 transition-transform">
                <Link href={targetHref}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardFooter>
      </Card>
    </motion.div>
  );
}
