"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { PROJECTS, SITE, SKILLS } from "./data";

export type Project = { id: string; title: string; description: string; tech: string; category?: string | null; image: string; live_url: string; code_url: string };
export type Skill = { id: string; name: string };
export type Cert = { id: string; title: string; issuer: string; image: string; link: string };
export type LinkItem = { id: string; label: string; url: string };
export type Settings = Record<string, string>;
export type Content = { projects: Project[]; skills: Skill[]; certificates: Cert[]; links: LinkItem[]; settings: Settings };

// Fallback: Supabase na ho ya table khaali ho to ye dikhega (pehli paint instant)
const defaults: Content = {
  projects: PROJECTS.map((p, i) => ({ id: String(i), title: p.title, description: p.desc, tech: "", category: "", image: "", live_url: "", code_url: "" })),
  skills: SKILLS.map((name) => ({ id: name, name })),
  certificates: [],
  links: SITE.links.map((l) => ({ id: l.label, label: l.label, url: l.href })),
  settings: {},
};

export function useContent(): Content {
  const [content, setContent] = useState(defaults);
  useEffect(() => {
    if (!supabase) return;
    const get = (t: string) => supabase!.from(t).select("*").order("position").order("created_at");
    // settings table me position/created_at nahi hota, isliye alag fetch. Table na bani ho to error aayega, hum ignore karte hain.
    const getSettings = supabase.from("settings").select("key,value");
    Promise.all([get("projects"), get("skills"), get("certificates"), get("links"), getSettings]).then(([p, s, c, l, st]) =>
      setContent((prev) => ({
        projects: p.data?.length ? (p.data as Project[]) : prev.projects,
        skills: s.data?.length ? (s.data as Skill[]) : prev.skills,
        certificates: (c.data ?? []) as Cert[],
        links: l.data?.length ? (l.data as LinkItem[]) : prev.links,
        settings: Object.fromEntries(((st.data ?? []) as { key: string; value: string | null }[]).map((r) => [r.key, r.value ?? ""])),
      }))
    );
  }, []);
  return content;
}
