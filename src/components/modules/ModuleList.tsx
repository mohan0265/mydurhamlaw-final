import React from 'react';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';
import { AcademicModule } from '../../lib/academic/academicData';

interface ModuleListProps {
  modules: AcademicModule[];
  year: string;
  className?: string;
}

const ModuleList: React.FC<ModuleListProps> = ({ modules, year, className = '' }) => {
  // Handle empty module data
  if (!modules || modules.length === 0) {
    return (
      <div className={`mt-6 ${className}`}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Modules</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Module Data Coming Soon</h3>
          <p className="text-amber-700">
            We&apos;re currently updating the module information for {year}. Please check back soon for detailed course content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-6 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Modules</h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6 border border-gray-200 group relative"
          >
            {/* Module Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
                  {module.name}
                </h3>
              </div>
            </div>

            {/* Module Description */}
            <div className="mb-4">
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                {module.description}
              </p>
            </div>

            {/* Assessment Information */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                    Assessment
                  </div>
                  <div className="text-sm text-gray-700">
                    {module.assessment}
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Effect Indicator */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </div>
        ))}
      </div>
      
      {/* Module Count Indicator */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <BookOpen className="w-3 h-3 mr-1" />
          {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
        </span>
      </div>
    </div>
  );
};

export default ModuleList;