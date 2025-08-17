// src/pages/lounge/profile/[userId].tsx
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { AuthContext } from "@/lib/supabase/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoungePostCard, { LoungePost } from "@/components/lounge/LoungePostCard";
import SectionCard from "@/components/lounge/SectionCard";

type UserProfile = {
  id: string;
  display_name: string | null;
  created_at: string;
  user_type: string | null;
};

type UserStats = {
  totalPosts: number;
  totalReactions: number;
  joinedDate: string;
};

export default function UserProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const { user, isLoading: authLoading } = useContext(AuthContext);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (!userId || typeof userId !== 'string') return;
    loadUserData(userId);
  }, [userId]);

  async function loadUserData(targetUserId: string) {
    try {
      setLoading(true);
      setError(null);

      // Dynamically import supabase client
      const { supabase } = await import("@/lib/supabase-browser");

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, created_at, user_type")
        .eq("id", targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setError("User not found");
        return;
      }

      setProfile(profileData);

      // Load user's posts
      const { data: postsData, error: postsError } = await supabase
        .rpc("get_user_lounge_posts", {
          p_user_id: targetUserId,
          p_limit: 20
        });

      if (postsError) throw postsError;
      setPosts((postsData || []) as LoungePost[]);

      // Calculate stats
      const totalPosts = postsData?.length || 0;
      
      // Get reaction count for user's posts
      const postIds = postsData?.map((p: LoungePost) => p.id) || [];
      let totalReactions = 0;
      
      if (postIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from("lounge_reactions")
          .select("id")
          .in("post_id", postIds);
        
        totalReactions = reactionsData?.length || 0;
      }

      setStats({
        totalPosts,
        totalReactions,
        joinedDate: profileData.created_at
      });

    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function onPostHidden(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setStats(prev => prev ? { ...prev, totalPosts: prev.totalPosts - 1 } : null);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <SectionCard className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/lounge"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>←</span>
              Back to Lounge
            </Link>
          </SectionCard>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.display_name || "Student";
  const joinDate = new Date(stats?.joinedDate || profile.created_at).toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'long'
  });

  return (
    <>
      <Head>
        <title>{displayName}&apos;s Profile - Premier Student Lounge</title>
        <meta 
          name="description" 
          content={`View ${displayName}&apos;s posts and activity in the Durham Law Premier Student Lounge.`}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Header />
        
        <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
          {/* Back to Lounge */}
          <div className="mb-4 sm:mb-6">
            <Link 
              href="/lounge"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
            >
              <span>←</span>
              Back to Lounge
            </Link>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <SectionCard className="lg:sticky lg:top-6">
                <div className="text-center">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-lg sm:text-2xl">👩‍⚖️</span>
                  </div>
                  
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {displayName}
                  </h1>
                  
                  {profile.user_type && (
                    <p className="text-xs sm:text-sm text-purple-600 font-medium mb-3 sm:mb-4 capitalize">
                      {profile.user_type.replace('_', ' ')} Student
                    </p>
                  )}

                  {isOwnProfile && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700">
                        ✨ This is your profile as others see it
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center mb-4 sm:mb-6">
                    <div>
                      <div className="text-base sm:text-lg font-bold text-purple-600">
                        {stats?.totalPosts || 0}
                      </div>
                      <div className="text-xs text-gray-600">Posts</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-purple-600">
                        {stats?.totalReactions || 0}
                      </div>
                      <div className="text-xs text-gray-600">Reactions</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-3 sm:pt-4">
                    <div className="flex items-center justify-center gap-1">
                      <span>📅</span>
                      <span>Member since {joinDate}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Posts */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {isOwnProfile ? "Your Posts" : `${displayName}&apos;s Posts`}
                  <span className="ml-2 text-sm text-gray-500 font-normal">
                    ({posts.length})
                  </span>
                </h2>

                {posts.length === 0 ? (
                  <SectionCard className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {isOwnProfile ? "Share your first post!" : "No posts yet"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {isOwnProfile 
                        ? "Start engaging with the community by sharing your thoughts, experiences, or questions."
                        : `${displayName} hasn&apos;t shared any posts in the lounge yet.`
                      }
                    </p>
                    {isOwnProfile && (
                      <Link
                        href="/lounge"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <span>✨</span>
                        Start Sharing
                      </Link>
                    )}
                  </SectionCard>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <LoungePostCard
                        key={post.id}
                        post={post}
                        onHidden={onPostHidden}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
