import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const MAX_SIZE = 400;
const BUCKET = 'profile-images';

/** Resize and compress an image file to max 400×400 JPEG using Canvas API. */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function useProfileImage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a profile photo for memberId.
   * Only callable by the Ministry of Culture role — enforced here and by DB trigger.
   */
  const upload = useCallback(async (file: File, memberId: string): Promise<string | null> => {
    if (user?.role !== 'CULTURE') {
      setError('Only the Ministry of Culture can upload profile images.');
      return null;
    }
    setUploading(true);
    setError(null);
    try {
      const resized = await resizeImage(file);
      const path = `${memberId}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, resized, { upsert: true, contentType: 'image/jpeg' });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from('members')
        .update({ profile_image_url: publicUrl })
        .eq('id', memberId);
      if (updateErr) throw updateErr;

      return publicUrl;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, [user?.role]);

  return { uploading, error, upload };
}
