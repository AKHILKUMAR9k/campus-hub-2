'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth, useDoc } from '@/supabase';
import { supabase } from '@/supabase/client';
import { User } from '@/lib/types';
import { updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(["student", "club_organizer", "admin"], { required_error: "Please select a role." }),
  rollNumber: z.string().optional(),
  branch: z.string().optional(),
  section: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailReminders: z.boolean(),
  emailComments: z.boolean(),
  emailRegistrations: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function SettingsPage() {
  const { user, isUserLoading } = useAuth();
  const { toast } = useToast();

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>('users', user?.id, '*');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
        firstName: '',
        lastName: '',
        role: 'student',
        rollNumber: '',
        branch: '',
        section: '',
    }
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailReminders: true,
      emailComments: true,
      emailRegistrations: true,
    }
  });

  useEffect(() => {
    if (userProfile) {
        profileForm.reset({
            firstName: userProfile.first_name || '',
            lastName: userProfile.last_name || '',
            role: userProfile.role || 'student',
            rollNumber: userProfile.roll_number || userProfile.rollNumber || '',
            branch: userProfile.branch || '',
            section: userProfile.section || '',
        });

        notificationForm.reset({
          emailReminders: userProfile.emailPreferences?.eventReminders !== false,
          emailComments: userProfile.emailPreferences?.commentReplies !== false,
          emailRegistrations: userProfile.emailPreferences?.registrationConfirmations !== false,
        });
    }
  }, [userProfile, profileForm, notificationForm]);

  const onProfileSubmit = (data: ProfileFormValues) => {
    if (!user?.id) return;

    updateDocumentNonBlocking('users', {
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      rollNumber: data.rollNumber,
      branch: data.branch,
      section: data.section,
    }, user.id);

    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved.',
    });
  };

  const createProfile = async (data: ProfileFormValues) => {
    if (!user?.id) return;

    const profileData = {
      id: user.id,
      email: user.email!,
      first_name: data.firstName,
      last_name: data.lastName,
      rollNumber: data.rollNumber,
      branch: data.branch,
      section: data.section,
      role: 'student', // Default role for created profiles
    };

    const { error } = await supabase.from('users').insert(profileData);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error Creating Profile",
        description: error.message,
      });
    } else {
      toast({
        title: 'Profile Created',
        description: 'Your profile has been created successfully.',
      });
    }
  };

  const onNotificationSubmit = (data: NotificationFormValues) => {
    if (!user?.id) return;

    updateDocumentNonBlocking('users', {
      emailPreferences: {
        eventReminders: data.emailReminders,
        commentReplies: data.emailComments,
        registrationConfirmations: data.emailRegistrations,
      }
    }, user.id);

    toast({
      title: 'Notification Preferences Updated',
      description: 'Your email preferences have been saved.',
    });
  };

  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information and profile details.</CardDescription>
        </CardHeader>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                      {userProfile?.avatar && <AvatarImage src={userProfile.avatar} alt={`${userProfile?.first_name} ${userProfile?.last_name}`} />}
                      <AvatarFallback className="text-2xl">
                          {userProfile?.first_name?.charAt(0)}{userProfile?.last_name?.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  <div>
                      <p className="font-semibold">{userProfile?.first_name} {userProfile?.last_name}</p>
                      <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                  </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                          <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                   <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                          <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>
              <FormField
                control={profileForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="club_organizer">Club Organizer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {profileForm.watch('role') === 'student' && (
                  <>
                  <FormField
                      control={profileForm.control}
                      name="rollNumber"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Roll Number</FormLabel>
                          <FormControl>
                          <Input {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                       <FormField
                      control={profileForm.control}
                      name="branch"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                              <Input {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                       <FormField
                      control={profileForm.control}
                      name="section"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Section</FormLabel>
                          <FormControl>
                              <Input {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  </div>
                  </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              {userProfile ? (
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                     {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Profile Changes
                </Button>
              ) : (
                <Button type="button" onClick={() => createProfile(profileForm.getValues())} disabled={profileForm.formState.isSubmitting}>
                     {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Profile
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Notification Preferences */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which email notifications you'd like to receive.</CardDescription>
        </CardHeader>
        <Form {...notificationForm}>
          <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={notificationForm.control}
                name="emailReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Event Reminders</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Receive email reminders for events you've registered for
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notificationForm.control}
                name="emailComments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Comment Notifications</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Get notified when someone comments on your events
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notificationForm.control}
                name="emailRegistrations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Registration Confirmations</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Receive confirmation emails when you register for events
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={notificationForm.formState.isSubmitting}>
                   {notificationForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notification Preferences
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
