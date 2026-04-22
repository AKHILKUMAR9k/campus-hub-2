import { NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';
import { sendEmailServer } from '@/lib/email-server';
import { generateReminderEmail } from '@/lib/email-service';

export async function GET() {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  // 1. Fetch unsent reminders that are due
  // We use join to get the email from the users table (linked via user_id)
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(`
      *,
      users!inner(email)
    `)
    .eq('sent', false)
    .lte('reminder_time', now);

  if (error) {
    console.error('Cron job error fetching reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const results = {
    total: reminders?.length || 0,
    sent: 0,
    failed: 0
  };

  if (reminders && reminders.length > 0) {
    for (const reminder of reminders) {
      const email = (reminder as any).users?.email;
      
      if (!email) {
        // If no email, mark as sent so we don't keep trying
        await supabase.from('reminders').update({ sent: true }).eq('id', reminder.id);
        results.failed++;
        continue;
      }

      // Format date and time for the email
      const eventDate = new Date(reminder.event_date);
      const dateStr = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      const timeStr = eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      });

      const emailData = generateReminderEmail(
        reminder.event_title,
        dateStr,
        timeStr,
        new Date(reminder.reminder_time)
      );
      emailData.to = email;

      const success = await sendEmailServer(emailData);
      if (success) {
        await supabase.from('reminders').update({ sent: true }).eq('id', reminder.id);
        results.sent++;
      } else {
        results.failed++;
      }
    }
  }

  return NextResponse.json({ success: true, results });
}
