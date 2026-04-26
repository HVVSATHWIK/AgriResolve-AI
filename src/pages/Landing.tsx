import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlantScene } from './PlantScene';
import { TextSection, type TextSectionContent } from './TextSection';
import { useScrollTimeline } from './useScrollTimeline';

const sections: TextSectionContent[] = [
  {
    eyebrow: 'Crop care that starts in the field',
    title: 'Understand your crop',
    body:
      'AgriResolve AI helps farmers turn a leaf photo and field context into clear, practical crop guidance.',
    trust: 'Built for farmers, advisors, and local agri teams across India.',
    background: 'from-[#eef5e6] via-[#f8f8f0] to-[#e6eef6]',
    primary: { label: 'Start diagnosis', to: '/login' },
    secondary: { label: 'Create account', to: '/signup' },
  },
  {
    eyebrow: 'Early detection before spread',
    title: 'Detect disease early',
    body:
      'Focus on symptoms before they spread, with guidance that is simple enough to use during a field visit.',
    trust: 'Faster checks mean fewer wasted sprays and better-timed decisions.',
    background: 'from-[#edf5ef] via-[#f5f8f1] to-[#e9eefb]',
    primary: { label: 'Try leaf scan', to: '/diagnosis' },
  },
  {
    eyebrow: 'Confidence when action matters',
    title: 'Take action with confidence',
    body:
      'Move from detection to treatment steps that farmers can understand, compare, and act on quickly.',
    trust: 'Designed to support the next field visit, not just show a score.',
    background: 'from-[#f3eadb] via-[#f8f7ef] to-[#e7eef8]',
    primary: { label: 'Start free analysis', to: '/signup' },
    secondary: { label: 'View dashboard', to: '/dashboard' },
  },
];

export function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useScrollTimeline(containerRef, progressRef);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-[#f7f8f1] text-slate-950">
      <PlantScene progressRef={progressRef} />

      <header className="fixed left-0 top-0 z-30 w-full px-5 py-5 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_auto]">
          <Link to="/" className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#102f25]">
            AgriResolve AI
          </Link>

          <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-[#42665b] md:block">
            Trusted crop guidance for Indian fields
          </p>

          <Link
            to="/login"
            className="h-10 items-center justify-center rounded-full border border-[#15382c]/16 bg-white/64 px-4 text-xs font-bold text-[#102f25] backdrop-blur-md transition hover:bg-white/80 sm:inline-flex"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-20">
        <section data-scroll-container className="relative h-[300vh]">
          <div data-landing-stage className="relative h-screen overflow-hidden">
            {sections.map((section, index) => (
              <TextSection key={section.title} index={index} section={section} />
            ))}
          </div>
        </section>

        <footer className="relative z-20 border-t border-[#15382c]/10 bg-[#0f241c] px-6 py-10 text-white md:px-10">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#dbead8]">
                Trusted by farmers across India
              </p>
              <p className="mt-3 text-sm text-white/68">&copy; 2026 AgriResolve AI</p>
            </div>

            <nav className="flex flex-wrap gap-5 text-sm font-semibold text-white/76 md:justify-end" aria-label="Footer">
              <a href="#privacy" className="transition hover:text-white">
                Privacy
              </a>
              <a href="#terms" className="transition hover:text-white">
                Terms
              </a>
              <a href="mailto:support@agriresolve.ai" className="transition hover:text-white">
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
