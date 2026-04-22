'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/supabase';
import { useAuth } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const clubSchema = z.object({
  name: z.string().min(3, 'Club name must be at least 3 characters.'),
  description: z.string().min(20, 'Please provide a detailed description (min 20 chars).'),
  category: z.string().min(1, 'Please select a category.'),
});

type ClubFormValues = z.infer<typeof clubSchema>;

export default function ClubApplicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  const onSubmit = async (values: ClubFormValues) => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('clubs').insert({
        name: values.name,
        description: values.description,
        category: values.category,
        organizer_id: user.id,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Application Submitted!',
        description: 'Your club application is now pending admin approval.',
      });

      router.push('/dashboard/clubs');
    } catch (error: any) {
      console.error('Club application error details:', JSON.stringify(error, null, 2));
      console.error('Raw error object:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/dashboard/clubs">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clubs
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Start a New Club</CardTitle>
          <CardDescription>
            Fill out this form to apply for club organizer status and create a new campus community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Coding Club, Photography Society" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Tech, Art, Music, Sports" {...field} />
                    </FormControl>
                    <FormDescription>Choose a category that best describes your club.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your club's mission, activities, and why students should join..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
