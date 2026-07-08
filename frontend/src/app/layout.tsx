import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SeatFlow AI',
  description: 'Enterprise Seat Allocation & Project Mapping Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 flex h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
