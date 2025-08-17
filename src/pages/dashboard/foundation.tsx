import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';
import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';

const FoundationDashboard = () => {
  // Foundation year modules
  const modules = getModulesForYear('foundation_year');

  return (
    <DashboardLayout>
        {/* Trial preview switcher removed to eliminate gating */}
        
        {/* Year-specific guidance */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-6" role="alert">
          <p className="font-bold">Foundation Year Guidance</p>
          <p>Welcome to your first year! Focus on understanding the core concepts and building good study habits.</p>
        </div>
        
        <ModuleList modules={modules} year="Foundation Year" />
    </DashboardLayout>
  );
};

export default withAuthProtection(FoundationDashboard);

export async function getServerSideProps() {
  return { props: {} };
}