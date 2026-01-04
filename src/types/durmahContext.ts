export interface StudentContext {
  student: {
    displayName: string;
    yearGroup: string;
    term: string;
    weekOfTerm: number;
    localTimeISO: string;
  };
  assignments: {
    upcoming: Array<{
      id: string;
      title: string;
      module: string;
      dueISO: string;
      daysLeft: number;
    }>;
    overdue: Array<{
      id: string;
      title: string;
      module: string;
      dueISO: string;
      daysOver: number;
    }>;
    recentlyCreated: Array<{
      id: string;
      title: string;
      module: string;
      createdISO: string;
    }>;
    total: number;
  };
  schedule: {
    todaysClasses: Array<{
      module_name: string;
      time: string;
    }>;
  };
}
