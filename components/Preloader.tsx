// Full-screen loader: 0–100% + patli progress line. Done hone par fade-out.
export default function Preloader({ progress, done }: { progress: number; done: boolean }) {
  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <p className="text-8xl font-light tabular-nums tracking-tight md:text-9xl">
        {progress}
        <span className="ml-1 text-3xl text-white/40">%</span>
      </p>
      <div className="mt-10 h-px w-48 bg-white/15">
        <div className="h-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
