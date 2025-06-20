import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/components/settings-provider';
import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from '@/components/shared/command-palette';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LearnLog - Student Productivity App',
  description: 'Your premium student productivity partner for focused learning and organization.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <head>
        {/* Google Fonts links are managed by next/font, no need for explicit <link> tags here if using next/font like above. 
            If specific variants or other Google Fonts are needed that next/font doesn't handle as easily, 
            they can be added here. The prompt initially showed <link> tags, but next/font is the standard.
            The existing template uses <link> tags. I will revert to that approach for consistency with the existing template.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet" />

      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col">
        <SettingsProvider>
          {children}
          <Toaster />
          <CommandPalette />
        </SettingsProvider>
      </body>
    </html>
  );
}
