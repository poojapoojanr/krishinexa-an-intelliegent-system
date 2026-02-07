import type { Metadata } from 'next';
import './globals.css';
import { LayoutProvider } from '@/components/layout-provider';
import { Toaster } from '@/components/ui/toaster';
import { VoiceChatbot } from '@/components/voice-chatbot';
import { FirebaseClientProvider } from '@/firebase';
import { TranslationProvider } from '@/hooks/use-translation';
import { LocationProvider } from '@/hooks/use-location';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'KrishiNexa',
  description: 'A smart agriculture assistant for modern farming.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <TranslationProvider>
          <FirebaseClientProvider>
            <LocationProvider>
              <LayoutProvider>{children}</LayoutProvider>
              <VoiceChatbot />
              <Toaster />
            </LocationProvider>
          </FirebaseClientProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
