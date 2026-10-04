/**
 * Element me lines ko type -> ruko -> delete karke loop me chalata hai.
 * React state nahi, seedha textContent — isliye zero re-render. Return: stop function.
 */
export function startTypewriter(el: HTMLElement, lines: string[]): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = lines[0];
    return () => {};
  }
  let line = 0, chars = 0, erasing = false;
  let timer: ReturnType<typeof setTimeout>;

  const tick = () => {
    const text = lines[line];
    chars += erasing ? -1 : 1;
    el.textContent = text.slice(0, chars);

    let wait = erasing ? 28 : 55 + Math.random() * 70; // insaan jaisi uneven typing
    if (!erasing && chars === text.length) { erasing = true; wait = 1700; }          // poori line pe ruko
    else if (erasing && chars === 0) { erasing = false; line = (line + 1) % lines.length; wait = 450; }
    timer = setTimeout(tick, wait);
  };
  tick();
  return () => clearTimeout(timer);
}
