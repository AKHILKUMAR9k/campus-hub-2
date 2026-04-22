import { supabase } from "./client";

export async function uploadToStorage(file: Blob, filePath: string, bucket = "event-images") {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}


