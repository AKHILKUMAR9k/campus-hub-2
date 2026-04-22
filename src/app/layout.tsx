import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SupabaseWrapper } from '@/components/SupabaseWrapper';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'Campus Hub',
  description: 'Your one-stop platform for college events.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ptSans.variable} dark`}>
      <body className="font-sans antialiased">
        <SupabaseWrapper>
          {children}
        </SupabaseWrapper>
        <Toaster />
      </body>
    </html>
  );
}
