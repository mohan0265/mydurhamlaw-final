
import React from 'react';

const MemoryJournalWidget = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Memory Journal
      </h2>
      <p className="text-gray-700 dark:text-gray-300">
        Write a short entry about what you learned today to improve retention.
      </p>
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        Add Entry
      </button>
    </div>
  );
};

export default MemoryJournalWidget;
