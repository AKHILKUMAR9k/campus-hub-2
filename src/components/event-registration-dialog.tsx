'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Ticket, UserCheck, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { supabase } from '@/supabase';
import { useAuth } from '@/supabase';
import type { Event, User, Registration } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const registrationSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  roll_number: z.string().min(3, 'Roll number is required'),
  branch: z.string().min(2, 'Branch is required'),
  section: z.string().min(1, 'Section is required'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface Props {
  event: Event;
  userProfile: User;
  isRegistered: boolean;
  registration: Registration | null;
}

export default function EventRegistrationDialog({
  event,
  userProfile,
  isRegistered,
  registration,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim(),
      roll_number: userProfile.roll_number ?? '',
      branch: userProfile.branch ?? '',
      section: userProfile.section ?? '',
    },
  });

  useEffect(() => {
    if (!registration) return;

    form.reset({
      fullName: registration.full_name,
      roll_number: registration.roll_number ?? '',
      branch: registration.branch ?? '',
      section: registration.section ?? '',
    });
  }, [registration, form]);

  // 🔹 REGISTER
  const onSubmit = async (values: RegistrationFormValues) => {
    if (!user) return;

    const payload = {
      event_id: event.id,
      user_id: user.id,
      full_name: values.fullName,
      email: userProfile.email,
      roll_number: values.roll_number,
      branch: values.branch,
      section: values.section,
      title: event.title,
      date: event.date,
      registration_date: new Date().toISOString(),
    };

    const { error } = await supabase.from('registrations').insert(payload);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message,
      });
      return;
    }

    toast({
      title: 'Registration successful',
      description: `You are registered for ${event.title}`,
    });

    setOpen(false);
  };

  // 🔹 UNREGISTER
  const handleUnregister = async () => {
    if (!registration) return;

    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registration.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Unregister failed',
        description: error.message,
      });
      return;
    }

    toast({
      title: 'Unregistered',
      description: `You are no longer registered for ${event.title}`,
    });
  };

  if (isRegistered) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary">
            <UserCheck className="mr-2 h-4 w-4" />
            You are registered
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to unregister from <strong>{event.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnregister}>
              <XCircle className="mr-2 h-4 w-4" />
              Unregister
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Ticket className="mr-2 h-4 w-4" />
        Register
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register for {event.title}</DialogTitle>
          <DialogDescription>
            Please confirm your details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roll_number"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
