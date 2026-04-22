"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

export default function TestConnectionPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    async function runTests() {
      addLog("🚀 Starting Connectivity Tests...");
      
      // 1. Check Env Vars
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      addLog(`1. Env Vars Check:`);
      addLog(`   - URL: ${url ? "✅ Found (" + url.substring(0, 15) + "...)" : "❌ MISSING"}`);
      addLog(`   - Key: ${key ? "✅ Found" : "❌ MISSING"}`);

      if (!url) {
        addLog("⛔ STOPPING: URL is missing.");
        return;
      }

      // 2. Check Network Reachability (Raw Fetch)
      addLog("2. Network Reachability (fetch request):");
      try {
        const start = performance.now();
        // Just fetching the root URL of the supabase project usually returns 404 or similar, but proves connectivity
        // Any response is good. "Failed to fetch" is bad.
        // We add a random param to bypass cache
        const res = await fetch(`${url}/rest/v1/?apikey=${key}`, { method: 'HEAD' }); 
        const end = performance.now();
        addLog(`   - Fetch Status: ${res.status} ${res.statusText}`);
        addLog(`   - Time: ${(end - start).toFixed(2)}ms`);
        if (res.ok || res.status === 404 || res.status === 401) {
            addLog("   - ✅ Network seems reachable");
        } else {
            addLog("   - ⚠️ received unexpected status");
        }
      } catch (err: any) {
        addLog(`   - ❌ FETCH FAILED: ${err.message}`);
        addLog("   - Possible causes: Offline, VPN, Firewall, AdBlocker");
      }

      // 3. Check Supabase Client Query
      addLog("3. Supabase Client Query (Basic):");
      try {
        const { data, error, count } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });
        
        if (error) {
          addLog(`   - ❌ Basic Query FAILED: ${error.message}`);
        } else {
          addLog(`   - ✅ Basic Query Success! Count: ${count}`);
        }
      } catch (err: any) {
        addLog(`   - ❌ Client Exception: ${err.message}`);
      }

      // 4. Exact Dashboard Query Test
      addLog("4. Exact Dashboard Query Re-enactment:");
      try {
        const isoDate = new Date().toISOString();
        addLog(`   - Filtering date >= ${isoDate}`);
        
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .gte("date", isoDate)
          .order("date", { ascending: true })
          .range(0, 11);

        if (error) {
          addLog(`   - ❌ Dashboard Query FAILED: ${error.message}`);
          addLog(`   - Details: ${JSON.stringify(error)}`);
        } else {
          addLog(`   - ✅ Dashboard Query Success! Returned ${data?.length} events.`);
        }
      } catch (err: any) {
        addLog(`   - ❌ Exception during Dashboard Query: ${err.message}`);
      }
    }

    runTests();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Connectivity Diagnostics</h1>
      <div className="bg-slate-950 text-slate-50 p-4 rounded-lg shadow-lg border border-slate-800 space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="break-all border-b border-slate-900 pb-1 mb-1 last:border-0">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
