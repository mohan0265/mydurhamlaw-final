// src/components/GlobalHeader.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/router";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./theme/ThemeToggle";
import { useAuth } from "@/lib/supabase/AuthContext";
import LogoutButton from "@/components/auth/LogoutButton";
import PresenceBadge from "@/components/PresenceBadge";

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
          : "text-gray-600 hover:text-purple-700 hover:bg-purple-50",
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
          className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {label}
        </button>
      )}

      {open && (
        <div
          className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <ul className="py-2">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  prefetch={false}
                  className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-lg mx-1"
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

import { X, User, Heart, Scale } from "lucide-react";

// ... (existing imports)

// BrandMark import removed

// ... (existing imports)

import { useEntitlements } from "@/components/auth/EntitlementGuards";

// ... (existing imports)

export default function GlobalHeader() {
  const { user } = useAuth() || { user: null };
  const [openMobile, setOpenMobile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Entitlements
  const { hasDurhamAccess, hasLnatAccess } = useEntitlements();

  // Role detection state
  const [displayName, setDisplayName] = useState<string>("Student");
  const [isLovedOne, setIsLovedOne] = useState(false);

  // Fetch display name and role from profiles table
  useEffect(() => {
    if (!user || !user.id) {
      setDisplayName("Student");
      setIsLovedOne(false);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const { getSupabaseClient } = await import("@/lib/supabase/client");
        const supabase = getSupabaseClient();
        if (!supabase) {
          setDisplayName(user.email?.split("@")[0] || "Student");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, user_role")
          .eq("id", user.id)
          .single();

        if (data?.display_name) {
          setDisplayName(data.display_name);
        } else {
          setDisplayName(user.email?.split("@")[0] || "Student");
        }

        // Check if user is a loved one
        if (data?.user_role === "loved_one") {
          setIsLovedOne(true);
        } else {
          // Also check awy_connections as backup
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
        { label: "About MyDurhamLaw", href: "/about" },
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
        { label: "Contact Support", href: "mailto:support@mydurhamlaw.com" },
      ],
    };
    dashboardHref = "/lnat";
    dashboardLabel = "LNAT Home";
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="min-h-[72px] md:min-h-[110px] py-4 flex items-center justify-between transition-all duration-300">
            {/* Brand */}
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2 rounded-xl px-2 py-2 group focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="MyDurhamLaw Home"
            >
              <NextImage
                src="/brand/logo-icon-header.svg"
                alt="MyDurhamLaw Logo"
                width={48}
                height={48}
                priority
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
              />

              <span className="text-2xl md:text-[34px] font-bold tracking-tight leading-none text-[#1F2937] translate-y-[1px]">
                MyDurhamLaw
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  <ActiveLink href={dashboardHref} className="font-semibold">
                    {dashboardLabel}
                  </ActiveLink>
                  <HoverMenu label={studyMenu.label} items={studyMenu.items} />
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
                      <div className="px-3 py-2 rounded-md text-sm font-bold text-pink-200 hover:text-white transition-all flex items-center gap-1.5 animate-pulse hover:animate-none group">
                        <span className="w-2 h-2 rounded-full bg-red-500 box-shadow-glow"></span>
                        Live News!
                      </div>
                    }
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/#how-it-works"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/articles"
                    prefetch={false}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    Articles
                  </Link>
                  <Link
                    href="/learn/academic-integrity"
                    prefetch={false}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    Academic Integrity
                  </Link>
                </>
              )}
            </div>

            {/* Right (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-gray-600 text-sm">
                    Hi, {displayName}
                  </span>
                  {!isLovedOne && (
                    <Link href="/signup">
                      <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all">
                        Start Free Trial
                      </button>
                    </Link>
                  )}
                  <LogoutButton className="px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm" />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition border border-gray-200"
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

        {/* Mobile drawer */}
        {openMobile && (
          <div className="md:hidden border-t border-white/10 bg-indigo-700/95 backdrop-blur">
            <div className="px-4 py-3 space-y-3">
              {/* ... existing mobile menu items ... */}
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
    </>
  );
}
