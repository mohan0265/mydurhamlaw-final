import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';

import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';

const Year1Dashboard = () => {
  // Year 1 modules
  const modules = getModulesForYear('year_1');

  return (
      <DashboardLayout>
        {/* Trial preview switcher removed to eliminate gating */}
        
        {/* Year-specific guidance */}
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-6" role="alert">
          <p className="font-bold">Year 1 - Building Your Foundation</p>
          <p>You're now studying the core modules of law. Focus on understanding fundamental principles and developing strong analytical skills.</p>
        </div>
        
        <ModuleList modules={modules} year="Year 1" />
      </DashboardLayout>
  );
};


export default withAuthProtection(Year1Dashboard);

export async function getServerSideProps() {
  return { props: {} };
}