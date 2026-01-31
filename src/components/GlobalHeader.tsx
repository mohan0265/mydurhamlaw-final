// src/components/GlobalHeader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/router";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./theme/ThemeToggle";
import { Logo } from "./ui/Logo";
import { useAuth } from "@/lib/supabase/AuthContext";
import LogoutButton from "@/components/auth/LogoutButton";
import PresenceBadge from "@/components/PresenceBadge";
import { BRAND_NAME } from "@/lib/brand";
import { IndependenceBadge } from "@/components/ui/IndependenceBadge";

type MenuItem = { label: string; href: string };
type Menu = { label: string; items: MenuItem[] };

function cx(...cls: Array<string | undefined | false | null>) {
  return cls.filter(Boolean).join(" ");
}

function ActiveLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const active =
    href === "/dashboard"
      ? router.pathname === "/dashboard"
      : router.pathname === href ||
        (href !== "/" && router.pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      prefetch={false}
      className={cx(
        "px-3 py-2 rounded-md text-sm font-medium transition",
        active
          ? "bg-purple-600 text-white"
          : "text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function HoverMenu({
  label,
  items,
  trigger,
}: {
  label?: string;
  items: MenuItem[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150); // small delay prevents flicker
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      {trigger ? (
        <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {label}
        </button>
      )}

      {open && (
        <div
          className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-100 dark:border-white/10 bg-white/95 dark:bg-gray-900/95 shadow-2xl dark:shadow-none backdrop-blur z-[100] pointer-events-auto"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <ul className="py-2">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  prefetch={false}
                  className="block px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg mx-1"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useEntitlements } from "@/components/auth/EntitlementGuards";
import { guides as allGuides } from "@/content/articlesIndex";
import dynamic from "next/dynamic";
import {
  Search,
  Command,
  User,
  X,
  Heart,
  Menu as MenuIcon,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  BookOpen,
  GraduationCap,
  Calendar,
  LayoutDashboard,
  FileText,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const LexiconSearchOverlay = dynamic(
  () => import("@/components/study/LexiconSearchOverlay"),
  { ssr: false },
);

export default function GlobalHeader() {
  const { user } = useAuth() || { user: null };
  const [openMobile, setOpenMobile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLexiconSearchOpen, setIsLexiconSearchOpen] = useState(false);

  // Keyboard shortcut for Lexicon Search (CMD+K or CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsLexiconSearchOpen(true);
      }
    };

    // Listen for custom event from other components
    const handleCustomOpen = () => setIsLexiconSearchOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-lexicon-search", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-lexicon-search", handleCustomOpen);
    };
  }, []);

  // Entitlements
  const { hasDurhamAccess, hasLnatAccess } = useEntitlements();

  // Role detection state
  const [displayName, setDisplayName] = useState<string>("Student");
  const [isLovedOne, setIsLovedOne] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch display name and role from profiles table
  useEffect(() => {
    if (!user || !user.id) {
      setDisplayName("Student");
      setIsLovedOne(false);
      setIsAdmin(false);
      return;
    }

    // Immediate metadata check for virtual/admin users
    if (user.user_metadata?.role === "admin") {
      setIsAdmin(true);
      setDisplayName("Admin");
    }
    if (user.user_metadata?.role === "loved_one") {
      setIsLovedOne(true);
      setDisplayName(user.user_metadata.display_name || "Loved One");
    }

    const fetchUserInfo = async () => {
      try {
        const { getSupabaseClient } = await import("@/lib/supabase/client");
        const { getPublicDisplayName } = await import("@/lib/name"); // Logic injection

        const supabase = getSupabaseClient();
        if (!supabase) {
          setDisplayName(user.email?.split("@")[0] || "Student");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "display_name, preferred_name, privacy_mask_name, role, user_role",
          )
          .eq("id", user.id)
          .single();

        if (data) {
          // Use GLOBAL logic for name resolution
          setDisplayName(getPublicDisplayName(data));
        } else {
          setDisplayName(user.email?.split("@")[0] || "Student");
        }

        // Check if user is a loved one
        if (data?.user_role === "loved_one") {
          setIsLovedOne(true);
        } else if (data?.user_role === "admin") {
          setIsAdmin(true);
          setDisplayName("Admin");
        } else {
          // Also check awy_connections as backup for loved ones
          if (user.email) {
            const { data: connData } = await supabase
              .from("awy_connections")
              .select("id")
              .ilike("loved_email", user.email)
              .in("status", ["active", "accepted", "granted"])
              .limit(1)
              .maybeSingle();

            if (connData) {
              setIsLovedOne(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setDisplayName(user.email?.split("@")[0] || "Student");
      }
    };

    fetchUserInfo();
  }, [user]);

  // --- STUDENT MENUS ---
  const studentStudyMenu: Menu = useMemo(
    () => ({
      label: "Study",
      items: [
        { label: "Learn Durham Law", href: "/learn" },
        { label: "Quiz Me (Durmah Mode)", href: "/quiz" },
        { label: "Year at a Glance", href: "/year-at-a-glance" },
        { label: "Assignments", href: "/assignments" },
        { label: "My Lectures", href: "/study/lectures" },
        { label: "Durmah Transcript Archive", href: "/my/voice-transcripts" },
        { label: "Research Hub", href: "/research-hub" },
      ],
    }),
    [],
  );

  const studentCommunityMenu: Menu = useMemo(
    () => ({
      label: "Community",
      items: [
        { label: "Student Lounge", href: "/lounge" },
        { label: "Community Hub", href: "/community" },
        // Live News moved to top level
      ],
    }),
    [],
  );

  const studentInfoMenu: Menu = useMemo(
    () => ({
      label: "Info",
      items: [
        { label: "Articles", href: "/articles" },
        { label: "About", href: "/about" },
        { label: "Pricing", href: "/pricing" },
        { label: "Exam Prep", href: "/exam-prep" },
        { label: "Wellbeing", href: "/wellbeing" },
        { label: "Refer a Friend", href: "/refer" },
        { label: "My Progress", href: "/profile" }, // User Profile & Loved Ones
      ],
    }),
    [],
  );

  // --- LOVED ONE MENUS (Restricted) ---
  const lovedOneExploreMenu: Menu = useMemo(
    () => ({
      label: "Explore",
      items: [
        { label: "Academic Calendar", href: "/year-at-a-glance" },
        { label: "Community Hub", href: "/community" },
      ],
    }),
    [],
  );

  const lovedOneInfoMenu: Menu = useMemo(
    () => ({
      label: "Info",
      items: [
        { label: "About Caseway", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    }),
    [],
  );

  // --- LNAT MENUS ---
  const isLnatLaunchEnabled =
    process.env.NEXT_PUBLIC_LNAT_LAUNCH_ENABLED === "true";
  const lnatLabel = isLnatLaunchEnabled ? "LNAT Prep" : "LNAT (Upcoming)";

  const lnatMenu: Menu = useMemo(
    () => ({
      label: lnatLabel,
      items: [
        { label: "Dashboard", href: "/lnat" },
        { label: "Preparation Guides", href: "/lnat-preparation" },
        { label: "Pricing", href: "/lnat/pricing" },
      ],
    }),
    [lnatLabel],
  );

  // Choose menus based on entitlement & role
  // Priority: Loved One -> LNAT Only -> Durham Student (Default)

  let studyMenu = studentStudyMenu;
  let communityMenu: Menu | null = studentCommunityMenu;
  let infoMenu = studentInfoMenu;
  let dashboardHref = "/dashboard";
  let dashboardLabel = "Dashboard";

  if (isLovedOne) {
    studyMenu = lovedOneExploreMenu;
    communityMenu = null;
    infoMenu = lovedOneInfoMenu;
    dashboardHref = "/loved-one-dashboard";
    dashboardLabel = "My Dashboard";
  } else if (hasLnatAccess && !hasDurhamAccess) {
    // Pure LNAT User
    studyMenu = lnatMenu;
    communityMenu = null;
    infoMenu = {
      label: "Account",
      items: [
        { label: "Upgrade", href: "/lnat/pricing" },
        { label: "Contact Support", href: "mailto:support@casewaylaw.ai" },
      ],
    };
    dashboardHref = "/lnat";
    dashboardLabel = "LNAT Home";
  } else if (isAdmin) {
    dashboardHref = "/admin";
    dashboardLabel = "Admin Panel";
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F7F6F2]/95 dark:bg-[#123733]/95 backdrop-blur shadow-sm dark:shadow-none border-b border-gray-100 dark:border-[#D5BF76]/20 transition-colors duration-500">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="min-h-[72px] md:min-h-[110px] py-4 flex items-center justify-between transition-all duration-300">
            {/* Brand */}
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2 rounded-xl px-2 py-2 group focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label={`${BRAND_NAME} Home`}
            >
              {/* 
                 Temporarily use text based logo from UI component or just text if Image not ready.
                 But user requested using GlobalHeader update.
                 We will keep the icon if generic, or switch to text.
                 For now, let's stick to the existing structure but update text.
               */}
              <Logo variant="light" className="h-10 md:h-11 w-auto" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  <ActiveLink href={dashboardHref} className="font-semibold">
                    {dashboardLabel}
                  </ActiveLink>
                  <HoverMenu label={studyMenu.label} items={studyMenu.items} />
                  <HoverMenu
                    label="Product Guides"
                    items={[
                      {
                        label: "CASEWAY Lexicon™",
                        href: "/articles/caseway-lexicon",
                      },
                      {
                        label: "SyllabusShield™",
                        href: "/articles/syllabus-shield",
                      },
                      {
                        label: "No Question is Stupid",
                        href: "/articles/no-question-is-a-stupid-question",
                      },
                      { label: "View all guides →", href: "/guides" },
                    ]}
                  />
                  {communityMenu && (
                    <HoverMenu
                      label={communityMenu.label}
                      items={communityMenu.items}
                    />
                  )}
                  <HoverMenu label={infoMenu.label} items={infoMenu.items} />

                  <HoverMenu
                    items={[
                      {
                        label: "🔴 Live Feed",
                        href: "/legal/tools/legal-news-feed",
                      },
                      {
                        label: "📂 My Archive",
                        href: "/legal/tools/my-news-archive",
                      },
                    ]}
                    trigger={
                      <div className="px-3 py-2 rounded-md text-sm font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center gap-1.5 animate-pulse hover:animate-none group">
                        <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500 box-shadow-glow"></span>
                        Live News!
                      </div>
                    }
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    prefetch={false}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    Home
                  </Link>

                  <HoverMenu
                    label="Guides"
                    items={allGuides
                      .filter(
                        (g) => g.type === "article" || g.type === "pillar",
                      )
                      .slice(0, 8)
                      .map((g) => ({ label: g.title, href: g.href }))
                      .concat([
                        { label: "View all guides →", href: "/guides" },
                      ])}
                  />

                  <HoverMenu
                    label="Product Demos"
                    items={allGuides
                      .filter((g) => g.type === "demo")
                      .map((g) => ({ label: g.title, href: g.href }))
                      .concat([{ label: "View all demos →", href: "/demos" }])}
                  />

                  <Link
                    href="/speak-law"
                    prefetch={false}
                    className="px-3 py-2 rounded-md text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    Speak Law
                  </Link>

                  <Link
                    href="/pricing"
                    prefetch={false}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    data-tour="home-pricing"
                  >
                    Pricing
                  </Link>
                </>
              )}
            </div>
            {/* Right (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {user && !isLovedOne && (
                <button
                  onClick={() => setIsLexiconSearchOpen(true)}
                  className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all mr-2"
                  title="Search Lexicon (Cmd+K)"
                >
                  <Search size={22} />
                </button>
              )}
              {user ? (
                <>
                  <span className="text-gray-600 dark:text-gray-200 text-sm font-medium">
                    Hi, {displayName}
                  </span>
                  {!isLovedOne && !isAdmin && (
                    <Link href="/signup">
                      <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all">
                        Start Free Trial
                      </button>
                    </Link>
                  )}
                  <LogoutButton className="px-3 py-2 rounded-md border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-200 text-sm transition-colors" />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition border border-gray-200 dark:border-white/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 py-2 rounded-md text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
                  >
                    Start Free
                  </Link>
                  <Link
                    href={
                      isLnatLaunchEnabled ? "/lnat/signup" : "/lnat-preparation"
                    }
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-gold-600 hover:text-purple-700 transition"
                  >
                    {lnatLabel}
                  </Link>
                </>
              )}
              <ThemeToggle className={"border-gray-300 dark:border-white/10"} />
            </div>
            {/* Mobile toggle */}
            <button
              className="md:hidden text-gray-600 hover:text-gray-900"
              onClick={() => setOpenMobile((v) => !v)}
              aria-label="Toggle menu"
            >
              {openMobile ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path
                    stroke="currentColor"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path
                    stroke="currentColor"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            <div className="md:hidden flex items-center gap-4">
              <ThemeToggle className={"border-gray-200 dark:border-white/10"} />
            </div>
          </div>
        </nav>

        {/* Global Search Strip - Only for Students */}
        {user && !isLovedOne && (
          <div className="hidden md:block bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 py-2">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <button
                onClick={() => setIsLexiconSearchOpen(true)}
                className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 flex items-center justify-between text-sm text-gray-400 font-medium hover:border-purple-300 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-purple-600" />
                  Search legal terms in Lexicon...
                </div>
                <div className="flex items-center gap-1 opacity-60">
                  <Command size={12} />K
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Mobile drawer */}
        {openMobile && (
          <div className="md:hidden border-t border-white/10 bg-indigo-700/95 backdrop-blur">
            <div className="px-4 py-3 space-y-3">
              {/* Mobile Search Trigger */}
              {user && !isLovedOne && (
                <button
                  onClick={() => {
                    setIsLexiconSearchOpen(true);
                    setOpenMobile(false);
                  }}
                  className="w-full flex items-center gap-3 bg-white/10 text-white rounded-xl p-3 font-semibold mb-2"
                >
                  <Search size={20} />
                  Search Lexicon
                </button>
              )}
              {!user && (
                <>
                  <Link
                    href="/speak-law"
                    className="block px-4 py-2 text-base font-bold text-white bg-white/10 rounded-lg"
                    onClick={() => setOpenMobile(false)}
                    prefetch={false}
                  >
                    Speak Law
                  </Link>
                  <Link
                    href="/guides"
                    className="block px-4 py-2 text-base font-medium text-white/90 hover:bg-white/10 rounded-lg"
                    onClick={() => setOpenMobile(false)}
                    prefetch={false}
                  >
                    Guides Hub
                  </Link>
                  <div className="px-4 py-2 text-xs text-white/60 uppercase tracking-widest font-bold">
                    Product Demos
                  </div>
                  {allGuides
                    .filter((g) => g.type === "demo")
                    .map((g) => (
                      <Link
                        key={g.slug}
                        href={g.href}
                        className="block px-6 py-2 text-sm text-white/80 hover:text-white"
                        onClick={() => setOpenMobile(false)}
                        prefetch={false}
                      >
                        {g.title}
                      </Link>
                    ))}
                  <Link
                    href="/demos"
                    className="block px-6 py-2 text-sm text-indigo-200 font-bold hover:text-white"
                    onClick={() => setOpenMobile(false)}
                    prefetch={false}
                  >
                    View all demos →
                  </Link>
                </>
              )}

              <div className="rounded-lg bg-white/5">
                <div className="px-3 py-2 text-white/80 text-xs">
                  {user ? "Account" : "Get Started"}
                </div>
                <div className="pb-2">
                  {user ? (
                    <>
                      <Link
                        href="/billing"
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        Manage Billing
                      </Link>
                      <div className="px-4 py-2 text-xs text-white/80">
                        Signed in as{" "}
                        <span className="font-medium">{displayName}</span>
                      </div>
                      <div className="px-3 pb-2">
                        <LogoutButton className="w-full text-center px-3 py-2 rounded-md bg-white text-indigo-700 text-sm" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => setOpenMobile(false)}
                      >
                        See Pricing
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-2 text-sm text-indigo-700 bg-white rounded mx-3 mt-1 text-center font-semibold hover:bg-indigo-50"
                        onClick={() => setOpenMobile(false)}
                      >
                        Start Free Trial
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setOpenMobile(false)}
                        className="block px-4 py-2 text-sm text-white border border-white/30 rounded mx-3 mt-2 text-center font-medium hover:bg-white/10"
                      >
                        Member Login
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-center mb-8">
              Choose how you want to log in
            </p>

            <div className="space-y-4">
              <Link
                href="/request-access"
                onClick={() => setShowLoginModal(false)}
              >
                <div className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                    <User size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">
                      I'm a Student
                    </h3>
                    <p className="text-sm text-gray-500">
                      Access your dashboard & Durmah
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/loved-one-login"
                onClick={() => setShowLoginModal(false)}
              >
                <div className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                    <Heart size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-pink-700">
                      I'm a Loved One
                    </h3>
                    <p className="text-sm text-gray-500">
                      Check in on your student
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      <LexiconSearchOverlay
        isOpen={isLexiconSearchOpen}
        onClose={() => setIsLexiconSearchOpen(false)}
      />
    </>
  );
}
