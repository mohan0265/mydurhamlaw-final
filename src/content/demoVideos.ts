export interface DemoVideo {
  id: string;
  title: string;
  durationLabel: string;
  type: "video" | "carousel"; // simplified for now
  src?: string; // for video
  frames?: string[]; // for carousel
  poster: string;
}

export const DEMO_VIDEOS = {
  yaag: {
    id: "yaag",
    title: "Year at a Glance Walkthrough",
    durationLabel: "45s",
    type: "carousel",
    frames: ["/demo-frames/yaag/01.png", "/demo-frames/yaag/02.png"],
    poster: "/demo-frames/yaag/01.png",
  },
  assignments: {
    id: "assignments",
    title: "Assignments Hub Walkthrough",
    durationLabel: "30s",
    type: "carousel",
    frames: ["/demo-frames/assignments/01.png"],
    poster: "/demo-frames/assignments/01.png",
  },
  lectures: {
    id: "lectures",
    title: "My Lectures Walkthrough",
    durationLabel: "30s",
    type: "carousel",
    frames: ["/demo-frames/lectures/01.png"],
    poster: "/demo-frames/lectures/01.png",
  },
  exam_prep: {
    id: "exam_prep",
    title: "Exam Prep Walkthrough",
    durationLabel: "30s",
    type: "carousel",
    frames: ["/demo-frames/exam_prep/01.png"],
    poster: "/demo-frames/exam_prep/01.png",
  },
  quiz_me: {
    id: "quiz_me",
    title: "Quiz Me Walkthrough",
    durationLabel: "25s",
    type: "carousel",
    frames: ["/demo-frames/quiz_me/01.png"],
    poster: "/demo-frames/quiz_me/01.png",
  },
  durmah_voice: {
    id: "durmah_voice",
    title: "Durmah Voice Walkthrough",
    durationLabel: "20s",
    type: "carousel",
    frames: ["/demo-frames/durmah_voice/01.png"],
    poster: "/demo-frames/durmah_voice/01.png",
  },
};
