import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import MemberCard, { Member } from "@/components/community-network/MemberCard";
import StatusControls from "@/components/community-network/StatusControls";

type CommunityMember = Member & {
  show_presence: boolean | null;
  last_seen: string | null;
};

const HEARTBEAT_MS = 40_000;   // send "online" every 40s
const STALE_MS = 120_000;      // consider online if last_seen < 2 min
const REEVAL_MS = 130_000;     // UI refresh cadence to flip stale users

export default function CommunityNetworkPage() {
  const [authed, setAuthed] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [onlyOnline, setOnlyOnline] = useState(false);

  // Auth gate
  useEffect(() => {
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session?.user);
    })();
    
    // Set up auth listener with dynamic import
    let subscription: any;
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      const sub = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
      subscription = sub;
    })();
    
    return () => subscription?.data.subscription.unsubscribe();
  }, []);

  // Initial load
  useEffect(() => {
    if (!authed) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase-browser");
      const { data, error } = await supabase
        .from("community_members")
        .select("*")
        .order("display_name", { ascending: true });
      if (!mounted) return;
      if (error) {
        console.error("[Community] load error:", error.message);
        setMembers([]);
      } else {
        setMembers((data || []) as CommunityMember[]);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [authed]);

  // Realtime
  useEffect(() => {
    if (!authed) return;
    let channel: any;
    
    (async () => {
      const { supabase } = await import("@/lib/supabase-browser");
      
      async function refetch() {
        const { supabase } = await import("@/lib/supabase-browser");
        const { data, error } = await supabase
          .from("community_members")
          .select("*")
          .order("display_name", { ascending: true });
        if (!error) setMembers((data || []) as CommunityMember[]);
      }
      
      channel = supabase
        .channel("realtime-community")
        .on("postgres_changes", { event: "*", schema: "public", table: "member_presence" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "community_settings" }, refetch)
        .subscribe();
    })();

    return () => {
      if (channel) {
        (async () => {
          const { supabase } = await import("@/lib/supabase-browser");
          supabase.removeChannel(channel);
        })();
      }
    };
  }, [authed]);

  // Heartbeat presence
  useEffect(() => {
    if (!authed) return;

    const beat = async () => {
      try { 
        const { supabase } = await import("@/lib/supabase-browser");
        await supabase.rpc("update_presence", { p_status: "online" }); 
      }
      catch (e) { console.warn("[Community] heartbeat error:", e); }
    };
    const off = async () => { 
      try { 
        const { supabase } = await import("@/lib/supabase-browser");
        await supabase.rpc("go_offline"); 
      } catch {} 
    };

    beat();
    const id = setInterval(beat, HEARTBEAT_MS);

    const vis = async () => (document.visibilityState === "hidden" ? off() : beat());
    window.addEventListener("beforeunload", off);
    document.addEventListener("visibilitychange", vis);

    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", off);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [authed]);

  // Local UI re-eval (flip stale to offline without server roundtrip)
  useEffect(() => {
    const id = setInterval(() => setMembers((cur) => [...cur]), REEVAL_MS);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();

    return members
      .map((m) => {
        const recent = m.last_seen ? now - new Date(m.last_seen).getTime() < STALE_MS : false;
        const effective =
          m.show_presence && m.presence_status === "online" && recent ? "online" : "offline";
        return { ...m, presence_status: effective as "online" | "offline" };
      })
      .filter((m) => {
        if (onlyOnline && m.presence_status !== "online") return false;
        if (filterYear !== "all" && (m.year_of_study || "").toLowerCase() !== filterYear) return false;
        if (!q) return true;
        return m.display_name.toLowerCase().includes(q);
      });
  }, [members, search, filterYear, onlyOnline]);

  if (!authed) {
    return (
      <>
        <Head><title>Community Network | MyDurhamLaw</title></Head>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold mb-4">Community Network</h1>
          <p className="mb-6">Please sign in to view and connect with other members.</p>
          <a href="/auth" className="inline-block border rounded px-4 py-2">Go to Sign in</a>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Community Network | MyDurhamLaw</title></Head>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Community Network</h1>
        <p className="text-sm text-gray-600 mb-6">
          Connect across year levels. Control your visibility and DM preferences.
        </p>

        <StatusControls />

        {/* Filters */}
        <div className="mt-6 mb-4 grid gap-3 grid-cols-1 md:grid-cols-4">
          <input
            className="rounded border px-3 py-2"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded border px-3 py-2"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="all">All years</option>
            <option value="foundation">Foundation</option>
            <option value="year 1">Year 1</option>
            <option value="year 2">Year 2</option>
            <option value="year 3">Year 3</option>
          </select>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyOnline}
              onChange={(e) => setOnlyOnline(e.target.checked)}
            />
            Show only online
          </label>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-sm text-gray-500">Loading members…</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((m) => <MemberCard key={m.user_id} member={m} />)}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500">No members match your filters.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
