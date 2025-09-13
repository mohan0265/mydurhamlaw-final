// /components/ProfilePicturePreview.tsx
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase/client';

const ProfilePicturePreview = () => {
  const [user, setUser] = useState<any>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchImage = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      try {
        // First check if the file exists to avoid 400 errors
        const { data: fileList, error: listError } = await supabase.storage
          .from('profile-pictures')
          .list('avatars', { 
            limit: 1,
            search: `${user.id}.png`
          });

        if (listError || !fileList || fileList.length === 0) {
          setUrl(null);
          return;
        }

        // File exists, now get signed URL
        const { data, error } = await supabase.storage
          .from('profile-pictures')
          .createSignedUrl(`avatars/${user.id}.png`, 60);

        if (data?.signedUrl) {
          setUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Profile picture fetch error:', err);
        setUrl(null);
      }
    };

    fetchImage();
  }, [user]);

  return (
    <div>
      <h3>Profile Picture Preview</h3>
      {url ? (
        <Image src={url} alt="Profile" style={{ width: '150px', borderRadius: '8px' }} width={150} height={150} />
      ) : (
        <p>No profile picture found.</p>
      )}
    </div>
  );
};

export default ProfilePicturePreview;

// Avatar components expected by lounge components
export { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
