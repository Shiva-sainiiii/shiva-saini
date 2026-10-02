"use client";
import { useEffect, useState } from "react";
import type { Cert } from "@/lib/content";

export default function Certificates({ items }: { items: Cert[] }) {
  const [open, setOpen] = useState<Cert | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((c) => (
          <li key={c.id}>
            <button onClick={() => setOpen(c)} className="group block w-full text-left">
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.title} loading="lazy" className="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              )}
              <p className="mt-3 font-medium">{c.title}</p>
              <p className="text-sm text-white/40">{c.issuer}</p>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div role="dialog" aria-label={open.title} onClick={() => setOpen(null)} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open.image} alt={open.title} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
