import type { Skill } from "@/lib/content";

// Do rows, ulti direction me chalti marquee. Edges pe fade mask.
export default function Skills({ items }: { items: Skill[] }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)].filter((r) => r.length);
  return (
    <div className="space-y-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      {rows.map((row, r) => (
        <div key={r} className="marquee flex w-max gap-14 text-4xl font-light md:text-6xl" style={{ animationDirection: r ? "reverse" : "normal" }}>
          {Array.from({ length: 8 }).flatMap(() => row).map((s, i) => (
            <span key={i} className="whitespace-nowrap text-white/70">{s.name}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
