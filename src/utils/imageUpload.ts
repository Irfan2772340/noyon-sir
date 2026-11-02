/**
 * Resizes and compresses an image file to a lightweight, crisp Data URL
 * suitable for avatar display and Firestore document storage (under 60KB).
 */
export function processImageFileToDataUrl(
  file: File,
  maxDimension: number = 400,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('অনুগ্রহ করে একটি সঠিক ছবি (JPG, PNG) নির্বাচন করুন।'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ছবিটি পড়া সম্ভব হয়নি।'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ছবিটি লোড করা সম্ভব হয়নি।'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ক্যানভাস প্রস্তুত করা যায়নি।'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
