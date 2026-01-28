import { Card, CardContent } from "@/components/ui/Card";
import {
  ExternalLink,
  BookOpen,
  User,
  GraduationCap,
  Library,
} from "lucide-react";
import { DURHAM_LINKS } from "@/config/durhamLinks";

export function DurhamPortalCard() {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">University Portal</h2>
          <p className="text-sm text-gray-600">
            Quick access to your official university systems
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={DURHAM_LINKS.learnUltra}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                <BookOpen size={16} />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-violet-700">
                Learn Ultra
              </span>
            </div>
            <ExternalLink
              size={16}
              className="text-gray-400 group-hover:text-violet-500"
            />
          </a>

          <a
            href={DURHAM_LINKS.banner}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <User size={16} />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-violet-700">
                Banner Self-Service
              </span>
            </div>
            <ExternalLink
              size={16}
              className="text-gray-400 group-hover:text-violet-500"
            />
          </a>

          <a
            href={DURHAM_LINKS.library}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Library size={16} />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-violet-700">
                Library
              </span>
            </div>
            <ExternalLink
              size={16}
              className="text-gray-400 group-hover:text-violet-500"
            />
          </a>

          <a
            href={DURHAM_LINKS.duHub}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-200 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-violet-700">
                DU Hub
              </span>
            </div>
            <ExternalLink
              size={16}
              className="text-gray-400 group-hover:text-violet-500"
            />
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-400 leading-tight">
          Opens in a new tab. MyDurhamLaw never sees or stores your Durham
          password.
        </div>
      </CardContent>
    </Card>
  );
}
