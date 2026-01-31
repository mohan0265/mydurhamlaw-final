import React from "react";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  Search,
  Brain,
  MessageSquare,
  LogOut,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function DemoLayout({
  children,
  activePage = "dashboard",
}: {
  children: React.ReactNode;
  activePage?: string;
}) {
  const menuItems = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/demo/dashboard",
      id: "dashboard",
    },
    {
      label: "Durmah Chat",
      icon: MessageSquare,
      href: "/demo/durmah",
      id: "durmah",
    },
    { label: "My Lectures", icon: BookOpen, href: "#", id: "lectures" },
    { label: "Assignments", icon: FileText, href: "#", id: "assignments" },
    { label: "Calendar", icon: Calendar, href: "#", id: "calendar" },
    { label: "Research Hub", icon: Search, href: "#", id: "research" },
    { label: "Speak Law", icon: Brain, href: "#", id: "speak" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-50">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Logo className="h-8 w-auto" />
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activePage === item.id
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-purple-50 rounded-xl p-4 mb-4">
            <h4 className="text-xs font-bold text-purple-800 uppercase tracking-widest mb-1">
              Demo Mode
            </h4>
            <p className="text-xs text-purple-600 leading-relaxed">
              You are viewing a safe, privacy-protected demo. No real data is
              shown.
            </p>
          </div>

          <Link href="/signup">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
              Start Free Trial
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
              Demo Environment
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900">Student</div>
              <div className="text-xs text-gray-500">
                Year 2 • Durham University
              </div>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-purple-600 font-bold border border-white shadow-sm">
              S
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
