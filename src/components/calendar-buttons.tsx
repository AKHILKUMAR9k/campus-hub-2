'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Download } from 'lucide-react';
import { 
  generateGoogleCalendarUrl, 
  downloadICalFile, 
  createCalendarEvent 
} from '@/lib/calendar-utils';

interface CalendarButtonsProps {
  event: {
    title: string;
    description?: string;
    venue?: string;
    date: string;
    time?: string;
  };
}

export function CalendarButtons({ event }: CalendarButtonsProps) {
  const calEvent = createCalendarEvent(event);

  return (
    <div className="grid grid-cols-2 gap-2 pt-4 border-t">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        onClick={() => window.open(generateGoogleCalendarUrl(calEvent), '_blank')}
      >
        <CalendarPlus className="h-4 w-4 text-blue-600" />
        <span className="text-xs">Google Cal</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900"
        onClick={() => downloadICalFile(calEvent)}
      >
        <Download className="h-4 w-4 text-slate-600" />
        <span className="text-xs">iCal File</span>
      </Button>
    </div>
  );
}
