'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import ClubCard from '@/components/club-card';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logo: string | null;
  organizer_id: string | null;
  status?: string;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      // Only fetch approved clubs
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'approved')
        .order('name'); 

      if (error) {
        console.error('Error fetching clubs:', error);
      } else {
        setClubs(data || []);
      }
      setLoading(false);
    };

    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (club.description && club.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
    (club.category && club.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Student Clubs</h1>
          <p className="text-muted-foreground">Explore and join the vibrant communities on campus</p>
          <div className="mt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/clubs/apply">
                Apply to Start a Club
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search clubs..."
             className="pl-9"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse" />
           ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-slate-50 dark:bg-slate-900 border-dashed">
             <div className="rounded-full bg-muted p-4 mb-3">
               <Search className="h-6 w-6 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-semibold">No clubs found</h3>
             <p className="text-muted-foreground max-w-sm mt-1">
               We couldn't find any clubs matching {debouncedSearchQuery ? `"${debouncedSearchQuery}"` : "your criteria"}.
             </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}
