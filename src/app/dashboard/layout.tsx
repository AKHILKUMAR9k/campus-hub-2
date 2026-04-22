"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/supabase";
import { supabase } from "@/supabase/client";

import AppSidebar from "@/components/common/app-sidebar";
import AppHeader from "@/components/common/app-header";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  // ✅ THIS WAS MISSING (ROOT CAUSE)
  const { user, isUserLoading } = useAuth();

  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  /**
   * 1️⃣ AUTH REDIRECT (NO LOOP)
   */
  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  /**
   * 2️⃣ LOAD USER ROLE
   */
  useEffect(() => {
    if (isUserLoading || !user) return;

    const loadRole = async () => {
      let retries = 3;
      let delay = 1000;

      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (error) throw error;
          
          setRole(data?.role || "student");
          setLoadingRole(false);
          return; // Success
        } catch (error: any) {
          console.warn(`Failed to load role (attempt ${4 - retries}), retrying in ${delay / 1000}s...`, error.name, error.message);
          retries--;
          if (retries === 0) {
             console.warn("Could not load user role (network issue?), defaulting to 'student'.");
             setRole("student"); // Final fallback
             setLoadingRole(false);
          } else {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          }
        }
      }
    };

    loadRole();
  }, [user, isUserLoading]);

  /**
   * 3️⃣ LOADING STATE
   */
  if (isUserLoading || (user && loadingRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  /**
   * 4️⃣ SAFETY CHECK
   */
  if (!user) {
    return null; // redirect already triggered
  }



  /**
   * 5️⃣ DASHBOARD UI
   */
  return (
    <div className="grid min-h-screen md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AppSidebar role={role || "student"} />
      <div className="flex flex-col">
        <AppHeader role={role || "student"} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
