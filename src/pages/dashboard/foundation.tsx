import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';
import GlobalLayout from '../../components/layout/GlobalLayout';
import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';
import YearPreviewSwitcher from '../../components/trial/YearPreviewSwitcher';
import { useActiveYear } from '../../lib/session/getActiveYear';

const FoundationDashboard = () => {
  const { activeYear, trialStatus, isPreviewActive } = useActiveYear();
  
  // Use active year (could be preview) to load correct modules
  const yearKey = activeYear === 'foundation' ? 'foundation_year' :
                  activeYear === 'year1' ? 'year_1' :
                  activeYear === 'year2' ? 'year_2' :
                  activeYear === 'year3' ? 'year_3' : 'foundation_year';
  
  const modules = getModulesForYear(yearKey);

  const getYearDisplayName = (year: string | null) => {
    const names: Record<string, string> = {
      foundation: 'Foundation Year',
      year1: 'Year 1',
      year2: 'Year 2',  
      year3: 'Year 3'
    };
    return names[year || 'foundation'] || 'Foundation Year';
  };

  return (
    <GlobalLayout>
      <DashboardLayout>
        {/* Trial preview switcher removed to eliminate gating */}
        
        {/* Year-specific guidance */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-6" role="alert">
          <p className="font-bold">{getYearDisplayName(activeYear)} Guidance</p>
          <p>
            {activeYear === 'foundation' && "Welcome to your first year! Focus on understanding the core concepts and building good study habits."}
            {activeYear === 'year1' && "Build upon your foundation with more complex legal principles and case studies."}
            {activeYear === 'year2' && "Deepen your understanding with specialized modules and practical applications."}
            {activeYear === 'year3' && "Final year focus on advanced topics, dissertation, and career preparation."}
          </p>
        </div>
        
        <ModuleList modules={modules} year={getYearDisplayName(activeYear)} />
      </DashboardLayout>
    </GlobalLayout>
  );
};

export default withAuthProtection(FoundationDashboard);

export async function getServerSideProps() {
  return { props: {} };
}