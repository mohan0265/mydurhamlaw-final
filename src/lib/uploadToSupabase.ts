// src/lib/uploadToSupabase.ts

export async function uploadPublicFile(
  file: File,
  folder: "images" | "audio"
): Promise<{ url: string; path: string }> {
  const { supabase } = await import("@/lib/supabase-browser");
  
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const safeName = file.name.replace(/\s+/g, "_");
  const path = `${folder}/${user.id}/${Date.now()}_${safeName}`;

  const { error: upErr } = await supabase
    .storage
    .from("lounge_uploads")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });

  if (upErr) throw upErr;

  const { data: pub } = supabase
    .storage
    .from("lounge_uploads")
    .getPublicUrl(path);

  return { url: pub.publicUrl, path };
}
