"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useContent } from "@/lib/content";
import { EXPERIENCE, SITE } from "@/lib/data";
import Certificates from "./Certificates";
import Chat from "./Chat";
import Contact from "./Contact";
import Feedback from "./Feedback";
import Projects from "./Projects";
import Skills from "./Skills";

// wide = title upar, content full-bleed (skills marquee ke liye)
const Section = ({ id, title, wide, children }: { id: string; title: string; wide?: boolean; children: React.ReactNode }) =>
  wide ? (
    <section id={id} className="border-t border-white/10 py-28 md:py-40">
      <h2 className="mx-auto mb-12 max-w-6xl px-6 text-sm font-medium text-white/50">{title}</h2>
      {children}
    </section>
  ) : (
    <section id={id} className="mx-auto grid max-w-6xl gap-10 border-t border-white/10 px-6 py-28 md:grid-cols-[1fr_2fr] md:py-40">
      <h2 className="text-sm font-medium text-white/50">{title}</h2>
      <div>{children}</div>
    </section>
  );

const Row = ({ title, note }: { title: string; note: string }) => (
  <li className="group flex flex-col gap-2 border-b border-white/10 py-8 first:pt-0 md:flex-row md:items-baseline md:justify-between">
    <h3 className="text-3xl font-semibold text-white/90 transition-colors group-hover:text-white md:text-5xl">{title}</h3>
    <p className="max-w-xs text-white/50 transition-colors group-hover:text-white/80">{note}</p>
  </li>
);

export default function Sections() {
  // Ek hi fetch, saare sections ko data milta hai
  const { projects, skills, certificates, links, settings } = useContent();

  // Chat section tabhi dikhta hai jab server pe GEMINI_API_KEY ho aur admin ne bot off na kiya ho
  const [aiReady, setAiReady] = useState(false);
  useEffect(() => {
    fetch("/api/chat").then((r) => r.json()).then((d) => setAiReady(Boolean(d?.configured))).catch(() => {});
  }, []);
  return (
    <div className="bg-black text-white">
      <Section id="about" title="About me">
        <p className="text-3xl font-light leading-snug md:text-5xl">{SITE.bio}</p>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/60">{SITE.about}</p>
        <p className="mt-6 text-white/40">{SITE.stats.join("  ·  ")}</p>
      </Section>

      <Section id="projects" title="Projects"><Projects items={projects} /></Section>
      <Section id="skills" title="Skills" wide><Skills items={skills} /></Section>
      {certificates.length > 0 && <Section id="certificates" title="Certificates"><Certificates items={certificates} /></Section>}

      <Section id="experience" title="Experience">
        <ul>{EXPERIENCE.map((e) => <Row key={e.company} title={e.company} note={`${e.role} · ${e.period}`} />)}</ul>
      </Section>

      {aiReady && settings.chatbot_enabled !== "false" && (
        <Section id="chat" title="Ask AI"><Chat greeting={settings.chatbot_greeting} name={settings.chatbot_name} /></Section>
      )}

      {db && <Section id="feedback" title="Feedback"><Feedback /></Section>}
      <Section id="contact" title="Contact">
        <Contact links={[...links, { id: "resume", label: "Resume", url: SITE.resume }]} />
      </Section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/30">
        © {new Date().getFullYear()} {SITE.name}
        <a href="/admin" className="ml-4 text-white/15 transition-colors hover:text-white/50">Admin</a>
      </footer>
    </div>
  );
}
