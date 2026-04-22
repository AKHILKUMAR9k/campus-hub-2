'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { getSuggestedTags } from '@/app/actions';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import { useDoc } from '@/supabase';
import { useAuth } from '@/supabase';
import { supabase } from '@/supabase/client';
import type { User, Event } from '@/lib/types';
import { uploadToStorage } from '@/supabase/utils';

const categories = ['Tech', 'Music', 'Sports', 'Art', 'Cultural', 'Career'];

const eventFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  longDescription: z.string().optional(),
  date: z.instanceof(Date),
  time: z.string(),
  venue: z.string(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  clubName: z.string().min(2),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EventForm({ existingEvent }: { existingEvent?: Event }) {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggesting, startSuggest] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const { data: userProfile } = useDoc<User>('users', user?.id);

  const isOrganizer =
    userProfile?.role === 'club_organizer' ||
    userProfile?.role === 'admin';

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: existingEvent?.title || '',
      description: existingEvent?.description || '',
      longDescription: existingEvent?.longDescription || '',
      date: existingEvent ? new Date(existingEvent.date) : undefined,
      time: existingEvent?.time || '10:00',
      venue: existingEvent?.venue || '',
      category: existingEvent?.category || '',
      tags: existingEvent?.tags || [],
      image: existingEvent?.image || existingEvent?.image_url || '',
      clubName: existingEvent?.clubName || existingEvent?.club || '',
    },
  });

  const descriptionValue = useWatch({
    control: form.control,
    name: 'description',
  });

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      form.setValue('image', dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: EventFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated!' });
      return;
    }

    setIsSubmitting(true);

    try {
      /** 1️⃣ Upload poster if needed **/
      let imageUrl = values.image || null;

      if (imageUrl && imageUrl.startsWith('data:')) {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] || 'jpg';

        const filePath = `events/${user.id}/${Date.now()}.${ext}`;

        imageUrl = await uploadToStorage(blob, filePath, 'event-images');
      }

      /** 2️⃣ Prepare API payload **/
      const payload = {
        title: values.title,
        description: values.description,
        longDescription: values.longDescription || '',
        date: values.date.toISOString(),
        time: values.time,
        venue: values.venue,
        category: values.category,
        tags: values.tags || [],
        imageUrl: imageUrl, // Can be null (cleared) or new URL or old URL
        clubName: values.clubName,
        registrationLink: null,
      };

      /** 3️⃣ Get access token **/
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Could not get auth token!',
        });
        return;
      }

      /** 4️⃣ Call server API **/
      let url = '/api/events/create';
      let method = 'POST';

      if (existingEvent) {
          url = `/api/events/${existingEvent.id}`;
          method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Event creation/update failed');
      }

      toast({ title: existingEvent ? 'Event Updated Successfully!' : 'Event Created Successfully!' });
      
      if (!existingEvent) {
          form.reset();
          setSuggestedTags([]);
      }
      
      router.push('/dashboard/manage-events');
      router.refresh();
      
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Operation failed!',
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function addTag(tag: string) {
    const tags = form.getValues('tags') || [];
    if (!tags.includes(tag)) {
      form.setValue('tags', [...tags, tag]);
    }
  }

  function removeTag(tag: string) {
    const tags = form.getValues('tags') || [];
    form.setValue(
      'tags',
      tags.filter((t) => t !== tag)
    );
  }

  async function handleSuggestTags() {
    if (!descriptionValue || descriptionValue.length < 20) {
      toast({
        variant: 'destructive',
        title: 'Description too short!',
      });
      return;
    }
    startSuggest(async () => {
      const result = await getSuggestedTags(descriptionValue);
      if ('tags' in result) {
        setSuggestedTags(result.tags);
      }
    });
  }

  if (!isOrganizer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You are not allowed</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You must be a club organizer to create events.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Title + Club */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech Fest 2025" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clubName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Developer Club" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Venue */}
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Auditorium" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This appears on event cards"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Full details */}
            <FormField
              control={form.control}
              name="longDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full event details"
                      className="min-h-[180px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Date, Time, Category */}
            <div className="grid md:grid-cols-3 gap-6">

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full text-left',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                          <CalendarIcon className="ml-auto h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              {/* Time */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

            </div>

            {/* AI Suggested Tags */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSuggestTags}
                disabled={!descriptionValue || descriptionValue.length < 20}
              >
                {isSuggesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Suggest Tags
              </Button>

              {suggestedTags.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="cursor-pointer"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="p-3 border rounded min-h-[50px]">
                      {field.value && field.value.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag) => (
                            <Badge key={tag}>
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Add tags for better discovery
                        </p>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Poster</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-5">
                      <div className="w-48 h-32 bg-muted/40 flex items-center justify-center rounded overflow-hidden">
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            width={192}
                            height={128}
                            className="object-cover w-full h-full"
                            alt="Poster preview"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Upload className="mx-auto h-8 w-8" />
                            <p className="text-xs mt-1">Preview</p>
                          </div>
                        )}
                      </div>

                      <input
                        id="poster"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <label
                        htmlFor="poster"
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'cursor-pointer'
                        )}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </label>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {existingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

