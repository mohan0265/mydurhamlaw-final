// /components/UploadProfilePicture.tsx
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

const UploadProfilePicture = () => {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleUpload = async () => {
    if (!user || !file) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage('Upload service unavailable');
      return;
    }

    setUploading(true);
    const filePath = `avatars/${user.id}.png`;

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      setMessage(`Upload error: ${error.message}`);
    } else {
      setMessage('Upload successful!');
    }

    setUploading(false);
  };

  return (
    <div>
      <h3>Upload Profile Picture</h3>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadProfilePicture;
