import { format } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Generate Google Calendar URL for adding an event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = format(event.startDate, "yyyyMMdd'T'HHmmss");
  const endDate = format(event.endDate, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${startDate}/${endDate}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate iCal file content for an event
 */
export function generateICalContent(event: CalendarEvent): string {
  const startDate = format(event.startDate, "yyyyMMdd'T'HHmmss");
  const endDate = format(event.endDate, "yyyyMMdd'T'HHmmss");

  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Campus Hub//Event Calendar//EN
BEGIN:VEVENT
UID:${Date.now()}@campushub
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

  return icalContent;
}

/**
 * Download iCal file
 */
export function downloadICalFile(event: CalendarEvent): void {
  const icalContent = generateICalContent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Create calendar event object from event data
 */
export function createCalendarEvent(event: {
  title: string;
  description?: string;
  venue?: string;
  date: string;
  time?: string;
  duration?: number; // in hours
}): CalendarEvent {
  // Normalize date string (remove time if it's already there)
  const dateOnly = event.date ? event.date.split('T')[0] : new Date().toISOString().split('T')[0];
  // Normalize time string (HH:mm)
  const timeOnly = event.time ? event.time.substring(0, 5) : '09:00';
  
  const startDate = new Date(`${dateOnly}T${timeOnly}:00`);
  
  // Validate the resulting date
  if (isNaN(startDate.getTime())) {
    console.warn('Invalid date detected in createCalendarEvent:', event.date, event.time);
    // Fallback to current date or a safe default
    const now = new Date();
    return {
      title: event.title,
      description: event.description || '',
      location: event.venue || '',
      startDate: now,
      endDate: new Date(now.getTime() + (event.duration || 2) * 60 * 60 * 1000),
    };
  }

  const endDate = new Date(startDate.getTime() + (event.duration || 2) * 60 * 60 * 1000); // Default 2 hours

  return {
    title: event.title,
    description: event.description || '',
    location: event.venue || '',
    startDate,
    endDate,
  };
}
