// src/layout/LayoutShell.tsx
import React from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import FloatingDurmah from '@/components/FloatingDurmah';
import FloatingAWY from '@/components/FloatingAWY';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <GlobalHeader />
      <main className="flex-1">{children}</main>
      <GlobalFooter />
      <FloatingDurmah />
      <FloatingAWY />
    </div>
  )
}