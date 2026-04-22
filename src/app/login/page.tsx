'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmail, signOut } from '@/supabase/auth';
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const { error } = await signInWithEmail(data.email, data.password);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'Redirecting to dashboard...',
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Login Error:', err);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
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

  // If user is already logged in, show a redirecting state but allow escape
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
            <CardDescription>Welcome back! Please login to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
