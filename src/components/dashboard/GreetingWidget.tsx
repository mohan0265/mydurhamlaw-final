import React, { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { isDemoMode } from "@/lib/demo";

const GreetingWidget: React.FC = () => {
  const user = useUser();
  const [greeting, setGreeting] = useState("Welcome");
  const [name, setName] = useState("");

  useEffect(() => {
    // Time logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Name logic
    if (isDemoMode()) {
      setName("Student");
    } else {
      setName(
        user?.user_metadata?.display_name ||
          user?.user_metadata?.full_name?.split(" ")[0] ||
          "Student",
      );
    }
  }, [user]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border border-slate-200 rounded-xl p-6 mb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {greeting}, {name}
      </h1>
      <p className="text-slate-600 dark:text-gray-300">
        Here is your dashboard overview for today.
      </p>
    </div>
  );
};

export default GreetingWidget;
