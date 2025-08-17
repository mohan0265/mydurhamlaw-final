'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Providers from './providers';
import LayoutShell from '@/components/layout/LayoutShell';

// client-only widgets
const DynamicDurmahWidget = dynamic(() => import('@/components/DurmahWidget'), { ssr: false });
const DynamicDurmahVoiceCompanion = dynamic(() => import('@/components/voice/DurmahVoiceCompanion'), { ssr: false });
const DynamicAwyBootstrap = dynamic(() => import('@/components/AWYBootstrap'), { ssr: false });

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine if we should show sidebar based on route
  const shouldShowSidebar = () => {
    // Don't show sidebar on homepage and auth pages
    if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/about') {
      return false;
    }
    return true;
  };

  return (
    <LayoutShell showSidebar={shouldShowSidebar()}>
      {children}
      {/* Floating widgets with high z-index to stay above all content */}
      <div style={{ zIndex: 60 }}>
        {/* Legacy Durmah chat widget */}
        <DynamicDurmahWidget />
        
        {/* New floating voice companion - positioned differently */}
        <DynamicDurmahVoiceCompanion />
        
        {/* AWY bootstrap */}
        <DynamicAwyBootstrap />
      </div>
    </LayoutShell>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayoutContent>{children}</AppLayoutContent>
        </Providers>
      </body>
    </html>
  );
}
