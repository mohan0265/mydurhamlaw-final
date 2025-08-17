import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';
import GlobalLayout from '../../components/layout/GlobalLayout';
import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';
import YearPreviewSwitcher from '../../components/trial/YearPreviewSwitcher';
import { useActiveYear } from '../../lib/session/getActiveYear';

const Year2Dashboard = () => {
  const { activeYear, trialStatus } = useActiveYear();
  
  // Use active year (could be preview) to load correct modules
  const yearKey = activeYear === 'foundation' ? 'foundation_year' :
                  activeYear === 'year1' ? 'year_1' :
                  activeYear === 'year2' ? 'year_2' :
                  activeYear === 'year3' ? 'year_3' : 'year_2';
  
  const modules = getModulesForYear(yearKey);

  const getYearDisplayName = (year: string | null) => {
    const names: Record<string, string> = {
      foundation: 'Foundation Year',
      year1: 'Year 1',
      year2: 'Year 2',  
      year3: 'Year 3'
    };
    return names[year || 'year2'] || 'Year 2';
  };

  return (
    <GlobalLayout>
      <DashboardLayout>
        {/* Year Preview Switcher */}
        {trialStatus?.trialActive && (
          <div className="mb-6">
            <YearPreviewSwitcher />
          </div>
        )}
        
        {/* Year-specific guidance */}
        <div className="bg-purple-100 border-l-4 border-purple-500 text-purple-700 p-4 mt-6" role="alert">
          <p className="font-bold">{getYearDisplayName(activeYear)} - Advancing Your Knowledge</p>
          <p>
            {activeYear === 'foundation' && "Welcome to your first year! Focus on understanding the core concepts and building good study habits."}
            {activeYear === 'year1' && "Build upon your foundation with more complex legal principles and case studies."}
            {activeYear === 'year2' && "Dive deeper into specialized areas of law. Focus on developing critical analysis and legal reasoning skills."}
            {activeYear === 'year3' && "Final year focus on advanced topics, dissertation, and career preparation."}
          </p>
        </div>
        
        <ModuleList modules={modules} year={getYearDisplayName(activeYear)} />
      </DashboardLayout>
    </GlobalLayout>
  );
};


export default withAuthProtection(Year2Dashboard);

export async function getServerSideProps() {
  return { props: {} };
}