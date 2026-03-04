/**
 * Root Layout — Smart Supply Chain Optimizer
 * 
 * ARCHITECTURAL NOTE:
 * This layout wraps all pages with:
 *   1. DisclaimerBanner — persistent university assignment notice
 *   2. Sidebar — persistent navigation with active-route highlighting
 *   3. Main content area — renders the active page
 * 
 * The Inter font is loaded via next/font/google for corporate typography.
 * In future phases, the layout will include:
 *   - Supabase Auth session provider
 *   - Global agent status indicator
 *   - Real-time notification system
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import DisclaimerBanner from '@/components/layout/DisclaimerBanner';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Smart Supply Chain Optimizer | B2B SaaS Dashboard',
  description:
    'AI-powered supply chain optimization dashboard with multi-agent crisis resolution, inventory forecasting, and intelligent routing strategies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Persistent disclaimer banner */}
        <DisclaimerBanner />

        {/* App shell: sidebar + main content */}
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 lg:ml-0 overflow-x-hidden">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
