'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/supabase';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Building, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';
import { useToast } from '@/hooks/use-toast';
import { User, Club } from '@/lib/types';
import { updateUserRole, approveClub, rejectClub, updateUserStatus, deleteUser, deleteEvent } from './actions';
import { Trash2, ShieldAlert, ShieldCheck as ShieldCheckIcon, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New state for analytics
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalClubs: 0,
    pendingClubs: 0,
  });
  const [trends, setTrends] = useState<{ date: string; count: number }[]>([]);
  const [popularEvents, setPopularEvents] = useState<{ name: string; value: number }[]>([]);

  const fetchData = React.useCallback(async () => {
     try {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        setUsers(usersData as User[]);

        const { data: clubsData, error: clubsError } = await supabase
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false });

        if (clubsError) throw clubsError;
        setClubs(clubsData as Club[]);

        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (eventsError) {
          console.error('Events Fetch Error:', {
            message: eventsError.message,
            details: eventsError.details,
            hint: eventsError.hint,
            code: eventsError.code
          });
          throw eventsError;
        }
        setEvents(eventsData || []);

     } catch (error: any) {
        console.error('Full Admin Data Fetch Error:', error);
        toast({ 
            variant: 'destructive', 
            title: 'Fetch Error', 
            description: error.message || 'Check console for details.' 
        });
     }
  }, [toast]);

  const fetchAnalytics = React.useCallback(async () => {
    try {
        // 1. Total Stats
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: clubCount } = await supabase.from('clubs').select('*', { count: 'exact', head: true });
        const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
        const { count: pendingClubCount } = await supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('status', 'pending');

        setStats({
            totalUsers: userCount || 0,
            totalClubs: clubCount || 0,
            totalEvents: eventCount || 0,
            pendingClubs: pendingClubCount || 0,
        });

        // 2. Registration Trends (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: registrations } = await supabase
            .from('registrations')
            .select('registration_date')
            .gte('registration_date', thirtyDaysAgo.toISOString());

        if (registrations) {
            const trendMap = new Map<string, number>();
            registrations.forEach(reg => {
                const date = new Date(reg.registration_date).toISOString().split('T')[0];
                trendMap.set(date, (trendMap.get(date) || 0) + 1);
            });
            
            // Fill in missing days
            const trendData = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                trendData.unshift({
                    date: dateStr,
                    count: trendMap.get(dateStr) || 0
                });
            }
            setTrends(trendData);
        }

        // 3. Popular Events
        const { data: popularData } = await supabase
            .from('registrations')
            .select('event_id, events(title)')
            .limit(100); 
            
        if (popularData) {
            const eventCounts = new Map<string, number>();
            popularData.forEach((reg: any) => {
                const title = reg.events?.title || 'Unknown Event';
                eventCounts.set(title, (eventCounts.get(title) || 0) + 1);
            });
            
            const sortedEvents = Array.from(eventCounts.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
                
            setPopularEvents(sortedEvents);
        }

    } catch (error) {
        console.error('Error fetching analytics:', error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/');
        return;
      }

      // Check if user has admin role
      const checkAdminRole = async () => {
        try {
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error || userProfile?.role !== 'admin') {
            router.push('/dashboard');
            return;
          }

          // User is admin, fetch data
          fetchData();
          fetchAnalytics(); 
        } catch (error) {
          console.error('Error checking admin role:', error);
          router.push('/dashboard');
        }
      };

      checkAdminRole();
    }
  }, [user, isUserLoading, router, fetchData, fetchAnalytics]);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
      try {
          const result = await updateUserRole(userId, newRole);
          if (result.error) throw new Error(result.error);
          
          toast({ title: 'Success', description: `User role updated to ${newRole}` });
          // Optimistic update
          setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update user role.' });
      }
  };

  const handleApproveClub = async (clubId: string) => {
      try {
          const result = await approveClub(clubId);
          if (result.error) throw new Error(result.error);

          toast({ title: 'Success', description: 'Club approved' });
          setClubs(clubs.map(c => c.id === clubId ? { ...c, status: 'approved' } : c));
          
          // Also update pending count
          setStats(prev => ({ ...prev, pendingClubs: Math.max(0, prev.pendingClubs - 1) }));
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to approve club.' });
      }
  };

  const handleRejectClub = async (clubId: string) => {
      try {
            const result = await rejectClub(clubId);
            if (result.error) throw new Error(result.error);
    
            toast({ title: 'Success', description: 'Club rejected' });
            setClubs(clubs.map(c => c.id === clubId ? { ...c, status: 'rejected' } : c));

            // Also update pending count
            setStats(prev => ({ ...prev, pendingClubs: Math.max(0, prev.pendingClubs - 1) }));
      } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to reject club.' });
      }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: "active" | "banned") => {
      if(!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'BAN' : 'UNBAN'} this user?`)) return;
      try {
          const result = await updateUserStatus(userId, newStatus);
          if (result.error) throw new Error(result.error);
          toast({ title: 'Success', description: `User ${newStatus === 'banned' ? 'banned' : 'activated'}` });
          setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if(!confirm("Are you sure you want to DELETE this user profile? This cannot be undone.")) return;
      try {
          const result = await deleteUser(userId);
          if (result.error) throw new Error(result.error);
          toast({ title: 'Success', description: 'User profile deleted' });
          setUsers(users.filter(u => u.id !== userId));
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  const handleDeleteEvent = async (eventId: string) => {
      if(!confirm("Are you sure you want to DELETE this event? All registrations and comments will be lost.")) return;
      try {
          const result = await deleteEvent(eventId);
          if (result.error) throw new Error(result.error);
          toast({ title: 'Success', description: 'Event deleted successfully' });
          setEvents(events.filter(e => e.id !== eventId));
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  if (isUserLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, clubs, and view insights</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Clubs ({clubs.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Events ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard stats={stats} trends={trends} popularEvents={popularEvents} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'club_organizer' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                        {user.organizer_status && (
                          <Badge variant="outline">{user.organizer_status}</Badge>
                        )}
                        {user.status === 'banned' && (
                          <Badge variant="destructive">Banned</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.role !== 'admin' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateUserRole(user.id, 'student')}
                            disabled={user.role === 'student'}
                          >
                            Make Student
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateUserRole(user.id, 'club_organizer')}
                            disabled={user.role === 'club_organizer'}
                          >
                            Make Organizer
                          </Button>
                          <Button
                            size="sm"
                            variant={user.status === 'banned' ? 'default' : 'outline'}
                            className={user.status !== 'banned' ? 'text-orange-600 border-orange-200' : ''}
                            onClick={() => handleUpdateUserStatus(user.id, user.status === 'banned' ? 'active' : 'banned')}
                          >
                            {user.status === 'banned' ? <ShieldCheckIcon className="h-4 w-4 mr-1" /> : <ShieldAlert className="h-4 w-4 mr-1" />}
                            {user.status === 'banned' ? 'Unban' : 'Ban'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Club Management</CardTitle>
              <CardDescription>Approve or reject club applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clubs.map((club) => (
                  <div key={club.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-medium">{club.name}</p>
                      <p className="text-sm text-muted-foreground">{club.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{club.category}</Badge>
                        <Badge
                          variant={
                            club.status === 'approved' ? 'default' :
                            club.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {club.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {club.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveClub(club.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectClub(club.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Platform Events</CardTitle>
              <CardDescription>Monitor and moderate all events on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{event.title}</p>
                        {new Date(event.date) < new Date() && <Badge variant="outline">Past</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} at {event.venue}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Organizer ID: {event.created_by?.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                         <Link href={`/dashboard/events/${event.id}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                         <Link href={`/dashboard/manage-events/${event.id}`}>Manage</Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                         <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className="text-center py-8 text-muted-foreground">No events found.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
