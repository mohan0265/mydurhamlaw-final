import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';

import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';

const Year3Dashboard = () => {
  // Year 3 modules
  const modules = getModulesForYear('year_3');

  return (
      <DashboardLayout>
        {/* Trial preview switcher removed to eliminate gating */}
        
        {/* Year-specific guidance */}
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mt-6" role="alert">
          <p className="font-bold">Year 3 - Final Year</p>
          <p>Focus on your dissertation and career preparation. You're almost there!</p>
        </div>
        
        <ModuleList modules={modules} year="Year 3" />
      </DashboardLayout>
  );
};


export default withAuthProtection(Year3Dashboard);

export async function getServerSideProps() {
  return { props: {} };
}