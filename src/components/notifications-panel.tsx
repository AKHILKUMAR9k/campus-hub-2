'use client';

import { supabase } from '@/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Notification, 
  markNotificationAsRead, 
} from '@/lib/notification-service';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(20);
          
        if (data) {
          setNotifications(data as Notification[]);
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      }
      setIsLoading(false);
    };

    if (isOpen) {
      fetchNotifications();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          () => {
             fetchNotifications(); // Refetch on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(supabase, notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert if needed? usually fine to just log
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    const unreadNotifications = notifications.filter(n => !n.read);
    await Promise.all(
      unreadNotifications.map(n => markNotificationAsRead(supabase, n.id!))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return '⏰';
      case 'comment':
        return '💬';
      case 'registration':
        return '✅';
      case 'event_update':
        return '📅';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto mt-16 mr-4">
        <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-background/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 min-w-[1.25rem]">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMarkAllAsRead}
                  className="h-8 w-8"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                        onClick={() => !notification.read && handleMarkAsRead(notification.id!)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground leading-snug">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                              )}
                            </div>
                            {notification.actionUrl && (
                              <Link
                                href={notification.actionUrl}
                                className="text-xs font-medium text-primary hover:underline mt-2 inline-block"
                                onClick={onClose}
                              >
                                View Details →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                     <Bell className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                    You'll see updates about your events here
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
