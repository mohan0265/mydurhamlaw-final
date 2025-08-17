import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { withAuthProtection } from '../../lib/withAuthProtection';
import GlobalLayout from '../../components/layout/GlobalLayout';
import { getModulesForYear } from '../../lib/academic/academicData';
import ModuleList from '../../components/modules/ModuleList';
import YearPreviewSwitcher from '../../components/trial/YearPreviewSwitcher';
import { useActiveYear } from '../../lib/session/getActiveYear';

const Year1Dashboard = () => {
  const { activeYear, trialStatus } = useActiveYear();
  
  // Use active year (could be preview) to load correct modules
  const yearKey = activeYear === 'foundation' ? 'foundation_year' :
                  activeYear === 'year1' ? 'year_1' :
                  activeYear === 'year2' ? 'year_2' :
                  activeYear === 'year3' ? 'year_3' : 'year_1';
  
  const modules = getModulesForYear(yearKey);

  const getYearDisplayName = (year: string | null) => {
    const names: Record<string, string> = {
      foundation: 'Foundation Year',
      year1: 'Year 1',
      year2: 'Year 2',  
      year3: 'Year 3'
    };
    return names[year || 'year1'] || 'Year 1';
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
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-6" role="alert">
          <p className="font-bold">{getYearDisplayName(activeYear)} - Building Your Foundation</p>
          <p>
            {activeYear === 'foundation' && "Welcome to your first year! Focus on understanding the core concepts and building good study habits."}
            {activeYear === 'year1' && "You're now studying the core modules of law. Focus on understanding fundamental principles and developing strong analytical skills."}
            {activeYear === 'year2' && "Deepen your understanding with specialized modules and practical applications."}
            {activeYear === 'year3' && "Final year focus on advanced topics, dissertation, and career preparation."}
          </p>
        </div>
        
        <ModuleList modules={modules} year={getYearDisplayName(activeYear)} />
      </DashboardLayout>
    </GlobalLayout>
  );
};


export default withAuthProtection(Year1Dashboard);

export async function getServerSideProps() {
  return { props: {} };
}