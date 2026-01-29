import Link from "next/link";
import { useMemo } from "react";

import { Logo } from "@/components/ui/Logo";
import { BRAND_NAME, LEGAL_DISCLAIMER_LONG } from "@/lib/brand";

export default function GlobalFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="mt-8 border-t bg-[#0B1412] border-white/5 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="mb-6">
            <Logo variant="dark" className="h-8 w-auto" />
          </div>
          <div className="mt-4 space-y-2 text-gray-500 text-xs sm:text-sm max-w-xs leading-relaxed">
            <p className="font-medium text-white">{BRAND_NAME}</p>
            <p>
              Empowering Durham Law students with ethical AI and emotional
              presence.
            </p>
          </div>
        </div>

        <div>
          <div className="font-bold text-white mb-4 uppercase tracking-wider text-xs">
            Durham Law Guides
          </div>
          <ul className="space-y-2 text-gray-500">
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/guides"
                prefetch={false}
              >
                Guides Hub
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/articles/no-question-is-a-stupid-question"
                prefetch={false}
              >
                No Question is Stupid
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/learn/durham-law-ai-study-assistant"
                prefetch={false}
              >
                AI Study Assistant
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/learn/durham-law-exam-technique"
                prefetch={false}
              >
                Exam Technique
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/stay-current"
                prefetch={false}
              >
                Stay Current (News)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-white mb-4 uppercase tracking-wider text-xs">
            Community & Wellbeing
          </div>
          <ul className="space-y-2 text-gray-500">
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/demo/durmah-voice"
                prefetch={false}
              >
                Durmah Voice Demo
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/learn/real-time-collaboration"
                prefetch={false}
              >
                Study Groups
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/community"
                prefetch={false}
              >
                Community Hub
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/about"
                prefetch={false}
              >
                Our Story
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-bold text-white mb-4 uppercase tracking-wider text-xs">
            Legal & Safety
          </div>
          <ul className="space-y-2 text-gray-500">
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/learn/durham-law-academic-integrity-ai"
                prefetch={false}
              >
                Academic Integrity
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/legal/privacy-policy"
                prefetch={false}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors"
                href="/legal/terms-of-use"
                prefetch={false}
              >
                Terms of Use
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-[#D5BF76] transition-colors text-xs"
                href="/admin/login"
                prefetch={false}
              >
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#0B1412]">
        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-gray-600">
          <p className="mb-2">{LEGAL_DISCLAIMER_LONG}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span>
              © {year} {BRAND_NAME}. All rights reserved.
            </span>
            <span>
              Read our{" "}
              <Link
                href="/legal/ethics"
                className="underline text-gray-500 hover:text-white transition-colors"
              >
                Ethics & Academic Integrity guidelines
              </Link>
              .
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
