"use client";
import { useState } from "react";
import type { Project } from "@/lib/content";
import { CATEGORIES } from "@/lib/data";

// Desktop: row hover/focus pe khulti hai (image + details). Mobile: hamesha khuli.
// Tags (Web Game / AI / Website) ke filter chips tab dikhte hain jab kam se kam 2 alag tags hon.
export default function Projects({ items }: { items: Project[] }) {
  const [filter, setFilter] = useState("");
  const tags = CATEGORIES.filter((c) => items.some((p) => p.category === c));
  const shown = filter ? items.filter((p) => p.category === filter) : items;

  return (
    <div>
      {tags.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2 text-sm">
          {["", ...tags].map((t) => (
            <button key={t || "all"} onClick={() => setFilter(t)} aria-pressed={filter === t}
              className={`rounded-full px-4 py-1.5 transition-colors ${filter === t ? "bg-white text-black" : "border border-white/15 text-white/60 hover:text-white"}`}>
              {t || "All"}
            </button>
          ))}
        </div>
      )}

      <ul>
        {shown.map((p) => (
          <li key={p.id} tabIndex={0} className="group border-b border-white/10 py-8 outline-none first:pt-0">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
                <h3 className="text-3xl font-semibold text-white/60 transition-colors group-hover:text-white group-focus:text-white md:text-5xl">
                  {p.title}
                </h3>
                {p.category && <span className="rounded-full border border-white/15 px-3 py-0.5 text-xs text-white/50">{p.category}</span>}
              </div>
              <span className="hidden text-3xl text-white/30 transition-transform duration-500 group-hover:rotate-45 group-focus:rotate-45 md:block">+</span>
            </div>
            <div className="grid transition-[grid-template-rows] duration-500 md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <div className={`grid gap-6 pt-6 ${p.image ? "md:grid-cols-[1.2fr_1fr]" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={p.image} alt={p.title} loading="lazy" className="aspect-video w-full rounded-xl object-cover" />}
                  <div>
                    <p className="text-white/60">{p.description}</p>
                    {p.tech && (
                      <ul className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                        {p.tech.split(",").map((t) => (
                          <li key={t} className="rounded-full border border-white/15 px-3 py-1">{t.trim()}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-5 flex gap-6 text-sm">
                      {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">Live</a>}
                      {p.code_url && <a href={p.code_url} target="_blank" rel="noreferrer" className="text-white/50 underline-offset-4 hover:text-white hover:underline">Code</a>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
