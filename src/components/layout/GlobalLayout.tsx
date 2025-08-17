import React from 'react';
import GlobalHeader from '../GlobalHeader';
import ModernSidebar from './ModernSidebar';
import GlobalFooter from '../GlobalFooter';

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalHeader />
      <div className="flex flex-1 pt-16">
        <ModernSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default GlobalLayout;
