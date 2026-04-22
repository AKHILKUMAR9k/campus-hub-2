"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppSidebar from "./app-sidebar";

import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuth } from "@/supabase";
import { signOut } from "@/supabase/auth";
import NotificationsPanel from "@/components/notifications-panel";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/supabase";
import type { Notification } from "@/lib/notification-service";

export default function AppHeader({ role }: { role: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { toast } = useToast();

  const { data: notifications } = useCollection<Notification>("notifications", {
    filters: { userId: user?.id },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const pageTitle =
    pathname
      .split("/")
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || "Dashboard";

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Logout failed. Please try again.",
      });
    }
  };

  const Breadcrumb = () => (
    <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
      <Link href="/dashboard" className="hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      <span>/</span>
      <span>{pageTitle === "Dashboard" ? "Upcoming Events" : pageTitle}</span>
    </div>
  );

  const isAdmin = role === "admin";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
        {/* Mobile Sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open Menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="sm:max-w-xs p-0 w-full">
            <AppSidebar isMobile={true} role={role} />
          </SheetContent>
        </Sheet>

        <Breadcrumb />

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>{user?.email || "User"}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}


