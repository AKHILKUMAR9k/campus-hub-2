'use client';

import { useAuth, useDoc } from '@/supabase';
import { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Mail, User as UserIcon, GraduationCap, Building, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, isUserLoading } = useAuth();

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>('users', user?.id, '*');

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>Profile not found. Please go to Settings to create or update your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/settings">Go to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            {userProfile.avatar && <AvatarImage src={userProfile.avatar} alt={`${userProfile.first_name} ${userProfile.last_name}`} />}
            <AvatarFallback className="text-3xl">
              {userProfile.first_name?.charAt(0)}{userProfile.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{userProfile.first_name} {userProfile.last_name}</CardTitle>
          <CardDescription>
             <Badge variant={userProfile.role === 'admin' ? 'destructive' : 'secondary'}>
                {userProfile.role.replace('_', ' ')}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{userProfile.email}</span>
            </div>
            {userProfile.role === 'student' && (
                <>
                     <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{userProfile.roll_number || userProfile.rollNumber || 'Not set'}</span>
                    </div>
                     <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{userProfile.branch || 'Not set'} - {userProfile.section || 'Not set'}</span>
                    </div>
                </>
            )}
             {userProfile.role === 'club_organizer' && (
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Manages {userProfile.club_ids?.length || 0} clubs</span>
                </div>
            )}
             <Button asChild className="w-full mt-6">
                <Link href="/dashboard/settings">Edit Profile</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
