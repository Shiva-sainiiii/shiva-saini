import { EXPERIENCE, PROJECTS, SITE, SKILLS } from "@/lib/data";

// Server component — koi JS nahi chahiye, sirf markup.
const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="mx-auto grid max-w-6xl gap-10 border-t border-white/10 px-6 py-28 md:grid-cols-[1fr_2fr] md:py-40">
    <h2 className="text-sm font-medium text-white/50">{title}</h2>
    <div>{children}</div>
  </section>
);

// Projects aur Experience dono ek hi row-style use karte hain
const Row = ({ title, note }: { title: string; note: string }) => (
  <li className="group flex flex-col gap-2 border-b border-white/10 py-8 first:pt-0 md:flex-row md:items-baseline md:justify-between">
    <h3 className="text-3xl font-semibold text-white/90 transition-colors group-hover:text-white md:text-5xl">{title}</h3>
    <p className="max-w-xs text-white/50 transition-colors group-hover:text-white/80">{note}</p>
  </li>
);

export default function Sections() {
  return (
    <div className="bg-black text-white">
      <Section id="about" title="About me">
        <p className="text-3xl font-light leading-snug md:text-5xl">{SITE.bio}</p>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/60">{SITE.about}</p>
        <p className="mt-6 text-white/40">{SITE.stats.join("  ·  ")}</p>
      </Section>

      <Section id="projects" title="Projects">
        <ul>{PROJECTS.map((p) => <Row key={p.title} title={p.title} note={p.desc} />)}</ul>
      </Section>

      <Section id="skills" title="Skills">
        <ul className="flex flex-wrap gap-x-10 gap-y-4 text-2xl font-light md:text-4xl">
          {SKILLS.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </Section>

      <Section id="experience" title="Experience">
        <ul>{EXPERIENCE.map((e) => <Row key={e.company} title={e.company} note={`${e.role} · ${e.period}`} />)}</ul>
      </Section>

      <Section id="contact" title="Contact">
        <a href={`mailto:${SITE.email}`} className="break-all text-2xl font-semibold underline-offset-8 hover:underline md:text-5xl">
          {SITE.email}
        </a>
        <p className="mt-6 text-white/40">{SITE.location}</p>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-white/50">
          {[...SITE.links, { label: "Resume", href: SITE.resume }].map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">{l.label}</a>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/30">
        © {new Date().getFullYear()} {SITE.name}
      </footer>
    </div>
  );
}
