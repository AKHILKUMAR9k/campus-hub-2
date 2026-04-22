'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Link2, MessageCircle, Instagram } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  title: string;
  eventId: string;
}

export function SocialShare({ title, eventId }: SocialShareProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(`${window.location.origin}/dashboard/events/${eventId}`);
  }, [eventId]);

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Event link has been copied to your clipboard.",
    });
  };

  const shareWhatsApp = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`Check out this event: ${title}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareInstagram = () => {
    // Instagram doesn't support direct URL sharing via web API, 
    // so we guide the user to copy link
    copyToClipboard();
    toast({
      title: "Instagram Sharing",
      description: "Link copied! You can now paste it in your Instagram story or bio.",
    });
  };

  return (
    <div className="space-y-3 pt-4 border-t">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Share Event
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex flex-col h-auto py-2 gap-1 hover:bg-green-50 dark:hover:bg-green-950/20" 
          onClick={shareWhatsApp}
        >
          <MessageCircle className="h-4 w-4 text-green-500" />
          <span className="text-[10px]">WhatsApp</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex flex-col h-auto py-2 gap-1 hover:bg-pink-50 dark:hover:bg-pink-950/20" 
          onClick={shareInstagram}
        >
          <Instagram className="h-4 w-4 text-pink-500" />
          <span className="text-[10px]">Instagram</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex flex-col h-auto py-2 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/20" 
          onClick={copyToClipboard}
        >
          <Link2 className="h-4 w-4 text-blue-500" />
          <span className="text-[10px]">Copy Link</span>
        </Button>
      </div>
    </div>
  );
}
