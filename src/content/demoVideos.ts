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
        caption:
          "Plan your entire academic year in one view. Track deadlines and exams effortlessly.",
      },
      {
        src: "/demos/yaag/step-02.png",
        alt: "Year 2 View",
        caption:
          "Switch between years instantly to see past modules or future requirements.",
      },
      {
        src: "/demos/yaag/step-03.png",
        alt: "Year 3 View",
        caption:
          "Stay on top of dissertation milestones and final year credits.",
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
        caption:
          "Click 'New Assignment' to start. Choose your module and essay type.",
      },
      {
        src: "/demos/assignments/step-02.png",
        alt: "Input Topic",
        caption:
          "Paste your exact essay question. Our AI parses the legal issues automatically.",
      },
      {
        src: "/demos/assignments/step-03.png",
        alt: "Generated Plan",
        caption:
          "Receive a tailored IRAC plan. Use this structure to write your own original work.",
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
        caption:
          "Drag & drop your Panopto recording or audio file here to begin processing.",
      },
      {
        src: "/demos/lectures/step-02.png",
        alt: "Summarization",
        caption:
          "Caseway generates a structured legal summary, highlighting key cases and ratiocinations.",
      },
      {
        src: "/demos/lectures/step-03.png",
        alt: "Quiz Generation",
        caption:
          "Instantly convert your lecture notes into a revision quiz to test your recall.",
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
        caption:
          "Select a tough legal concept. The AI will ask you to explain it simply.",
      },
      {
        src: "/demos/quiz-me/step-02.png",
        alt: "Speak Law",
        caption:
          "Use your microphone to practice oral arguments. Build confidence for tutorials.",
      },
      {
        src: "/demos/quiz-me/step-03.png",
        alt: "Ratio ID",
        caption:
          "Receive instant feedback on how accurately you identified the legal principle.",
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
        caption:
          "Tap the microphone to chat with Durmah, your 24/7 legal study companion.",
      },
      {
        src: "/demos/durmah-voice/step-02.png",
        alt: "Socratic Feedback",
        caption:
          "Durmah doesn't just give answers; she asks leading questions to deepen your understanding.",
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
        caption:
          "Choose a module and start a timed mock exam under realistic conditions.",
      },
      {
        src: "/demos/exam-prep/step-02.png",
        alt: "Benchmarking",
        caption:
          "Review your answers against First-Class sample criteria to identify gaps.",
      },
    ],
  },
};
