/**
 * Converts a File to a compressed Base64 JPEG string.
 * Uses canvas to resize to max 600px width and compress to 0.6 quality.
 * This bypasses Firebase Storage Blaze plan requirement.
 */
export const uploadImageAsBase64 = (
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    onProgress?.(10);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      onProgress?.(40);
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        onProgress?.(70);
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64String = canvas.toDataURL('image/jpeg', 0.6);
        onProgress?.(100);
        resolve(base64String);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
