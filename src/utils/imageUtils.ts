/**
 * Compresses a camera or gallery image file on-device for fast upload over rural mobile networks
 * and safe localStorage persistence.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1024,
  quality = 0.82
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read photo file.'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const [, b64] = rawDataUrl.split(',');
        resolve({ dataUrl: rawDataUrl, base64: b64 || '', mimeType: file.type || 'image/jpeg' });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const [, base64] = dataUrl.split(',');
      resolve({ dataUrl, base64: base64 || '', mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      const [, b64] = rawDataUrl.split(',');
      resolve({ dataUrl: rawDataUrl, base64: b64 || '', mimeType: file.type || 'image/jpeg' });
    };
    img.src = rawDataUrl;
  });
}

/**
 * Converts a local preset asset URL (e.g. /src/assets/images/...) into base64 for Gemini analysis.
 */
export async function imageUrlToBase64(
  url: string
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not load sample crop photo.');
  }
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to encode sample image.'));
    reader.readAsDataURL(blob);
  });
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/data:([^;]+);/);
  return {
    dataUrl,
    base64: base64 || '',
    mimeType: mimeMatch?.[1] || 'image/jpeg',
  };
}

export async function blobToBase64(
  blob: Blob
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read voice recording.'));
    reader.readAsDataURL(blob);
  });
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/data:([^;]+);/);
  const cleanMime = (mimeMatch?.[1] || blob.type || 'audio/webm').split(';')[0];
  return {
    dataUrl,
    base64: base64 || '',
    mimeType: cleanMime,
  };
}
