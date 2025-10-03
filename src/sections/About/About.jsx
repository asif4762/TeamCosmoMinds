// src/sections/About.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2, Rocket, Sparkles, Leaf, Users, HeartHandshake,
  Layers, ShieldCheck, Github, Star, ChevronDown, ExternalLink
} from "lucide-react";
import Contact from "./Contact";

const fade = (d = 0, y = 14) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, delay: d }
});

// Tiny animated counter
const Counter = ({ to = 100, duration = 1400, className = "" }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.floor(start + (to - start) * (1 - Math.cos(p * Math.PI)) / 2));
      if (p < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span className={className}>{val.toLocaleString()}</span>;
};

const Pillar = ({ icon: Icon, title, desc, color }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div className={`inline-flex items-center justify-center rounded-lg ${color} w-10 h-10 mb-3`}>
      <Icon className="text-black" size={18} />
    </div>
    <h3 className="text-white font-semibold">{title}</h3>
    <p className="text-white/75 text-sm mt-1">{desc}</p>
  </div>
);

const QA = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left px-4 py-3"
        aria-expanded={open}
      >
        <span className="text-white font-medium">{q}</span>
        <ChevronDown className={`text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-4 text-white/75 text-sm"
          >
            {a}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function About() {
  return (
    <div className="relative min-h-screen w-full">
      {/* Soft cosmic glow */}
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute inset-0 " />
      </div>

      <main id="main" className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-6 pt-28 pb-16">
          <motion.div {...fade(0)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-black bg-teal-300/90 px-3 py-1 rounded-full">
                NASA Space Apps 2025
              </span>
              <span className="text-xs font-semibold text-black bg-blue-300/90 px-3 py-1 rounded-full">
                Open Source
              </span>
              <span className="text-xs font-semibold text-black bg-purple-300/90 px-3 py-1 rounded-full">
                Terra -  25 years
              </span>
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              About <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-blue-300 to-purple-300">CosmoMinds</span>
            </h1>
            <p className="mt-3 max-w-3xl text-white/85">
              We turn complex Earth data into playful, kid-friendly stories and interactive maps. Our mission:
              spark climate curiosity and action—one flipbook, one globe, one child at a time.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="/terra-game"
                className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 font-semibold hover:bg-white/90"
              >
                <Rocket size={16} /> Try Terra Explorer
              </a>
              <a
                href="#team"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 hover:bg-white/10"
              >
                <Users size={16} /> Meet the team
              </a>
            </div>
          </motion.div>
        </section>

        {/* PILLARS */}
        <section className="mx-auto max-w-6xl px-6 pb-10 grid gap-4 sm:grid-cols-3">
          <motion.div {...fade(0.05)}>
            <Pillar
              icon={Sparkles}
              title="Story first"
              desc="Beautiful narratives that make kids feel, think, and ask better questions about their world."
              color="bg-teal-300"
            />
          </motion.div>
          <motion.div {...fade(0.1)}>
            <Pillar
              icon={Globe2}
              title="Data you can touch"
              desc="An interactive globe powered by Terra-era insights—temperature, floods, forests, and more."
              color="bg-blue-300"
            />
          </motion.div>
          <motion.div {...fade(0.15)}>
            <Pillar
              icon={Leaf}
              title="Hope in action"
              desc="Every story ends with simple steps kids can take—plant, protect, participate."
              color="bg-purple-300"
            />
          </motion.div>
        </section>

        {/* METRICS */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <motion.div
            {...fade(0.05)}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 grid gap-6 sm:grid-cols-4"
          >
            <div>
              <div className="text-3xl font-extrabold text-white">
                <Counter to={8} />+
              </div>
              <div className="text-white/70 text-sm mt-1">Country storybooks</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">
                <Counter to={25} /> yrs
              </div>
              <div className="text-white/70 text-sm mt-1">Terra-era timeline</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">
                <Counter to={14} />
              </div>
              <div className="text-white/70 text-sm mt-1">Data layers & metrics</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">
                <Counter to={5000} />+
              </div>
              <div className="text-white/70 text-sm mt-1">Kids we aim to reach</div>
            </div>
          </motion.div>
        </section>

        {/* HOW WE BUILT IT */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <motion.h2 className="text-white text-2xl font-bold" {...fade(0)}>How we built it</motion.h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <motion.div {...fade(0.05)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="text-teal-300" /> <span className="text-white font-semibold">Stack</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["React", "Vite", "Tailwind", "Framer Motion", "Three.js", "Globe.gl", "Chart.js"].map((t) => (
                  <span key={t} className="text-xs text-black bg-white px-2 py-1 rounded-md font-semibold">{t}</span>
                ))}
              </div>
              <p className="text-white/75 text-sm mt-3">
                Flipbook storytelling meets 3D Earth—designed to be fast, responsive, and delightful.
              </p>
            </motion.div>

            <motion.div {...fade(0.1)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="text-blue-300" /> <span className="text-white font-semibold">Principles</span>
              </div>
              <ul className="text-white/80 text-sm list-disc pl-5 space-y-1">
                <li>Kid-friendly language, science-accurate framing</li>
                <li>Hopeful arcs: from problem → action → promise</li>
                <li>Accessible UI, keyboard & screen-reader friendly</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* TIMELINE */}
        {/* <section className="mx-auto max-w-6xl px-6 pb-16">
          <motion.h2 className="text-white text-2xl font-bold" {...fade(0)}>Journey</motion.h2>
          <motion.ol {...fade(0.05)} className="mt-4 relative border-l border-white/15 pl-6 space-y-6">
            {[
              { t: "Day 1", d: "Brainstormed ‘storybook + globe’ concept; wrote the first country narrative." },
              { t: "Day 2", d: "Built 3D globe interactions, data panels, and flipbook shell." },
              { t: "Day 3", d: "Added animations, polish, and accessibility tweaks. Deployed demo." }
            ].map((it, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gradient-to-r from-teal-300 to-blue-300 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]" />
                <div className="text-white font-semibold">{it.t}</div>
                <div className="text-white/75 text-sm">{it.d}</div>
              </li>
            ))}
          </motion.ol>
        </section> */}

        {/* PROJECT DESCRIPTION */}
<section id="project-description" className="mx-auto max-w-6xl px-6 pb-16">
  <motion.h2 className="text-white text-2xl font-bold" {...fade(0)}>
    Detailed Project Description
  </motion.h2>

  <motion.div {...fade(0.05)} className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80 text-sm space-y-4 leading-relaxed max-h-[600px] overflow-y-auto">
    <p>
      <strong>Terra Celebration</strong> is an interactive web-based visualization platform designed to bring global climate and environmental data to life. Using high-resolution satellite imagery and derived datasets from NASA’s Terra satellites (ASTER, MODIS, MISR, CERES), the project presents 25 years of environmental data for six countries. 
    </p>
    <p>
      The platform combines scientific rigor with visual storytelling, enabling users to explore climate trends, urbanization, vegetation, and disaster impacts interactively.
    </p>

    <h3 className="text-white font-semibold text-lg mt-4">AI-Powered Features</h3>
    <ul className="list-disc pl-6 space-y-1">
      <li><strong>Q&A Chatbot:</strong> Users can ask climate and environment-related questions and receive instant answers using AI trained on Terra data and related resources.</li>
      <li><strong>Research Paper & PDF Analysis:</strong> Users can upload research papers or PDF documents, and the AI extracts key information and generates visual summaries integrated into the platform.</li>
    </ul>

    <h3 className="text-white font-semibold text-lg mt-4">Main Pages</h3>
    <p><strong>1. Global Story & Statistics:</strong> Displays maps, images, and statistics for each country, including Mean/Min/Max radiation, NDVI, LST anomalies, and vegetation cover, with contextual seasonal and urbanization insights.</p>
    <p><strong>2. Country-Specific Climate & Urbanization Analysis:</strong> Focuses on one country at a time, with year-by-year data for climate, CO₂ emissions, forest cover, and urbanization, plus narrative descriptions linking climate events and human impacts.</p>

    <h3 className="text-white font-semibold text-lg mt-4">Problems We Solve</h3>
    <ul className="list-disc pl-6 space-y-1">
      <li>Making satellite data accessible for non-experts.</li>
      <li>Raising community awareness about climate impacts and solutions.</li>
      <li>Supporting policy guidance with consolidated analytics.</li>
      <li>Providing educational tools for students and researchers.</li>
      <li>Extracting insights from scientific papers using AI.</li>
    </ul>

    <h3 className="text-white font-semibold text-lg mt-4">How It Works</h3>
    <ol className="list-decimal pl-6 space-y-1">
      <li><strong>Data Collection:</strong> Pull datasets from NASA Terra satellite archives.</li>
      <li><strong>Processing:</strong> Calculate statistics like Mean, Min, Max, NDVI, CO₂ emissions, forest cover, etc.</li>
      <li><strong>Visualization:</strong> Display through global maps, charts, temporal navigation, and dashboards.</li>
      <li><strong>AI Integration:</strong> Provide chatbot answers and research paper analysis.</li>
      <li><strong>Narrative Integration:</strong> Add automated contextual stories for each country and year.</li>
    </ol>

    <h3 className="text-white font-semibold text-lg mt-4">Advantages</h3>
    <ul className="list-disc pl-6 space-y-1">
      <li><strong>Comprehensive:</strong> 25 years of multi-country, multi-sensor data with AI insights.</li>
      <li><strong>Interactive & Engaging:</strong> Explore maps, charts, narratives, and Q&A dynamically.</li>
      <li><strong>Actionable Insights:</strong> Strategies for communities, policymakers, and researchers.</li>
      <li><strong>Educational:</strong> Bridges raw satellite data and real-world climate impacts.</li>
      <li><strong>Scalable:</strong> Expandable to more countries and datasets.</li>
    </ul>
  </motion.div>
</section>

        {/* TEAM */}
        <section id="team" className="mx-auto max-w-6xl px-6 pb-16">
          <motion.h2 className="text-white text-2xl font-bold" {...fade(0)}>Team</motion.h2>
          {/* <motion.p className="text-white/75 mt-1" {...fade(0.05)}>
            A tiny team with big hearts for science, design, and kids.
          </motion.p> */}

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* why this? */}
            {[
              { name: "ASIF ZAMAN", role: "Machine Learning Engineer", img: "https://i.ibb.co.com/DHmLW7K0/Whats-App-Image-2025-09-23-at-10-30-29.jpg" },
              { name: "AFRIDI AKBAR IFTY", role: "Full-Stack Developer", img: "https://i.ibb.co.com/ynHZtbpw/Whats-App-Image-2025-09-23-at-10-30-29-1.jpg" },
              { name: "ROBIUL HASAN", role: "Project Storyteller", img: "https://i.ibb.co.com/xkzbkTK/Whats-App-Image-2025-09-23-at-10-30-29-2.jpg" },
              { name: "MEHRAB-AL-HASAN", role: "Video Editor", img: "https://i.ibb.co.com/1GsMC4wL/Whats-App-Image-2025-09-23-at-10-32-05.jpg" },
              { name: "ABRAR HOSSAIN", role: "UI/UX Designer", img: "https://i.ibb.co.com/cKNNDfqL/Whats-App-Image-2025-09-23-at-10-30-00.jpg" },
              { name: "KAZI TAHERA JANNAT", role: "Researcher", img: "https://i.ibb.co.com/Wp57yvJK/Whats-App-Image-2025-09-23-at-10-30-28.jpg" }
            ].map((p, i) => (
              <motion.div key={p.name} {...fade(0.05 + i * 0.05)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                    onError={(e) => { e.currentTarget.src = "/images/team/placeholder.png"; }}
                  />
                  <div>
                    <div className="text-white font-semibold">{p.name}</div>
                    <div className="text-white/70 text-sm">{p.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        {/* <section className="mx-auto max-w-6xl px-6 pb-16">
          <motion.h2 className="text-white text-2xl font-bold" {...fade(0)}>FAQ</motion.h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <QA
              q="Is the content scientifically accurate?"
              a="We simplify language for kids but retain scientific fidelity. When in doubt, we favor clarity + hope, then link to deeper sources."
            />
            <QA
              q="Can schools use it freely?"
              a="Yes! It’s open for classroom use. Reach out for a quick-start pack or offline builds."
            />
            <QA
              q="Does it work on phones?"
              a="Yep. It’s responsive and touch-friendly. For the globe, newer phones feel best."
            />
            <QA
              q="How can I contribute?"
              a="Open issues, send pull requests, or share story drafts. Designers, translators, and educators are extra welcome."
            />
          </div>
        </section> */}

        {/* CTA */}
        {/* <section className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            {...fade(0)}
            className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                <HeartHandshake className="text-teal-300" /> Join the mission
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Partner with us, bring data, write a story, or test with your class.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/terra-game"
                className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 font-semibold hover:bg-white/90"
              >
                Explore app <Star size={16} />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 hover:bg-white/10"
              >
                Contact us
              </a>
            </div>
          </motion.div>

   
        </section> */}

      </main>
    </div>
  );
}
