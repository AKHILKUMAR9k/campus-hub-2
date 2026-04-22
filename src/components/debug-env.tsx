"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugEnv() {
  const [envStatus, setEnvStatus] = useState<any>({});

  useEffect(() => {
    setEnvStatus({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      isKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  }, []);

  return (
    <Card className="border-destructive mb-6">
      <CardHeader>
        <CardTitle className="text-destructive">⚠️ Debug: Environment Variables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 font-mono text-sm">
        <div>
          <strong>URL Status:</strong>{" "}
          {envStatus.isUrlSet ? (
            <span className="text-green-600">✅ Set ({envStatus.url?.substring(0, 15)}...)</span>
          ) : (
            <span className="text-red-600">❌ MISSING</span>
          )}
        </div>
        <div>
          <strong>Key Status:</strong>{" "}
          {envStatus.isKeySet ? (
            <span className="text-green-600">✅ Set</span>
          ) : (
            <span className="text-red-600">❌ MISSING</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
            If these are missing, please check your .env.local file and RESTART the server.
        </p>
      </CardContent>
    </Card>
  );
}
