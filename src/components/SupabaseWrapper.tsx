
'use client';

import React, { ReactNode } from 'react';
import { SupabaseProvider } from '@/supabase/provider';

interface SupabaseWrapperProps {
  children: ReactNode;
}

export function SupabaseWrapper({ children }: SupabaseWrapperProps) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
