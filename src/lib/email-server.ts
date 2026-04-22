import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@campushub.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailServer(emailData: EmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email sending skipped.');
    return false;
  }

  const { to, subject, html, text } = emailData;

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email from server:', error);
    return false;
  }
}
