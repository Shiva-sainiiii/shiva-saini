export const FRAME_COUNT = 148;

// Files public/frames/ me rakho: ezgif-frame-001.jpg ... ezgif-frame-148.jpg
export const frameSrc = (i: number) => `/frames/ezgif-frame-${String(i + 1).padStart(3, "0")}.jpg`;

/** Saare frames parallel load + decode karta hai aur har frame ke baad % report karta hai. */
export function preloadFrames(onProgress: (pct: number) => void): Promise<HTMLImageElement[]> {
  let done = 0;
  return Promise.all(
    Array.from({ length: FRAME_COUNT }, (_, i) => {
      const img = new Image();
      img.src = frameSrc(i);
      // decode() = load + decode, taaki pehli draw pe jank na aaye. Fail hua to bhi progress chalta rahe.
      return img
        .decode()
        .catch(() => undefined)
        .then(() => {
          onProgress(Math.round((++done / FRAME_COUNT) * 100));
          return img;
        });
    })
  );
}
