'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Loader2, 
  Download, 
  Trash2, 
  Search,
  MoreHorizontal,
  PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { supabase } from '@/supabase';
import { useAuth } from '@/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { unregisterForEvent } from '@/app/dashboard/events/actions';

type Registration = {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  roll_number: string;
  branch: string;
  section: string;
  year: string;
  phone: string;
  registration_date: string;
};

type EventDetails = {
  id: string;
  title: string;
  date: string;
  venue: string;
};

export default function ManageEventDetailsPage() {
  const { id } = useParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  /* ---------------- GALLERY STATE ---------------- */
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  useEffect(() => {
    if (!eventId || !user) return;

    const loadData = async () => {
      setLoading(true);
      
      // 1. Fetch Event Details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, date, venue, created_by')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        toast({ variant: 'destructive', title: 'Error', description: 'Event not found' });
        router.push('/dashboard/manage-events');
        return;
      }

      // 2. Fetch user role for permission check
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      const isAdmin = profile?.role === 'admin';

      if (eventData.created_by !== user.id && !isAdmin) {
         toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to manage this event.' });
         router.push('/dashboard/manage-events');
         return;
      }

      setEvent(eventData);

      // 2. Fetch Registrations
      const { data: regs, error: regsError } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false });

      if (regsError) {
        console.error('Error fetching registrations:', regsError);
      } else {
        setRegistrations(regs as Registration[]);
      }

      // 3. Fetch Gallery Images
      const { data: gallery, error: galleryError } = await supabase
        .from('event_gallery')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
        
      if (!galleryError) {
        setGalleryImages(gallery || []);
      }

      setLoading(false);
    };

    loadData();
  }, [eventId, user, router, toast]);

  const handleRemoveStudent = async (userId: string, registrationId: number) => {
    if (!eventId) return;
    if (!confirm('Are you sure you want to remove this student from the event?')) return;

    // Use the existing unregister action (wraps database delete)
    // Note: unregisterForEvent requires eventId and userId.
    const result = await unregisterForEvent(eventId, userId);

    if (result.success) {
      toast({ title: 'Removed', description: 'Student removed from event.' });
      setRegistrations(registrations.filter(r => r.id !== registrationId));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const handleValidation = () => {
      if(!newImageUrl.trim()) {
           toast({ variant: 'destructive', title: 'Error', description: 'Please enter an image URL.' });
           return false;
      }
      return true;
  }

  // Import dynamically to avoid server action issues in client component if possible, 
  // or just use the imported ones from top level if Next.js handles it (it does).
  const { uploadGalleryImage, deleteGalleryImage } = require('../gallery-actions');

  const handleAddImage = async () => {
    if (!handleValidation()) return;
    
    setUploading(true);
    const result = await uploadGalleryImage(eventId, newImageUrl, newImageCaption);
    
    if (result.success) {
        toast({ title: 'Success', description: 'Image added to gallery.' });
        setNewImageUrl('');
        setNewImageCaption('');
        // Refresh local state
        const { data } = await supabase.from('event_gallery').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
        setGalleryImages(data || []);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setUploading(false);
  };

  const handleDeleteImage = async (galleryId: string) => {
    if(!confirm("Delete this image?")) return;
    
    const result = await deleteGalleryImage(galleryId, eventId);
    if (result.success) {
        toast({ title: 'Deleted', description: 'Image removed.' });
         setGalleryImages(galleryImages.filter(img => img.id !== galleryId));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const filteredRegistrations = registrations.filter(reg => 
    reg.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    if (!registrations.length) return;

    const headers = ['Full Name', 'Email', 'Roll Number', 'Branch', 'Year', 'Section', 'Phone', 'Registration Date'];
    const csvContent = [
      headers.join(','),
      ...registrations.map(r => [
        `"${r.full_name || ''}"`,
        `"${r.email || ''}"`,
        `"${r.roll_number || ''}"`,
        `"${r.branch || ''}"`,
        `"${r.year || ''}"`,
        `"${r.section || ''}"`,
        `"${r.phone || ''}"`,
        `"${new Date(r.registration_date).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.title}_registrations.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
     return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/manage-events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
           <h1 className="text-2xl font-bold tracking-tight">{event?.title}</h1>
           <p className="text-muted-foreground">
             {event && format(new Date(event.date), "PPP")} • {registrations.length} Registrations
           </p>
        </div>
        <div className="ml-auto flex gap-2">
            <Button variant="outline" asChild>
                <Link href={`/dashboard/manage-events/${eventId}/edit`}>
                    Edit Event
                </Link>
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={registrations.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Management */}
        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>Registered Students</CardTitle>
            <CardDescription>
                Manage student registrations for this event.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                    placeholder="Search by name, roll no, or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Branch / Year</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRegistrations.length > 0 ? (
                        filteredRegistrations.map((bg) => (
                        <TableRow key={bg.id}>
                            <TableCell className="font-medium">
                                <div>{bg.full_name}</div>
                                <div className="text-xs text-muted-foreground">{bg.email}</div>
                            </TableCell>
                            <TableCell>{bg.roll_number}</TableCell>
                            <TableCell>
                                {bg.branch} <span className="text-muted-foreground">/ {bg.year}</span>
                            </TableCell>
                            <TableCell>{bg.section}</TableCell>
                            <TableCell>{bg.phone || '-'}</TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-red-600 cursor-pointer"
                                        onClick={() => handleRemoveStudent(bg.user_id, bg.id)}
                                    >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Student
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No registrations found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>

        {/* Gallery Management */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Event Gallery</CardTitle>
                <CardDescription>Upload photos from the event (e.g. from Past Events).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex gap-4 items-start">
                    <div className="grid gap-2 flex-1">
                        <Label>Image URL (from Cloudinary/Imgur etc.)</Label>
                        <Input 
                            value={newImageUrl} 
                            onChange={(e) => setNewImageUrl(e.target.value)} 
                            placeholder="https://..." 
                        />
                    </div>
                    <div className="grid gap-2 flex-1">
                         <Label>Caption (Optional)</Label>
                         <Input 
                            value={newImageCaption} 
                            onChange={(e) => setNewImageCaption(e.target.value)} 
                            placeholder="Winning moment..." 
                        />
                    </div>
                    <Button className="mt-8" onClick={handleAddImage} disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                        Add Photo
                    </Button>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {galleryImages.map((img) => (
                         <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                             <div className="aspect-video relative">
                                 <Image src={img.image_url} alt="Gallery" fill className="object-cover" />
                             </div>
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Button variant="destructive" size="sm" onClick={() => handleDeleteImage(img.id)}>
                                     <Trash2 className="h-4 w-4" />
                                 </Button>
                             </div>
                             {img.caption && (
                                 <div className="p-2 text-xs text-center border-t bg-muted truncate">
                                     {img.caption}
                                 </div>
                             )}
                         </div>
                     ))}
                     {galleryImages.length === 0 && (
                         <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                             No photos uploaded yet.
                         </div>
                     )}
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
