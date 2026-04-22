'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-4 mt-4">
        <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
        </Button>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    </div>
  );
}
