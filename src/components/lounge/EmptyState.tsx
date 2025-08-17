// src/components/lounge/EmptyState.tsx
import React, { useState, useEffect } from "react";
import SectionCard from "./SectionCard";

const inspirationalMessages = [
  {
    emoji: "⚖️",
    title: "Where future lawyers unite",
    message: "Every distinguished barrister, solicitor, and judge once shared study tips with fellow students. Your voice could inspire the next generation of legal minds.",
    cta: "Begin your legal legacy here"
  },
  {
    emoji: "🏛️",
    title: "Justice begins with community",
    message: "From the chambers of Westminster to the courts of Durham, the law is built on collaboration. Share your insights and connect with tomorrow's legal leaders.",
    cta: "Add your voice to legal history"
  },
  {
    emoji: "🎓",
    title: "Your jurisprudence journey",
    message: "Whether you're mastering tort law or diving into constitutional principles, this community celebrates every step of your legal education.",
    cta: "Share your academic victories"
  },
  {
    emoji: "💼",
    title: "Future advocates gather here",
    message: "From pupillage to partnership, your journey in law starts with connections. Build relationships that will support your career for decades to come.",
    cta: "Network with fellow advocates"
  },
  {
    emoji: "📚",
    title: "The scholar's sanctuary",
    message: "Great legal minds are forged through discussion, debate, and shared wisdom. Your study techniques might unlock someone else's potential.",
    cta: "Enlighten your fellow scholars"
  },
  {
    emoji: "🌟",
    title: "Excellence through unity",
    message: "Durham Law students are destined for greatness. Share your challenges, celebrate wins, and lift each other toward legal excellence.",
    cta: "Elevate your cohort"
  }
];

const quickStartIdeas = [
  "📚 Share your tort law study technique",
  "🎉 Celebrate passing your recent exam",
  "🤔 Ask about contract interpretation",
  "💡 Offer advice for moot court prep",
  "🌅 Share your morning routine for focus",
  "📖 Recommend your favorite case law database",
  "🎯 Discuss your legal career aspirations",
  "🤝 Offer help with essay structure",
  "⚖️ Share insights from your legal placement",
  "📝 Ask about citation formatting tips",
  "🏛️ Discuss landmark cases you're studying",
  "💭 Share what inspired you to study law",
  "📱 Recommend useful legal apps",
  "🎓 Celebrate small wins in your studies",
  "🔍 Ask for research methodology tips",
  "💪 Share how you handle study stress"
];

export default function EmptyState({
  title,
  note,
}: {
  title?: string;
  note?: string;
}) {
  const [currentMessage, setCurrentMessage] = useState(inspirationalMessages[0]);
  const [currentIdeas, setCurrentIdeas] = useState(quickStartIdeas.slice(0, 3));

  useEffect(() => {
    // Rotate through different inspirational messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => {
        const currentIndex = prev ? inspirationalMessages.indexOf(prev) : -1;
        const nextIndex = (currentIndex + 1) % inspirationalMessages.length;
        return inspirationalMessages[nextIndex];
      });
    }, 10000); // Change every 10 seconds

    // Rotate through different quick start ideas
    const ideasInterval = setInterval(() => {
      const shuffled = [...quickStartIdeas].sort(() => Math.random() - 0.5);
      setCurrentIdeas(shuffled.slice(0, 3));
    }, 15000); // Change every 15 seconds

    return () => {
      clearInterval(messageInterval);
      clearInterval(ideasInterval);
    };
  }, []);

  // Use custom title/note if provided, otherwise use rotating message
  const displayTitle = title || currentMessage?.title || 'Welcome to MyDurhamLaw';
  const displayNote = note || currentMessage?.message || 'Connect with fellow law students and share your journey.';

  return (
    <SectionCard className="overflow-hidden">
      <div className="text-center py-16 px-6">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400"></div>
          <div className="absolute top-10 left-10 h-20 w-20 rounded-full bg-purple-300 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 h-16 w-16 rounded-full bg-blue-300 animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-1/4 h-12 w-12 rounded-full bg-indigo-300 animate-pulse delay-700"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <div className="text-6xl mb-6 animate-bounce">
            {title || note ? "🏛️" : (currentMessage?.emoji || "🏛️")}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {displayTitle}
          </h2>
          
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            {displayNote}
          </p>

          {/* Quick start suggestions */}
          {!title && !note && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                ✨ Quick start ideas:
              </h3>
              <div className="space-y-2 max-w-sm mx-auto">
                {currentIdeas.map((idea, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-600 p-3 bg-white/50 rounded-lg border border-gray-100 hover:bg-white/80 transition-all duration-300 cursor-default"
                    style={{ 
                      animationDelay: `${index * 200}ms`,
                      animation: `fadeInUp 0.6s ease-out forwards`
                    }}
                  >
                    {idea}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to action */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-default">
            <span className="animate-pulse">💜</span>
            <span className="font-medium">
              {title || note ? "Ready to share?" : (currentMessage?.cta || "Begin your journey")}
            </span>
          </div>

          {/* Encouraging note */}
          <p className="mt-6 text-xs text-gray-500 italic">
            &ldquo;The law is not just in books—it lives in the minds and hearts of those who study it together. Your journey begins with a single shared thought.&rdquo;
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </SectionCard>
  );
}
