import React from "react";
import Link from "next/link";
import { LearnLayout } from "@/components/layout/LearnLayout";
import { MessageSquare, Zap, Terminal, Search, Info } from "lucide-react";

export default function SmartChatInterface() {
  return (
    <LearnLayout
      title="Smart Chat for Law Students: Ask Better Questions, Get Better Answers"
      description="Learn how a smart chat interface helps UK law students turn vague questions into structured legal reasoning, clearer notes, and stronger revision."
      slug="smart-chat-interface"
      relatedArticles={[
        { title: "AI Study Assistant", slug: "ai-study-assistant" },
        { title: "Academic Integrity", slug: "academic-integrity" },
      ]}
    >
      <div className="prose prose-blue max-w-none">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Smart Chat for Law Students: Ask Better Questions, Get Better Answers
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8">
          The power of AI in legal education is not in the technology itself,
          but in the quality of the interaction. The Caseway **Smart Chat
          Interface** is designed to bridge the gap between initial confusion
          and deep legal understanding, provided you know how to ask the right
          questions.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          What this means for UK law undergrads
        </h2>
        <p>
          Most law students lose valuable time by asking vague or overly broad
          questions. In the law, precision is everything. High-quality answers
          come from a combination of structure, explicit assumptions, and
          authoritative citations. Moving from "Tell me about Tort" to
          structured legal analysis requires a change in how you communicate
          with your digital study companion.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          The 4-question method (turn confusion into clarity)
        </h2>
        <p>
          Before you commit to a full prompt, try breaking your problem down
          into these four pillars:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-blue-900">
            “What is the legal issue?”
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-blue-900">
            “What are the possible rules?”
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-blue-900">
            “What facts matter?”
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-blue-900">
            “What is the best conclusion and why?”
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Prompts that help without cheating
        </h2>
        <p>
          Use these templates to get the most out of your AI without crossing
          ethical boundaries:
        </p>
        <ul className="space-y-4">
          <li>
            <strong>
              "Explain X like I’m in Year 1, then give me 3 practice questions"
            </strong>{" "}
            — Perfect for mastering foundational concepts.
          </li>
          <li>
            <strong>
              "Challenge my argument: what is the strongest counterargument?"
            </strong>{" "}
            — Builds the evaluative depth markers look for.
          </li>
          <li>
            <strong>"Turn these notes into a seminar plan"</strong> — Helps you
            organize your thoughts for verbal participation.
          </li>
          <li>
            <strong>
              "Help me outline this legal problem, but don't write the
              paragraphs for me"
            </strong>{" "}
            — Keeps you in the driver's seat.
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          Turning lectures into revision assets
        </h2>
        <p>
          Your recordings and transcripts shouldn't sit idle. Use the Smart Chat
          to **summarize** key takeaways, **test yourself** on the content, and
          identify the gaps in your understanding before they become problems
          during exam season. You can even use the interface to create
          flashcards or mini problem questions based directly on what your
          lecturer emphasized.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          For Law Students
        </h2>
        <p>
          The seminar-heavy rhythm of Durham Law requires disciplined
          preparation. Our preparation templates help you walk into your
          tutorials ready to engage. During the Easter term, use the
          consolidation strategy to merge your weekly notes into high-level
          revision maps.
        </p>
        <p className="text-sm italic text-gray-500">
          Note: Caseway is an independent study companion and is not affiliated
          with Durham University.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          How Caseway helps
        </h2>
        <p>
          Our structured chat UX features guided prompts, checklists, and staged
          workflows that prevent the "blank screen" effect. It’s context-aware,
          meaning it understands your current module and assignment expectations
          to give you the most relevant support.
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
              What should I ask when I’m stuck on a case?
            </h4>
            <p className="text-gray-600 text-sm m-0">
              Ask: "What was the specific ratio decedendi in [Case Name], and
              how did it distinguish itself from [Prior Case]?"
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              How do I stop AI from giving generic answers?
            </h4>
            <p className="text-gray-600 text-sm m-0">
              Provide context. Mention specific statutes or the specific
              lecturer's points you're trying to reconcile.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              Can chat help with exam technique?
            </h4>
            <p className="text-gray-600 text-sm m-0">
              Yes! Ask the AI to act as a marker and critique your IRAC-style
              plans based on common grading criteria.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              How do I use chat ethically for essays?
            </h4>
            <p className="text-gray-600 text-sm m-0">
              Focus on the research and outlining phases. Use the AI to find
              connections between authorities and to test the logic of your
              thesis.
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
