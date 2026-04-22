'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { supabase } from '@/supabase/client';
import { useAuth } from '@/supabase';
import { unregisterForEvent } from '@/app/dashboard/events/actions';
import { submitRating, getEventRatings } from '@/app/dashboard/events/rating-actions';

import { Loader2, Calendar, MapPin, Clock, Share2, MessageSquare, ArrowLeft, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StarRating from '@/components/star-rating';
import { EventRegistrationModal } from "@/components/event-registration-modal";
import { EventGallery } from "@/components/event-gallery";
import { CommentsSection } from "@/components/comments-section";
import { SocialShare } from "@/components/social-share";
import { CalendarButtons } from "@/components/calendar-buttons";

/* -------------------- TYPES -------------------- */

type Event = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  clubName?: string;
  category?: string;
  created_by: string;
  image_url?: string;
  is_completed?: boolean;
  club?: string; // Added based on new return block
};

type SimpleRegistration = {
  id: string;
  user_id: string;
};

type Rating = {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  user_id: string;
  users: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

/* -------------------- COMPONENT -------------------- */

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  
  const { user, isUserLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false); // Used for loading state of unregister mainly now
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Rating State
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState(0); // View only for user's own rating
  const [hasRated, setHasRated] = useState(false);
  const [formRating, setFormRating] = useState(0);
  
  // Modal State
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  /* ---------------- LOAD DATA ---------------- */
  
  const [role, setRole] = useState<string | null>(null);

    // Comments State
    // Comments State
    const [comments, setComments] = useState<any[]>([]);

    const loadComments = React.useCallback(async () => {
        if (!eventId) return;

        const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select(`
                *,
                user:users(first_name, last_name),
                likes:comment_likes(count)
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });
            
        if (commentsError) {
            console.error("Error loading comments:", commentsError);
            return;
        }
            
        if (commentsData) {
            const formattedComments = commentsData.map(c => ({
                ...c,
                likes_count: c.likes?.[0]?.count || 0,
                user_has_liked: false
            }));
            
            if (user) {
                const { data: userLikes } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .eq('user_id', user.id)
                    .in('comment_id', commentsData.map(c => c.id));
                
                const likedIds = new Set(userLikes?.map(l => l.comment_id));
                formattedComments.forEach(c => {
                    if (likedIds.has(c.id)) c.user_has_liked = true;
                });
            }
            setComments(formattedComments);
        }
    }, [eventId, user]);

    // Realtime subscription
    useEffect(() => {
        if (!eventId) return;

        const channel = supabase
            .channel(`event-comments-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    loadComments();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes'
                },
                () => {
                    loadComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, loadComments]);

    useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      setLoading(true);

      /* ---- Load event ---- */
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        setError(JSON.stringify(eventError, null, 2)); // Show real error
        setLoading(false);
        return;
      }
      if (!eventData) {
        setError('Event not found (No data returned)');
        setLoading(false);
        return;
      }

      setEvent(eventData);
      
      // Load Gallery - Safely
      let gallery: any[] = [];
      try {
        const { data: galleryData, error: galleryError } = await supabase
            .from('event_gallery')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });
        
        if (!galleryError && galleryData) {
            gallery = galleryData;
        }
      } catch (e) {
        console.warn("Gallery table likely missing, skipping.");
      }
      setGalleryImages(gallery);

      await loadComments();

      if (user) {
          // Fetch Role
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
          setRole(userData?.role || null);

          // Check registration status
          const { data: registration } = await supabase
            .from("registrations")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .single();
          
          setIsRegistered(!!registration);

          // Fetch user profile for pre-filling modal
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();
          setUserProfile(profile);

          // Load Ratings
          const { ratings: fetchedRatings, average, count } = await getEventRatings(eventId);
          setRatings(fetchedRatings as any);
          setAverageRating(average);
          setRatingCount(count);
          
          const userReview = fetchedRatings.find(r => r.user_id === user.id);
          if (userReview) {
            setHasRated(true);
            setUserRating(userReview.rating);
          }
      }

      setLoading(false);
    };

    loadData();
  }, [eventId, user, loadComments]);

  const refreshComments = async () => {
      if(!eventId) return;
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
            *,
            user:users(first_name, last_name, avatar),
            likes:comment_likes(count)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
        
      if (commentsData) {
           const formattedComments = commentsData.map(c => ({
               ...c,
               likes_count: c.likes?.[0]?.count || 0,
               user_has_liked: false 
           }));
           if (user) {
               const { data: userLikes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', commentsData.map(c => c.id));
               const likedIds = new Set(userLikes?.map(l => l.comment_id));
               formattedComments.forEach(c => {
                   if (likedIds.has(c.id)) c.user_has_liked = true;
               });
           }
           setComments(formattedComments);
      }
  };

  /* ---------------- ACTIONS ---------------- */

  const handleUnregister = async () => {
    if (!user || !event) return;
    setIsRegistering(true);
    try {
      const result = await unregisterForEvent(event.id, user.id);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Unregistration Failed', description: result.error });
      } else {
        toast({ title: 'Unregistered', description: 'You have been removed from this event.' });
        setIsRegistered(false);
        router.refresh();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong.' });
    } finally {
      setIsRegistering(false);
      setIsRegistrationModalOpen(false); // Close if open
    }
  };

  /* ---------------- RENDER ---------------- */

  if (isUserLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Event not found'}</AlertDescription>
      </Alert>
    );
  }

  const isOrganizer = user?.id === event.created_by;
  const isClubUser = role === 'club_organizer';
  const isAdmin = role === 'admin';
  const isPastEvent = new Date(event.date) < new Date();
  
  // Logic: 
  // - Students can register.
  // - Club Users (Organizers) CANNOT register.
  // - Admins/Organizers of this event can MANAGE.

  const canManage = isOrganizer || isAdmin;
  const canRegister = !isClubUser && !isAdmin && !isPastEvent;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        {canManage && (
            <Button asChild>
                <Link href={`/dashboard/manage-events/${event.id}`}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Registrations
                </Link>
            </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Event Image & Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm">
             {event.image_url ? (
                <div className="relative h-64 w-full">
                  <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
             
             <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                     <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">{event.title}</h1>
                     <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{event.category}</Badge>
                        {isPastEvent && <Badge variant="outline">Completed</Badge>}
                        {isClubUser && !canManage && <Badge variant="outline" className="border-blue-500 text-blue-500">Organizer View</Badge>}
                     </div>
                  </div>
                </div>
                
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                 {/* Long description if exists */}
             </div>
          </div>

            {/* Comments Section */}
            {user && (
                <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm p-6">
                    <CommentsSection 
                        eventId={event.id} 
                        userId={user.id} 
                        comments={comments} 
                        onCommentPosted={refreshComments} 
                    />
                </div>
            )}

           {/* Event Gallery */}
           <EventGallery images={galleryImages} />
          
           {/* Ratings Section - Same as before */}
            {isPastEvent && (
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     Event Ratings
                     <div className="flex items-center ml-4 gap-1 text-base font-normal">
                        <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                        <span className="text-muted-foreground">({ratingCount} reviews)</span>
                     </div>
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                   {user && !hasRated && !isOrganizer && !isClubUser && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                            <h3 className="font-semibold mb-2">Rate this event</h3>
                            {/* Rating Form form previous step */}
                            <form action={async (formData) => {
                                const rating = Number(formData.get('rating'));
                                const feedback = formData.get('feedback') as string;
                                const result = await submitRating(event.id, rating, feedback);
                                if(result.success) {
                                    // reload
                                    window.location.reload(); 
                                }
                            }} className="space-y-4">
                                <div className="space-y-2">
                                     <Label>Rating</Label>
                                     <input type="hidden" name="rating" id="rating-input" required />
                                     <StarRating rating={formRating} onRatingChange={(r) => {
                                         setFormRating(r);
                                         const input = document.getElementById('rating-input') as HTMLInputElement;
                                         if(input) input.value = r.toString();
                                     }} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Feedback</Label>
                                    <Textarea name="feedback" placeholder="Share your experience..." />
                                </div>
                                <Button type="submit">Submit Review</Button>
                            </form>
                        </div>
                   )}

                   <div className="space-y-4">
                     {ratings.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-semibold">
                                    {review.users?.first_name} {review.users?.last_name?.[0]}.
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <StarRating rating={review.rating} readonly size="sm" className="mb-2" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.feedback}</p>
                        </div>
                     ))}
                     {ratings.length === 0 && <p className="text-muted-foreground text-center py-4">No ratings yet.</p>}
                   </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right Column: Key Details & Action */}
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium">
                            {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                        </span>
                    </div>
                    <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-primary" />
                         <span className="font-medium">
                            {format(new Date(event.date), "h:mm a")}
                        </span>
                    </div>
                    <div className="flex items-center text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium">{event.venue}</span>
                    </div>
                    <div className="flex items-center text-sm">
                        <Users className="mr-2 h-4 w-4 text-primary" />
                         <span className="font-medium">
                            {event.club || "Campus Hub"}
                         </span>
                    </div>
                    
                    <Separator />
                    
                    {/* Action Button */}
                    {!isPastEvent && (
                        isRegistered ? (
                             <Button 
                                variant="destructive" 
                                className="w-full" 
                                onClick={handleUnregister}
                                disabled={isRegistering}
                             >
                                {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Unregister from Event
                             </Button>
                        ) : (
                             canRegister ? (
                                 <Button 
                                    className="w-full" 
                                    onClick={() => setIsRegistrationModalOpen(true)}
                                 >
                                    Register Now
                                 </Button>
                             ) : (
                                <Button variant="secondary" className="w-full" disabled>
                                    {isClubUser ? "Organizer Restricted" : "Registration Closed"}
                                </Button>
                             )
                        )
                    )}
                    
                    {isPastEvent && (
                        <Button variant="secondary" className="w-full" disabled>
                            Event Completed
                        </Button>
                    )}

                    <SocialShare title={event.title} eventId={event.id} />
                    <CalendarButtons event={event} />
                </CardContent>
            </Card>
        </div>
      </div>
      
      {/* Registration Modal */}
      {user && event && canRegister && (
          <EventRegistrationModal 
            isOpen={isRegistrationModalOpen}
            onClose={() => setIsRegistrationModalOpen(false)}
            eventId={event.id}
            userId={user.id}
            userProfile={userProfile}
            onSuccess={() => {
                setIsRegistered(true);
                router.refresh();
            }}
          />
      )}
    </div>
  );
}
