import React from "react";
import Link from "next/link";
import { LearnLayout } from "@/components/layout/LearnLayout";
import { Users, Heart, Coffee, Shield, CheckCircle } from "lucide-react";

export default function AlwaysWithYou() {
  return (
    <LearnLayout
      title="Always With You (AWY): Wellbeing + Presence for Law Students Away From Home"
      description="Discover how presence features can support student wellbeing—helping Durham law students stay connected, reduce isolation, and study with healthier routines."
      slug="always-with-you"
      relatedArticles={[
        {
          title: "Premium Support for High Achievers",
          slug: "premium-support",
        },
        { title: "Real-time Collaboration", slug: "real-time-collaboration" },
      ]}
    >
      <div className="prose prose-pink max-w-none">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Always With You (AWY): Wellbeing + Presence for Law Students Away From
          Home
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8">
          Law school is as much a test of endurance as it is of intelligence.
          Standing between you and your career are thousands of pages of reading
          and high-pressure exam seasons. The **Always With You** (AWY) system
          ensures that your support network is never more than a glance away,
          helping you maintain the balance needed for long-term academic
          success.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          What this means for UK law undergrads
        </h2>
        <p>
          The life of a law student can frequently feel isolating. Long revision
          blocks in the library and solo reading sessions can lead to burnout if
          not managed carefully. We know that wellbeing directly affects
          performance: sleep, stress management, and consistency are the
          invisible drivers of high grades.
        </p>
        <p>
          AWY introduces the concept of "Presence"—a quiet, non-intrusive way to
          stay connected. It differs from constant messaging by allowing you to
          feel the presence of loved ones without the distraction of a full
          conversation, reducing loneliness during those deep-work sessions.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          For Law Students
        </h2>
        <p>
          Adjusting to the unique rhythm of the Durham academic year—from the
          initial buzz of Michaelmas term to the intense pressure of the Easter
          exams—requires stamina. Caseway helps you navigate these workload
          spikes while staying connected to your college community and family
          back home.
        </p>
        <p className="text-sm italic text-gray-500">
          Note: Caseway is an independent study companion and is not affiliated
          with Durham University.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Healthy routines that improve grades
        </h2>
        <p>
          Success in law is about consistency, not just brilliance. Implement
          these routines to stay ahead:
        </p>
        <ul className="space-y-4">
          <li>
            <strong>Weekly planning:</strong> Set 3 major priorities and leave 2
            buffer slots for the unexpected.
          </li>
          <li>
            <strong>Micro-breaks:</strong> Follow the 50/10 rule—50 minutes of
            deep study followed by 10 minutes of complete rest.
          </li>
          <li>
            <strong>"Start small" technique:</strong> If you're procrastinating,
            commit to just 5 minutes of focused entry into the work.
          </li>
        </ul>
        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Managing stress before seminars and exams
        </h2>
        <p>
          Stress is natural, but it shouldn't be paralyzing. Use our pre-seminar
          preparation template:
        </p>
        <div className="bg-pink-50 p-6 rounded-2xl my-8 border border-pink-100 font-medium text-pink-900">
          Summary of Case → 2 Critical Questions → 1 Potential Critique
        </div>
        <p>
          When exam anxiety hits, practice under timed conditions and review
          your work calmly. Remember, when you feel overwhelmed, the best reset
          is simple: controlled breathing and one achievable next action.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Boundaries and privacy (so it helps, not distracts)
        </h2>
        <p>
          Technology should serve you, not the other way around. You maintain
          100% control over your availability. Choose when to be "Visible" to
          your support network and when to switch to "Deep Work" mode to
          eliminate distractions. AWY allows you to decide exactly what to share
          with parents and loved ones, keeping your independence while receiving
          their support.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          How Caseway helps
        </h2>
        <p>
          The AWY presence feature is available as an optional addon designed to
          support your routines, manage your check-ins, and signal your "I’m
          studying" mode to those who care about you. By prioritizing your
          mental health, we help you prioritize your grades.
        </p>
        <div className="mt-8">
          <Link href="/pricing">
            <button className="bg-pink-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-pink-700 transition shadow-lg shadow-pink-200">
              Start Free Trial
            </button>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-16 mb-6 pt-10 border-t">
          FAQ
        </h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-900">
              Is AWY like WhatsApp or Zoom?
            </h4>
            <p className="text-gray-600 text-sm">
              No. AWY is focused on "presence first." It’s designed to be
              minimal and non-intrusive, giving you the feeling of connection
              without the constant ping of a chat app.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              Can I control who sees me online?
            </h4>
            <p className="text-gray-600 text-sm">
              Absolutely. Your privacy is paramount. You select exactly which
              contacts can see your status, and you can go "Invisible" at any
              time.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              Will this distract me while studying?
            </h4>
            <p className="text-gray-600 text-sm">
              The opposite—by signaling to others that you are in a deep study
              session, AWY actually helps protect your time and reduces the need
              for "Checking in" messages.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              Why does wellbeing matter for law grades?
            </h4>
            <p className="text-gray-600 text-sm">
              Cognitive performance drops sharply under high stress or
              exhaustion. Consistent wellbeing routines ensure your brain is at
              its sharpest when it matters most.
            </p>
          </div>
        </div>

        <p className="mt-20 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          Caseway is an independent study companion and is not affiliated with
          Durham University.
        </p>
      </div>
    </LearnLayout>
  );
}
