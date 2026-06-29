const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function readCommentImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      reject(new Error('Choose a JPEG, PNG, GIF, or WebP image.'));
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image must be 5 MB or smaller.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read image.'));
    };

    reader.onerror = () => {
      reject(new Error('Could not read image.'));
    };

    reader.readAsDataURL(file);
  });
}
