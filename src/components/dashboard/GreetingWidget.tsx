import React from 'react';
import { useUser } from '@supabase/auth-helpers-react';

const GreetingWidget: React.FC = () => {
  const user = useUser();
  const displayName = user?.user_metadata?.displayName || 'Law Student';

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {user ? `Welcome back, ${displayName}!` : 'Welcome!'}
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        Here is your dashboard for today.
      </p>
    </div>
  );
};

export default GreetingWidget;