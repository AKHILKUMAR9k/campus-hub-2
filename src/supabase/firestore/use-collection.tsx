'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection<T = any>(
  table: string,
  options?: {
    query?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let queryBuilder = supabase.from(table).select(options?.query || '*');

    // Apply filters if provided
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
    }

    // Apply ordering if provided
    if (options?.orderBy) {
      queryBuilder = queryBuilder.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }

    const fetchData = async () => {
      try {
        const { data: result, error: fetchError } = await queryBuilder;
        if (fetchError) {
          setError(new Error(fetchError.message));
        } else {
          setData((result as unknown) as WithId<T>[]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          fetchData(); // Refetch data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, options?.filters, options?.orderBy, options?.query]);

  return { data, isLoading, error };
}
