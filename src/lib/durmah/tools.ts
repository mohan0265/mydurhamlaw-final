// Tool definitions for Durmah function calling
export const DURMAH_TOOLS = [
  {
    type: "function",
    name: "get_yaag_events",
    description: "Fetch the student's schedule (lectures, seminars, deadlines, personal tasks) for a specific date range from their YAAG calendar. Use this when asked about 'what's on' a specific date, 'this week', 'next week', or any schedule query.",
    parameters: {
      type: "object",
      properties: {
        startISO: {
          type: "string",
          description: "Start date in YYYY-MM-DD format (e.g., '2026-01-28'). For 'this week' calculate current Monday. For 'next week' calculate next Monday."
        },
        endISO: {
          type: "string",
          description: "End date in YYYY-MM-DD format (e.g., '2026-02-03'). For week queries, use Sunday (7 days from Monday)."
        }
      },
      required: ["startISO", "endISO"]
    }
  },
  {
    type: "function",
    name: "get_news_headlines",
    description: "Fetch recent legal news headlines. Use when asked about 'legal news', 'current cases', or 'what's new in [topic]'. Can filter by topic like 'contract', 'tort', 'criminal', 'eu-law'.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of headlines to return (default: 5, max: 10)"
        },
        topic: {
          type: "string",
          description: "Optional topic filter - legal area like 'contract', 'tort', 'criminal', 'eu-law', 'constitutional'"
        }
      }
    }
  },
  {
    type: "function",
    name: "get_assignment_details",
    description: "Get full details of a specific assignment including question text, progress, notes. Use when student asks 'how's my [assignment name] going' or needs details about a specific piece of work.",
    parameters: {
      type: "object",
      properties: {
        assignmentId: {
          type: "string",
          description: "The UUID of the assignment to fetch. You should already have this from the initial context if student mentions an assignment by name."
        }
      },
      required: ["assignmentId"]
    }
  }
];
