export interface DemoVideo {
  id: string;
  title: string;
  type: "video" | "carousel" | "steps";
  src?: string; // For video
  poster?: string; // For video
  frames?: string[]; // For carousel (legacy)
  steps?: { src: string; alt: string; caption?: string }[]; // For steps
}

export const DEMO_VIDEOS: Record<string, DemoVideo> = {
  yaag: {
    id: "yaag",
    title: "Year at a Glance",
    type: "steps",
    steps: [
      {
        src: "/demos/yaag/step-01.png",
        alt: "YAAG Overview",
        caption: "See your entire academic year.",
      },
      {
        src: "/demos/yaag/step-02.png",
        alt: "Year 2 View",
        caption: "Switch years to plan ahead.",
      },
      {
        src: "/demos/yaag/step-03.png",
        alt: "Year 3 View",
        caption: "Prepare for your dissertation.",
      },
    ],
  },
  assignments: {
    id: "assignments",
    title: "Assignment Planner",
    type: "steps",
    steps: [
      {
        src: "/demos/assignments/step-01.png",
        alt: "Assignment Hub",
        caption: "Select your assignment type.",
      },
      {
        src: "/demos/assignments/step-02.png",
        alt: "Input Topic",
        caption: "Input your essay question.",
      },
      {
        src: "/demos/assignments/step-03.png",
        alt: "Generated Plan",
        caption: "Get an instant IRAC structure.",
      },
    ],
  },
  lectures: {
    id: "lectures",
    title: "My Lectures",
    type: "steps",
    steps: [
      {
        src: "/demos/lectures/step-01.png",
        alt: "Upload Lecture",
        caption: "Upload your recording.",
      },
      {
        src: "/demos/lectures/step-02.png",
        alt: "Summarization",
        caption: "Get narrative summaries.",
      },
      {
        src: "/demos/lectures/step-03.png",
        alt: "Quiz Generation",
        caption: "Turn notes into quizzes.",
      },
    ],
  },
  quiz_me: {
    id: "quiz_me",
    title: "Quiz Me",
    type: "steps",
    steps: [
      {
        src: "/demos/quiz-me/step-01.png",
        alt: "Feynman Method",
        caption: "Explain concepts clearly.",
      },
      {
        src: "/demos/quiz-me/step-02.png",
        alt: "Speak Law",
        caption: "Practice oral arguments.",
      },
      {
        src: "/demos/quiz-me/step-03.png",
        alt: "Ratio ID",
        caption: "Identify case principles.",
      },
    ],
  },
  durmah_voice: {
    id: "durmah_voice",
    title: "Durmah Voice",
    type: "steps",
    steps: [
      {
        src: "/demos/durmah-voice/step-01.png",
        alt: "Voice Interface",
        caption: "Speak to Durmah naturally.",
      },
      {
        src: "/demos/durmah-voice/step-02.png",
        alt: "Socratic Feedback",
        caption: "Receive probing questions.",
      },
    ],
  },
  exam_prep: {
    id: "exam_prep",
    title: "Exam Prep",
    type: "steps",
    steps: [
      {
        src: "/demos/exam-prep/step-01.png",
        alt: "Exam Simulator",
        caption: "Start a timed mock exam.",
      },
      {
        src: "/demos/exam-prep/step-02.png",
        alt: "Benchmarking",
        caption: "Compare against First-Class standards.",
      },
    ],
  },
};
