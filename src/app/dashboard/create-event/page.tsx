'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAuth } from '@/supabase';
import EventForm from "@/components/event-form";
import { Loader2 } from 'lucide-react';

export default function CreateEventPage() {
    const { user, isUserLoading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const checkRole = async () => {
            const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (profile?.role === 'club_organizer' || profile?.role === 'admin') {
                setIsAuthorized(true);
            } else {
                router.push('/dashboard');
            }
        };

        checkRole();
    }, [user, isUserLoading, router]);

    if (isUserLoading || isAuthorized === null) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Checking permissions...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold font-headline mb-8">Create New Event</h1>
            <EventForm />
        </div>
    );
}
