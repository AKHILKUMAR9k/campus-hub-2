'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/supabase';
import EventForm from '@/components/event-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditEventPage() {
  const { id } = useParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Error fetching event:', error);
        router.push('/dashboard/manage-events');
        return;
      }
      
      // 2. Fetch user role for permission check
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      const isAdmin = profile?.role === 'admin';

      if (data.created_by !== user.id && !isAdmin) {
          router.push('/dashboard/manage-events');
          return;
      }

      setEvent(data);
      setLoading(false);
    };

    fetchEvent();
  }, [eventId, user, router]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Edit Event</h1>
            <Button variant="outline" asChild>
                <Link href={`/dashboard/manage-events/${eventId}`}>Cancel</Link>
            </Button>
        </div>
        
        <EventForm existingEvent={event} />
    </div>
  );
}
