export const DEMO_PLANS = [
  {
    id: "yaag",
    slug: "yaag",
    path: "/demo/year-at-a-glance",
    steps: [
      {
        name: "Initial View",
        actions: [{ type: "waitForLoadState", state: "networkidle" }],
        screenshot: "step-01.png",
        caption: "See your entire academic year at a glance.",
      },
      {
        name: "Select Year 2",
        actions: [
          { type: "click", selector: '[data-demo="select-year-1"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-02.png",
        caption: "Switch between academic years to see long-term progression.",
      },
      {
        name: "Select Year 3",
        actions: [
          { type: "click", selector: '[data-demo="select-year-2"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-03.png",
        caption: "Plan your dissertation and final module choices early.",
      },
    ],
  },
  {
    id: "assignments",
    slug: "assignments",
    path: "/demo/assignments",
    steps: [
      {
        name: "Initial View",
        actions: [{ type: "waitForLoadState", state: "networkidle" }],
        screenshot: "step-01.png",
        caption: "Start by selecting an assignment type.",
      },
      {
        name: "Input Topic",
        actions: [
          {
            type: "type",
            selector: '[data-demo="input-assignment-title"]',
            value: "Tort Law: Vicarious Liability",
          },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-02.png",
        caption: "Enter your essay topic or question.",
      },
      {
        name: "Generate Plan",
        actions: [
          { type: "click", selector: '[data-demo="btn-generate-plan"]' },
          { type: "wait", ms: 1000 },
        ],
        screenshot: "step-03.png",
        caption: "Get a structured IRAC plan instantly.",
      },
    ],
  },
  {
    id: "lectures",
    slug: "lectures",
    path: "/demo/my-lectures",
    steps: [
      {
        name: "Capture",
        actions: [
          { type: "waitForLoadState", state: "networkidle" },
          { type: "click", selector: '[data-demo="lecture-step-0"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-01.png",
        caption: "Upload lecture recordings for instant processing.",
      },
      {
        name: "Summarize",
        actions: [
          { type: "click", selector: '[data-demo="lecture-step-1"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-02.png",
        caption: "Get narrative summaries that identify key narratives.",
      },
      {
        name: "Direct to Quiz",
        actions: [
          { type: "click", selector: '[data-demo="lecture-step-3"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-03.png",
        caption: "Turn lecture notes into active recall quizzes instantly.",
      },
    ],
  },
  {
    id: "quiz_me",
    slug: "quiz-me",
    path: "/demo/quiz-me",
    steps: [
      {
        name: "Feynman Method",
        actions: [
          { type: "waitForLoadState", state: "networkidle" },
          { type: "click", selector: '[data-demo="drill-option-0"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-01.png",
        caption: "Explain concepts simply to test deep understanding.",
      },
      {
        name: "Speak Law",
        actions: [
          { type: "click", selector: '[data-demo="drill-option-1"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-02.png",
        caption: "Practice oral reasoning for tutorials and moots.",
      },
      {
        name: "Ratio ID",
        actions: [
          { type: "click", selector: '[data-demo="drill-option-2"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-03.png",
        caption: "Identify the ratio decidendi from complex cases.",
      },
    ],
  },
  {
    id: "durmah_voice",
    slug: "durmah-voice",
    path: "/demo/durmah-voice",
    steps: [
      {
        name: "Oral Articulation",
        actions: [
          { type: "waitForLoadState", state: "networkidle" },
          { type: "click", selector: '[data-demo="voice-step-0"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-01.png",
        caption: "Verbalise your arguments to build confidence.",
      },
      {
        name: "Socratic Method",
        actions: [
          { type: "click", selector: '[data-demo="voice-step-1"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-02.png",
        caption: "Durmah probes your logic with follow-up questions.",
      },
    ],
  },
  {
    id: "exam_prep",
    slug: "exam-prep",
    path: "/demo/exam-prep",
    steps: [
      {
        name: "Pressure Test",
        actions: [
          { type: "waitForLoadState", state: "networkidle" },
          { type: "click", selector: '[data-demo="exam-feature-0"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-01.png",
        caption: "Simulate high-pressure exam scenarios.",
      },
      {
        name: "Benchmarking",
        actions: [
          { type: "click", selector: '[data-demo="exam-feature-1"]' },
          { type: "wait", ms: 500 },
        ],
        screenshot: "step-02.png",
        caption: "Compare your structure against First-Class criteria.",
      },
    ],
  },
];
