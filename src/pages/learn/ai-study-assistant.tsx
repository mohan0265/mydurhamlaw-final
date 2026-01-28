import React from "react";
import Link from "next/link";
import { LearnLayout } from "@/components/layout/LearnLayout";
import { Brain, CheckCircle, Lightbulb, AlertCircle } from "lucide-react";

export default function AIStudyAssistant() {
  return (
    <LearnLayout
      title="AI Study Assistant for UK Law: Study Smarter Without Cutting Corners"
      description="Learn how UK law students can use an AI study assistant to improve case reading, issue spotting, essay structure and exam prep—ethically."
      slug="ai-study-assistant"
      relatedArticles={[
        {
          title: "Academic Integrity & Ethical AI",
          slug: "academic-integrity",
        },
        { title: "Smart Chat: Legal Prompting", slug: "smart-chat-interface" },
      ]}
    >
      <div className="prose prose-blue max-w-none">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
          AI Study Assistant for UK Law: Study Smarter Without Cutting Corners
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8">
          The transition to legal study involves a steep learning curve.
          MyDurhamLaw's AI Study Assistant is designed to act as a 24/7 tutor,
          helping you bridge the gap between reading the law and applying it
          with precision. Whether you are navigating your first Michaelmas term
          or preparing for final year summative essays, our tools ensure you
          stay ahead without compromising integrity.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          What this means for UK law undergrads
        </h2>
        <p>
          Law is uniquely reading-heavy and precision-heavy. Between seminal
          cases, complex statutes, and academic commentary, the sheer volume of
          information can be overwhelming. High marks in a UK law degree don't
          just come from hard work; they come from
          <strong>
            {" "}
            issue spotting, authority choice, application, and clarity
          </strong>
          .
        </p>
        <p>
          The best use of AI isn't to replace your work, but to enhance it.
          Think of the Study Assistant as a tutor, coach, and planner rolled
          into one. It helps you organize your thoughts and refine your
          arguments, but it never takes the pen out of your hand.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          For Law Students
        </h2>
        <p>
          As a student at Durham, you are part of a rigourous academic
          tradition. Whether you are studying at the Palatine Centre or revising
          in your college library, the expectations for original thought are
          high. MyDurhamLaw supports the specific modular structure of the
          Durham LLB, providing tools that align with the Term-time rhythms.
        </p>
        <p className="text-sm italic text-gray-500">
          Note: MyDurhamLaw is an independent study companion and is not
          affiliated with Durham University.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Core skills that drive higher marks in law
        </h2>
        <ul className="space-y-4">
          <li>
            <strong>Issue spotting:</strong> Quickly identify the underlying
            legal questions within a complex fact pattern.
          </li>
          <li>
            <strong>Rule extraction:</strong> Pull the correct{" "}
            <em>ratio decidendi</em> and relevant authorities from judgments.
          </li>
          <li>
            <strong>Application:</strong> Develop structured, fact-specific
            reasoning that shows you understand how the law affects real-world
            scenarios.
          </li>
          <li>
            <strong>Structure:</strong> Master the IRAC/ILAC methods and know
            exactly when to adapt them for different question types.
          </li>
          <li>
            <strong>Expression:</strong> Improve your signposting, maintain
            concision, and build strong paragraph discipline.
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Case reading that actually sticks (in less time)
        </h2>
        <p>
          Stop getting lost in lengthy judgments. Our 5-step case method helps
          you focus on what matters:
          <strong> Facts → Issue → Holding → Reasoning → Significance</strong>.
        </p>
        <div className="bg-blue-50 p-6 rounded-2xl my-8 border border-blue-100">
          <h4 className="font-bold text-blue-900 mt-0">Pro Tip:</h4>
          <p className="mb-0 text-blue-800">
            Use AI to help you build a "Case Bank" with 3–5 key lines of
            reasoning rather than pages of disorganized notes. Try "compare
            cases" prompts to understand the subtle distinctions that
            differentiate a 2:1 answer from a First.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Essay writing: plan first, write second
        </h2>
        <p>
          Distinction essays are built on planning. Start by analyzing the
          command verbs in your prompt: "discuss," "critically evaluate," or
          "advise." MyDurhamLaw helps you build a strong thesis and a logical
          roadmap before you start drafting. By adding counterarguments early,
          you demonstrate the evaluative depth that markers look for in
          summative work.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Exam prep: from notes to answers
        </h2>
        <p>
          revision is the art of conversion. Turn your lecture notes into
          actionable revision assets. Use AI to generate mini problem questions
          and practice "one paragraph IRAC" drills. This builds the muscle
          memory needed to move from a 10-minute plan to a 35-minute polished
          answer under exam conditions.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          How MyDurhamLaw helps
        </h2>
        <p>
          Our platform turns your messy notes into structured checklists,
          mini-plans, and targeted revision drills. Most importantly, it keeps
          your work ethical by providing tutor-level guidance rather than full
          writing automation.
        </p>
        <div className="mt-8">
          <Link href="/pricing">
            <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              View Plans
            </button>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-16 mb-6 pt-10 border-t">
          FAQ
        </h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-900">
              Can an AI study assistant help without writing my essay for me?
            </h4>
            <p className="text-gray-600 text-sm">
              Yes. It focuses on the planning and reasoning stages. By
              critiquing your structure or testing your understanding of a case,
              it helps you write a better essay in your own voice.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              What prompts help with issue spotting and case comparison?
            </h4>
            <p className="text-gray-600 text-sm">
              Try: "Identify the three most contentious legal issues in this
              fact pattern" or "Compare the reasoning in Case A and Case B
              regarding [specific topic]."
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              How should I revise law effectively in the final 2 weeks?
            </h4>
            <p className="text-gray-600 text-sm">
              Focus on "active recall" and "spaced repetition." Use mini-plans
              and issue mapping rather than re-reading textbooks.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              Does this replace a tutor?
            </h4>
            <p className="text-gray-600 text-sm">
              No. It complements human teaching by providing 24/7 consistency
              and a safe space to test your arguments before they are graded.
            </p>
          </div>
        </div>

        <p className="mt-20 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          MyDurhamLaw is an independent study companion and is not affiliated
          with Durham University.
        </p>
      </div>
    </LearnLayout>
  );
}
