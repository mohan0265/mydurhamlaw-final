import React from "react";
import LearnLayout from "@/components/layout/LearnLayout";
import { generateArticleSEO, generateFAQSchema } from "@/lib/seo";
import Link from "next/link";
import { Heart, CheckCircle, Calendar, Users } from "lucide-react";

const seo = generateArticleSEO({
  title: "Building a Sustainable Wellbeing Routine as a Durham Law Student",
  description:
    "Practical strategies for managing stress, preventing burnout, and maintaining mental health while studying law at Durham University.",
  slug: "durham-law-wellbeing-routine",
  keywords:
    "Durham Law wellbeing, law student mental health, preventing burnout, study-life balance, Durham University",
});

const faqs = [
  {
    question: "How do I balance intense law reading with self-care?",
    answer:
      "Schedule self-care like you schedule lectures. Block 30-60 minutes daily for exercise, socializing, or hobbies. Non-negotiable time for wellbeing prevents burnout and actually improves academic performance.",
  },
  {
    question: "What are early warning signs of law student burnout?",
    answer:
      "Persistent exhaustion, loss of motivation, cynicism about law, trouble concentrating, sleep disruption, or avoiding coursework. If you notice these, reach out to Durham's Counselling Service or your college welfare team immediately.",
  },
  {
    question: "Is it normal to feel overwhelmed in Durham Law?",
    answer:
      "Yes. The volume of reading and complexity of concepts can be intense. Most students feel this at some point. The key is having strategies to manage it—breaks, study groups, asking for help—rather than pushing through alone.",
  },
];

export default function DurhamLawWellbeingRoutine() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateFAQSchema(faqs) }}
      />

      <LearnLayout
        title={seo.title}
        description={seo.description}
        canonicalUrl={seo.canonical}
      >
        <article className="prose prose-lg max-w-none">
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-600 rounded-xl">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Building a Sustainable Wellbeing Routine as a Durham Law
                  Student
                </h1>
                <p className="text-lg text-gray-600">
                  Practical strategies for managing stress and preventing
                  burnout while excelling in your Durham Law degree.
                </p>
              </div>
            </div>
          </div>

          <h2>Why Wellbeing Matters for Law Students</h2>
          <p>
            Studying law at Durham is intellectually demanding. The volume of
            reading, the complexity of legal reasoning, and the pressure to
            perform can create significant stress. Without intentional wellbeing
            practices, even the most capable students risk burnout.
          </p>
          <p>
            This guide offers evidence-based strategies for maintaining mental
            health, managing stress, and building resilience throughout your
            Durham Law degree.
          </p>

          <h2>The Reality of Law Student Stress</h2>
          <p>
            Law students face unique pressures: dense reading lists, Socratic
            questioning in seminars, competitive cohorts, and career anxiety.
            According to research by LawCare, law students report higher stress
            and lower wellbeing than many other disciplines.
          </p>
          <p>
            <strong>Common stressors at Durham Law:</strong>
          </p>
          <ul>
            <li>High volume of reading (100-200+ pages per week per module)</li>
            <li>Fear of being unprepared in seminars</li>
            <li>Comparison with high-achieving peers</li>
            <li>Pressure to secure vacation schemes and training contracts</li>
            <li>Isolation when struggling with difficult concepts</li>
          </ul>

          <h2>Building Your Wellbeing Routine</h2>

          <h3>1. Schedule Non-Negotiable Breaks</h3>
          <p>
            Treat breaks like lectures—put them in your calendar and respect
            them. <strong>Recommendation:</strong> 10-minute break every 50
            minutes, longer break every 2-3 hours.
          </p>
          <p>
            Use breaks for movement (walk around college), social connection
            (coffee with a friend), or mental reset (mindfulness app, music).
          </p>

          <h3>2. Protect Your Sleep</h3>
          <p>
            Sleep deprivation impairs cognitive function more than alcohol. Aim
            for 7-8 hours per night. If you're consistently getting less,
            something in your schedule needs adjustment.
          </p>
          <p>
            <strong>Sleep hygiene tips:</strong> No screens 30 mins before bed,
            consistent sleep/wake times, limit caffeine after 2pm, keep your
            room cool and dark.
          </p>

          <h3>3. Stay Physically Active</h3>
          <p>
            Exercise reduces stress hormones and improves mood. You don't need a
            gym—20-minute walks, college sports, or home workouts all work.
          </p>
          <p>
            Durham has excellent sports facilities. Consider joining a college
            team or intramural league for both fitness and social connection.
          </p>

          <h3>4. Maintain Social Connections</h3>
          <p>
            Law can feel isolating, especially when everyone seems to understand
            concepts you don't. Regular social time with non-law friends
            provides perspective and emotional support.
          </p>
          <p>
            Join a college society, attend Durham Law School events, or schedule
            weekly coffee with coursemates. Social connection is protective
            against burnout.
          </p>

          <h3>5. Use University Resources</h3>
          <p>Durham offers comprehensive support:</p>
          <ul>
            <li>
              <strong>Counselling Service:</strong> Free, confidential therapy
              for students
            </li>
            <li>
              <strong>College Welfare Teams:</strong> Your college has trained
              welfare officers
            </li>
            <li>
              <strong>Nightline:</strong> Anonymous listening service run by
              students
            </li>
            <li>
              <strong>Disability Support:</strong> Accommodations for mental
              health conditions
            </li>
          </ul>
          <p>
            Seeking help is a sign of strength, not weakness. Most successful
            Durham Law students use these resources at some point.
          </p>

          <div className="not-prose my-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Weekly Wellbeing Checklist
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Averaged 7+ hours sleep per night</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Exercised at least 3 times (even if just walks)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Spent quality time with friends</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Took at least one full day off from law work</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Did something enjoyable unrelated to law</span>
              </li>
            </ul>
          </div>

          <h2>FAQs</h2>
          <div className="not-prose space-y-4 my-6">
            {faqs.map((faq, idx) => (
              <details key={idx} className="p-4 bg-gray-50 rounded-lg border">
                <summary className="font-semibold cursor-pointer">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm text-gray-700">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="not-prose my-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Related Guides
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/learn/durham-law-study-groups"
                className="block p-4 bg-white rounded-lg border hover:border-blue-300 transition"
              >
                <h4 className="font-semibold mb-1">
                  Study Groups & Peer Support
                </h4>
                <p className="text-sm text-gray-600">
                  Collaborative learning at Durham
                </p>
              </Link>
              <Link
                href="/learn/durham-law-exam-technique"
                className="block p-4 bg-white rounded-lg border hover:border-blue-300 transition"
              >
                <h4 className="font-semibold mb-1">
                  Exam Technique Without Burnout
                </h4>
                <p className="text-sm text-gray-600">
                  Stress management during exam season
                </p>
              </Link>
            </div>
          </div>

          <div className="not-prose my-12 p-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-3">
              Support your wellbeing with better tools
            </h3>
            <p className="text-purple-100 mb-6">
              MyDurhamLaw helps you manage workload, track deadlines, and reduce
              stress—so you can focus on what matters.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100"
              >
                See Plans
              </Link>
              <Link
                href="/signup"
                className="inline-block px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-400 border border-purple-400"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </article>
      </LearnLayout>
    </>
  );
}
