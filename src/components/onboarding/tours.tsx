import { Step } from "react-joyride";

export const GUEST_TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    content:
      "Welcome to Caseway! Let us show you around your new legal study companion.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="home-hero-cta"]',
    content:
      "This is your starting point. Explore features, pricing, and how Caseway helps you succeed.",
  },
  {
    target: '[data-tour="home-core-tools"]',
    content:
      "Discover our core tools: Year at a Glance, Assignment Assistant, and more.",
  },
  {
    target: '[data-tour="home-durmah"]',
    content:
      "Meet Durmah, your 24/7 AI voice tutor. Click to chat or ask questions anytime.",
  },
  {
    target: '[data-tour="home-proof"]',
    content: "See exactly how Caseway works in 60 seconds.",
  },
  {
    target: '[data-tour="home-pricing"]',
    content: "Ready to excel? Start your free trial here.",
  },
];

export const STUDENT_DASHBOARD_TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to Caseway",
    content: (
      <div className="space-y-2">
        <p>
          This is your personal law study workspace — designed to help you
          understand, structure, and prepare your law subjects more effectively.
        </p>
        <p className="font-medium text-indigo-600">
          You’re in control. We’ll guide you.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard-lectures"]',
    title: "Turn your uploaded lectures into mastered topics",
    content: (
      <div className="space-y-2">
        <p>
          Instead of rereading slides or transcripts, Caseway helps you break
          lectures into:
        </p>
        <ul className="list-disc list-inside pl-1 space-y-1 text-gray-600">
          <li>clear summaries</li>
          <li>structured topic notes</li>
          <li>exam-relevant insights</li>
        </ul>
        <p>All aligned to how law exams are actually tested.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="dashboard-welcome-upload"]',
    title: "Upload your lecture — see what changes",
    content: (
      <div className="space-y-2">
        <p>Once you upload a lecture, Caseway helps you:</p>
        <ul className="list-disc list-inside pl-1 space-y-1 text-gray-600">
          <li>identify key legal issues</li>
          <li>extract examinable principles</li>
          <li>organise content into revision-ready topics</li>
        </ul>
        <p>No setup. Just upload and explore.</p>
      </div>
    ),
    // Fallback if welcome banner is dismissed?
    // Joyride will skip if target not found.
  },
  {
    target: '[data-tour="dashboard-yaag"]',
    title: "See your entire academic year — at once",
    content: (
      <div className="space-y-2">
        <p>No more surprise deadlines.</p>
        <p>
          Your assignments, exams, and workload are laid out clearly so you can
          plan ahead with confidence.
        </p>
        <p className="italic text-indigo-600">
          This is where calm replaces panic.
        </p>
      </div>
    ),
  },
  {
    target: '[data-tour="dashboard-assignments"]',
    title: "Break assignments into clear legal steps",
    content: (
      <div className="space-y-2">
        <p>
          Instead of staring at a question and wondering where to start, Caseway
          helps you:
        </p>
        <ul className="list-disc list-inside pl-1 space-y-1 text-gray-600">
          <li>understand what the question is really asking</li>
          <li>structure your approach</li>
          <li>track progress step by step</li>
        </ul>
        <p>Built for law — not generic essays.</p>
      </div>
    ),
  },
  {
    target: '[data-tour="dashboard-exam-prep"]',
    title: "Prepare the way law exams are actually marked",
    content: (
      <div className="space-y-2">
        <p>Caseway focuses on:</p>
        <ul className="list-disc list-inside pl-1 space-y-1 text-gray-600">
          <li>issue spotting</li>
          <li>structured reasoning</li>
          <li>clear legal communication</li>
        </ul>
        <p>
          So your revision matches examiner expectations — not just content
          recall.
        </p>
      </div>
    ),
  },
  {
    target: '[data-tour="global-durmah-fab"]',
    title: "Ask questions freely — without judgement",
    content: (
      <div className="space-y-2">
        <p>Durmah is here when:</p>
        <ul className="list-disc list-inside pl-1 space-y-1 text-gray-600">
          <li>you’re unsure</li>
          <li>you feel stuck</li>
          <li>you don’t want to ask in class</li>
        </ul>
        <p>No embarrassment. No pressure. Just clarity when you need it.</p>
      </div>
    ),
    spotlightClicks: true,
  },
  {
    target: '[data-tour="durmah-voice-btn"]',
    title: "Think out loud — like a real lawyer",
    content: (
      <div className="space-y-2">
        <p>
          Use voice mode to talk through problems, test your reasoning, or
          clarify ideas.
        </p>
        <p>It’s often easier to say what you’re thinking than to type it.</p>
      </div>
    ),
  },
  {
    target: "body",
    placement: "center",
    title: "This is just the beginning",
    content: (
      <div className="space-y-2">
        <p>You’ve seen how Caseway supports:</p>
        <ul className="list-disc list-inside pl-1 space-y-1 text-gray-600">
          <li>lectures</li>
          <li>planning</li>
          <li>assignments</li>
          <li>exams</li>
          <li>thinking out loud</li>
        </ul>
        <p className="font-medium text-indigo-600">
          Explore at your own pace — upgrade only when it genuinely helps you.
        </p>
      </div>
    ),
  },
];
