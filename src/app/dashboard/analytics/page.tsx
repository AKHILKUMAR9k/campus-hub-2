import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSystemStats, getRegistrationTrends, getPopularEvents } from './analytics-actions';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });
  const { data: { session } } = await supabase.auth.getSession();
  
  let filterId: string | undefined;
  
  if (session?.user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    // Only filter for club organizers. Admins see everything.
    if (profile?.role === 'club_organizer') {
      filterId = session.user.id;
    }
  }

  const stats = await getSystemStats(filterId);
  const trends = await getRegistrationTrends(filterId);
  const popularEvents = await getPopularEvents(filterId);

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            {filterId ? 'Club Analytics' : 'Analytics Overview'}
          </h1>
          <p className="text-muted-foreground">
            {filterId ? 'Monitor your club\'s performance' : 'Monitor key metrics and platform growth'}
          </p>
       </div>
       
       <AnalyticsDashboard 
          stats={stats} 
          trends={trends} 
          popularEvents={popularEvents} 
       />
    </div>
  );
}
