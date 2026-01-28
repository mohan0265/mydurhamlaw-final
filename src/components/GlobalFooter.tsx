// src/components/GlobalFooter.tsx
import Link from "next/link";
import { useMemo } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import {
  BRAND_NAME,
  BRAND_SUPPORT_EMAIL,
  LEGAL_DISCLAIMER_SHORT,
} from "@/lib/brand";

export default function GlobalFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="mt-8 border-t bg-gray-50 border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <BrandMark variant="footer" />
          <div className="mt-4 space-y-2 text-gray-600 text-xs sm:text-sm max-w-xs">
            <p className="font-medium text-gray-900">{BRAND_NAME}</p>
            <p>
              Empowering Durham Law students with ethical AI and emotional
              presence.
            </p>
          </div>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">
            Durham Law Guides
          </div>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/guides"
                prefetch={false}
              >
                Guides Hub
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/articles/no-question-is-a-stupid-question"
                prefetch={false}
              >
                No Question is Stupid
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/learn/durham-law-ai-study-assistant"
                prefetch={false}
              >
                AI Study Assistant
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/learn/durham-law-exam-technique"
                prefetch={false}
              >
                Exam Technique
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/stay-current"
                prefetch={false}
              >
                Stay Current (News)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">
            Community & Wellbeing
          </div>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/demo/durmah-voice"
                prefetch={false}
              >
                Durmah Voice Demo
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/learn/real-time-collaboration"
                prefetch={false}
              >
                Study Groups
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/community"
                prefetch={false}
              >
                Community Hub
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/about"
                prefetch={false}
              >
                Our Story
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">
            Legal & Safety
          </div>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/learn/durham-law-academic-integrity-ai"
                prefetch={false}
              >
                Academic Integrity
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/legal/privacy-policy"
                prefetch={false}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors"
                href="/legal/terms-of-use"
                prefetch={false}
              >
                Terms of Use
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-purple-600 transition-colors text-xs"
                href="/admin/login"
                prefetch={false}
              >
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-600">
          <p className="mb-2">{LEGAL_DISCLAIMER_SHORT}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>
              © {year} {BRAND_NAME}. All rights reserved.
            </span>
            <span>
              Read our{" "}
              <Link
                href="/legal/ethics"
                className="underline text-gray-700 hover:text-gray-900"
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
