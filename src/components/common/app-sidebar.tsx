"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarClock,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Shield,
  Briefcase,
  Users,
  LineChart,
} from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuth } from "@/supabase";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Upcoming Events" },
  { href: "/dashboard/my-events", icon: CalendarCheck, label: "My Events" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/past-events", icon: CalendarClock, label: "Past Events" },
  { href: "/dashboard/manage-events", icon: Briefcase, label: "Manage Events", organizerOnly: true },
  { href: "/dashboard/admin", icon: Shield, label: "Admin Dashboard", adminOnly: true },
  { href: "/dashboard/clubs", icon: Users, label: "Clubs" },
  { href: "/dashboard/analytics", icon: LineChart, label: "Analytics", organizerOnly: true },
];

function NavLink({ item }: { item: (typeof navItems)[0] }) {
  const pathname = usePathname();
  const isActive =
    pathname.startsWith(item.href) &&
    (item.href !== "/dashboard" || pathname === "/dashboard");

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary z-10",
        isActive && "text-primary"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-tab"
          className="absolute inset-0 bg-muted rounded-lg -z-10"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <item.icon
        className={cn(
          "h-5 w-5 z-20",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className={cn("font-medium z-20", { "text-primary": isActive })}>{item.label}</span>
    </Link>
  );
}

export default function AppSidebar({
  role,
  isMobile = false,
}: {
  role: string;
  isMobile?: boolean;
}) {
  const { user } = useAuth();

  const isOrganizer = role === "club_organizer" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <aside className={cn("bg-card", !isMobile && "hidden md:block border-r")}>
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold font-headline"
          >
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>Campus Hub</span>
          </Link>
        </div>

        <div className="flex-1 overflow-auto">
          <nav className="grid items-start gap-1 px-4 py-4 text-sm font-medium">
            {navItems.map((item) => {
              if (item.organizerOnly && !isOrganizer) return null;
              if (item.adminOnly && !isAdmin) return null;
              return <NavLink key={item.href} item={item} />;
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t">
          {isOrganizer && (
            <div className="pb-4">
              <Link href="/dashboard/create-event">
                <Button size="sm" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 overflow-hidden"
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback>
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-sm truncate">
                  {user?.email}
                </span>
                <span className="text-xs text-muted-foreground capitalize truncate">
                  {role.replace("_", " ")}
                </span>
              </div>
            </Link>

            <Link href="/dashboard/settings">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2 opacity-50">
            v1.0.0
          </div>
        </div>
      </div>
    </aside>
  );
}
