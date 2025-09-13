
import React from 'react';

const TodaysTasksWidget = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Today&apos;s Tasks
      </h2>
      <ul className="space-y-2">
        <li className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="ml-3 text-gray-700 dark:text-gray-300">Review Lecture Notes</span>
        </li>
        <li className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="ml-3 text-gray-700 dark:text-gray-300">Work on Assignment</span>
        </li>
        <li className="flex items-center">
          <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="ml-3 text-gray-700 dark:text-gray-300">Prepare for Seminar</span>
        </li>
      </ul>
    </div>
  );
};

export default TodaysTasksWidget;
