// Saara content yahin se edit karo — components ko chhoone ki zaroorat nahi.
export const SITE = {
  name: "SHIVA SAINI",
  tagline: "CREATIVE • AI INTEGRATED • FULL STACK WEB DEVELOPER",
  role: "Full Stack Web Developer | Creative Developer | AI Integrated",
  bio: "I build immersive web experiences where design meets AI.",
  about:
    "I'm a self-driven full stack developer from Kharkhoda (Sonipat), Haryana. I build fast, responsive, AI-powered websites for businesses in Haryana and across India, and I like turning complex problems into clean, scalable solutions.",
  stats: ["10+ projects", "5+ certifications", "3 web development internships"],
  location: "Kharkhoda (Sonipat), Haryana, India",
  email: "shivasaini.5666@gmail.com",
  resume: "https://shivasainiportfolio.vercel.app/assets/Shiva_Saini_Resume.pdf",
  links: [
    { label: "GitHub", href: "https://github.com/Shiva-sainiiii" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/shiva-sainiiii" },
    { label: "Instagram", href: "https://instagram.com/shiva_sainiiii" },
  ],
};

// Purane portfolio se projects ki list load nahi ho payi — descriptions aur links tum bharna.
export const PROJECTS = [
  { title: "Z-BLACK", desc: "A dark, motion-first web experience." },
  { title: "AI Tools", desc: "AI-powered utilities for everyday workflows." },
  { title: "Portfolio System", desc: "Portfolio with AI chat, live feedback and an owner-only admin panel." },
];

// Project tags (admin me dropdown + site pe filter yahin se). Naya tag chahiye to bas yahan add karo.
export const CATEGORIES = ["Web Game", "AI", "Website"] as const;

export const SKILLS = [
  "Next.js", "React", "JavaScript", "Node.js", "Three.js", "Framer Motion",
  "AI Integration", "Firebase", "Python (Flask)", "Tailwind",
];

// Newest pehle
export const EXPERIENCE = [
  { company: "Maincrafts Technology", role: "Web Development Intern", period: "Jun–Jul 2026" },
  { company: "OctaNet", role: "Web Development Intern", period: "Oct–Dec 2024" },
  { company: "CodSoft", role: "Web Development Intern", period: "Sep–Oct 2024" },
];
