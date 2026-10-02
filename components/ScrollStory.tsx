"use client";

import { useEffect, useRef } from "react";
import { FRAME_COUNT, startLoading } from "@/lib/frames";
import { SITE } from "@/lib/data";

/* ---- Scroll phases (track ke andar 0..1 progress) ---- */
const FRAMES_END = 0.75; // 0–75%  : frames play
const CIRCLES_END = 0.9; // 75–90% : circles grow -> full black. 90%+ : naam reveal
const CIRCLE_COUNT = 12;
const CIRCLE_SIZE = 1500; // px, scale 1 pe diameter

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Seeded random: server aur client pe same positions (hydration mismatch nahi hoga)
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(148);
const CIRCLES = Array.from({ length: CIRCLE_COUNT }, () => ({
  x: +(10 + rand() * 80).toFixed(1), // % — screen ke andar hi
  y: +(10 + rand() * 80).toFixed(1),
  delay: rand() * 0.4, // stagger: sab ek saath start nahi honge
}));

const reveal = (el: HTMLElement | null, t: number) => {
  if (!el) return;
  el.style.opacity = String(t);
  el.style.transform = `translateY(${(1 - t) * 24}px)`;
};

export default function ScrollStory() {
  // Koi state nahi — scroll aur loading dono refs + rAF se chalte hain.
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const track = trackRef.current!;
    const stage = stageRef.current!;
    const ctx = canvas.getContext("2d")!;
    const frames: (HTMLImageElement | undefined)[] = new Array(FRAME_COUNT);

    let trackTop = 0, range = 1;   // cached layout (scroll pe layout read nahi karte)
    let target = 0, current = 0;   // target = asli progress, current = smoothed
    let raf = 0, wanted = 0, drawn = -1;

    // Jo frame chahiye wo load nahi hua to sabse kareeb ka pehle wala frame dikhao
    const nearest = (i: number) => { for (let k = i; k >= 0; k--) if (frames[k]) return k; return -1; };

    // "Cover" fit: image poori screen bhare, bina stretch ke (center crop)
    const paint = () => {
      const k = nearest(wanted);
      if (k < 0 || k === drawn) return;
      const img = frames[k]!;
      const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawn = k;
      canvas.style.opacity = "1"; // pehla frame aate hi soft fade-in (koi loader nahi)
    };

    const render = (p: number) => {
      // Phase 1: frame index
      wanted = Math.min(FRAME_COUNT - 1, Math.round(clamp(p / FRAMES_END) * (FRAME_COUNT - 1)));
      paint();

      // Phase 2: circles 0 -> 1500px. Overlap hote hi black circles merge ho jaate hain.
      const c = clamp((p - FRAMES_END) / (CIRCLES_END - FRAMES_END));
      circleRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = easeOut(clamp((c - CIRCLES[i].delay) / (1 - CIRCLES[i].delay)));
        el.style.transform = `translate(-50%,-50%) scale(${t})`;
      });
      // Safety net: kisi bhi screen size pe 90% tak 100% black guaranteed
      if (overlayRef.current) overlayRef.current.style.opacity = String(clamp((c - 0.85) / 0.15));

      // Phase 3: naam + tagline (staggered)
      reveal(nameRef.current, clamp((p - CIRCLES_END) / 0.05));
      reveal(tagRef.current, clamp((p - CIRCLES_END - 0.03) / 0.05));
      if (hintRef.current) hintRef.current.style.opacity = String(1 - clamp(p / 0.04));
    };

    const progress = () => clamp((window.scrollY - trackTop) / range);

    // Resize: DPR ke hisaab se canvas buffer — retina pe sharp (perf ke liye 2x cap)
    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.imageSmoothingEnabled = true;     // width/height set karne ke baad hi (reset ho jaati hai)
      ctx.imageSmoothingQuality = "high";
      trackTop = track.offsetTop;
      range = Math.max(1, track.offsetHeight - stage.clientHeight);
      target = current = progress();
      drawn = -1;
      render(current);
    };

    // Lerp loop: sirf tab chalta hai jab current != target (idle me 0% CPU)
    const tick = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0003) current = target;
      render(current);
      raf = current !== target ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    measure();
    const stopLoading = startLoading(frames, paint); // background me, bina rukawat
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      stopLoading();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    // Tall track = scroll distance. Isko chhota/bada karke speed control karo.
    <div ref={trackRef} className="relative h-[700vh]">
      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-black">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" />

        {CIRCLES.map((c, i) => (
          <div
            key={i}
            ref={(el) => { circleRefs.current[i] = el; }}
            className="absolute rounded-full bg-black will-change-transform"
            style={{
              left: `${c.x}%`, top: `${c.y}%`,
              width: CIRCLE_SIZE, height: CIRCLE_SIZE,
              transform: "translate(-50%,-50%) scale(0)",
            }}
          />
        ))}
        <div ref={overlayRef} className="absolute inset-0 bg-black opacity-0" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1
            ref={nameRef}
            className="text-[clamp(2.75rem,11vw,9rem)] font-extrabold leading-none tracking-tight opacity-0"
          >
            {SITE.name}
          </h1>
          <p ref={tagRef} className="mt-8 max-w-3xl text-xs tracking-[0.25em] text-white/60 opacity-0 md:text-sm">
            {SITE.tagline}
          </p>
        </div>

        <div ref={hintRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-white/70">
          Scroll to explore
        </div>
      </div>
    </div>
  );
}
