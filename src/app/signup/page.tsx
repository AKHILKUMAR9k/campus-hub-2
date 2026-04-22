// src/app/signup/page.tsx
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUpWithEmail, signOut } from '@/supabase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['student', 'club_organizer'], {
    required_error: 'Please select a role.',
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    // IMPORTANT: don't supply empty-string for role. leave it absent (undefined).
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      // role intentionally not here
    } as Partial<SignupFormValues>,
  });

  useEffect(() => {
    // if already logged in, go to dashboard
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      // Save pending profile to localStorage so provider can create DB row after the user confirms email/signs in
      try {
        localStorage.setItem('pendingUserProfile', JSON.stringify({
          full_name: data.fullName,
          role: data.role,
          email: data.email,
        }));
      } catch (e) {
        console.warn('Could not store pendingUserProfile', e);
      }

      // sign up using your auth wrapper (uses supabase.client.signUp)
      const { data: authData, error: authError } = await signUpWithEmail(
        data.email,
        data.password,
        {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
        }
      );

      if (authError) {
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: authError.message,
        });
        return;
      }

      // Check if we have a session immediately (Email Confirmation Disabled)
      if (authData?.session) {
        toast({
          title: 'Account Created',
          description: 'Redirecting to dashboard...',
        });
        router.push('/dashboard');
        return;
      }

      toast({
        title: 'Account Created',
        description: 'Check your email for confirmation. After confirming, sign in to continue.',
      });

      // We don't auto-sign-in — wait for email confirmation
      form.reset();
    } catch (err) {
      console.error('Signup Error:', err);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-lg font-medium">Redirecting to Dashboard...</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          If you are stuck here, your session might be out of sync.
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={() => window.location.href = '/dashboard'}
          >
            Force Go to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
          >
            Sign Out & Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold font-headline">Campus Hub</CardTitle>
            </div>
            <CardDescription>Create an account to join the community</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as any}>
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

