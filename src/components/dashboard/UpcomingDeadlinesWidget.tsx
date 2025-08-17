
import React from 'react';

const UpcomingDeadlinesWidget = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Upcoming Deadlines
      </h2>
      <ul className="space-y-2">
        <li className="text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Essay Submission:</span> 2 days
        </li>
        <li className="text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Presentation:</span> 1 week
        </li>
      </ul>
    </div>
  );
};

export default UpcomingDeadlinesWidget;
