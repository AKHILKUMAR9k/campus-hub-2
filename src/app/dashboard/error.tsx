'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/50 shadow-lg">
        <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-destructive/10 p-3 w-fit mb-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Dashboard Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>We encountered an issue while loading your dashboard.</p>
          <p className="text-sm mt-2 opacity-70">
            {error.message || "Unknown error occurred."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Reload Dashboard
          </Button>
          <Button onClick={() => reset()}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
