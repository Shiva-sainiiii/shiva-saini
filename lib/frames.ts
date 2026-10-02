export const FRAME_COUNT = 148;

// Files public/frames/ me rakho: ezgif-frame-001.jpg ... ezgif-frame-148.jpg
export const frameSrc = (i: number) => `/frames/ezgif-frame-${String(i + 1).padStart(3, "0")}.jpg`;

// Load order: pehle har 4th frame (coarse), phir beech wale (fine).
// Isse user jaldi scroll kare tab bhi kareeb ka frame hamesha ready milta hai.
const ORDER = (() => {
  const coarse: number[] = [], fine: number[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) (i % 4 === 0 || i === FRAME_COUNT - 1 ? coarse : fine).push(i);
  return [...coarse, ...fine];
})();

/**
 * Background me frames load karta hai (6 parallel). Koi blocking loader nahi —
 * frame 1 aate hi site dikh jaati hai. `store[i]` me image bharti hai aur onLoad call hota hai.
 * Return: cancel function.
 */
export function startLoading(store: (HTMLImageElement | undefined)[], onLoad: () => void): () => void {
  let cancelled = false, next = 0;
  const worker = async () => {
    while (!cancelled && next < ORDER.length) {
      const i = ORDER[next++];
      const img = new Image();
      img.src = frameSrc(i);
      try {
        await img.decode(); // load + decode, taaki draw ke time jank na ho
        if (cancelled) return;
        store[i] = img;
        onLoad();
      } catch { /* ek frame fail hua to baaki chalte rahenge */ }
    }
  };
  for (let w = 0; w < 6; w++) worker();
  return () => { cancelled = true; };
}
