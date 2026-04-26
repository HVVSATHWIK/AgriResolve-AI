import { useMemo } from 'react';
import { Link } from 'react-router-dom';

type TextSectionAction = {
  label: string;
  to: string;
};

export type TextSectionContent = {
  eyebrow: string;
  title: string;
  body: string;
  trust: string;
  background: string;
  primary: TextSectionAction;
  secondary?: TextSectionAction;
};

function SplitWords({ text }: { text: string }) {
  const words = useMemo(() => text.split(' ').filter(Boolean), [text]);

  return (
    <>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          data-word
          className={`inline-block will-change-transform ${index < words.length - 1 ? 'mr-[0.28em]' : ''}`}
        >
          {word}
        </span>
      ))}
    </>
  );
}

export function TextSection({ section, index }: { section: TextSectionContent; index: number }) {
  const HeadingTag = index === 0 ? 'h1' : 'h2';

  return (
    <section data-text-section className="absolute inset-0 h-screen min-h-[720px] overflow-hidden opacity-0">
      <div className={`absolute inset-0 bg-gradient-to-br ${section.background} opacity-24`} />
      <div className="landing-readability pointer-events-none absolute inset-0" />
      <div className="landing-noise pointer-events-none absolute inset-0" />
      <div className="landing-vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto grid h-full w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-20 md:grid-cols-2 md:px-10 lg:px-16">
        <article className="max-w-[600px]">
          <p data-reveal className="text-xs font-bold uppercase tracking-[0.22em] text-[#326151]">
            0{index + 1} / {section.eyebrow}
          </p>

          <HeadingTag
            className="mt-5 max-w-[11ch] text-5xl font-semibold leading-[0.98] text-[#10281f] md:text-6xl lg:text-7xl"
            style={{ fontFamily: 'Fraunces, ui-serif, Georgia, serif' }}
          >
            <SplitWords text={section.title} />
          </HeadingTag>

          <p className="mt-6 max-w-[600px] text-base leading-8 text-[#23463b] md:text-lg">
            <SplitWords text={section.body} />
          </p>

          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <Link
              to={section.primary.to}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#102f25] px-6 text-sm font-bold text-white shadow-[0_18px_44px_rgba(16,47,37,0.2)] transition hover:bg-[#174938]"
            >
              {section.primary.label}
            </Link>

            {section.secondary ? (
              <Link
                to={section.secondary.to}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#15382c]/20 bg-white/48 px-6 text-sm font-bold text-[#102f25] backdrop-blur-md transition hover:bg-white/72"
              >
                {section.secondary.label}
              </Link>
            ) : null}
          </div>

          <p data-reveal className="mt-8 max-w-[560px] border-l border-[#15382c]/24 pl-4 text-sm leading-6 text-[#42665b]">
            {section.trust}
          </p>
        </article>

        <div className="hidden h-full md:block" aria-hidden="true" />
      </div>
    </section>
  );
}
