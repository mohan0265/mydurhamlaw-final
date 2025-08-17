import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';

import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';

const Year2Dashboard = () => {
  // Year 2 modules
  const modules = getModulesForYear('year_2');

  return (
      <DashboardLayout>
        {/* Trial preview switcher removed to eliminate gating */}
        
        {/* Year-specific guidance */}
        <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 mt-6" role="alert">
          <p className="font-bold">Year 2 - Advancing Your Knowledge</p>
          <p>Dive deeper into specialized areas of law. Focus on developing critical analysis and legal reasoning skills.</p>
        </div>
        
        <ModuleList modules={modules} year="Year 2" />
      </DashboardLayout>
  );
};


export default withAuthProtection(Year2Dashboard);

export async function getServerSideProps() {
  return { props: {} };
}