import { type MutableRefObject, type RefObject, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const SECTION_BLOCK_DURATION = 2;
const TOTAL_TIMELINE_DURATION = SECTION_BLOCK_DURATION * 3;
const REVEAL_DURATION = 1.2;
const SECTION_FADE_DURATION = 0.18;

export function useScrollTimeline(
  containerRef: RefObject<HTMLElement | null>,
  progressRef: MutableRefObject<number>
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.08,
      smoothWheel: true,
      wheelMultiplier: 0.72,
      touchMultiplier: 1,
      syncTouch: false,
      lerp: 0.075,
    });

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('[data-text-section]');
      const stage = container.querySelector<HTMLElement>('[data-landing-stage]');
      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: container.querySelector<HTMLElement>('[data-scroll-container]') ?? container,
          start: 'top top',
          end: 'bottom bottom',
          pin: stage ?? true,
          pinSpacing: true,
          scrub: 1,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });

      timeline.set(sections, { autoAlpha: 0 }, 0).to({}, { duration: TOTAL_TIMELINE_DURATION }, 0);

      sections.forEach((section, index) => {
        const words = section.querySelectorAll<HTMLElement>('[data-word]');
        const revealItems = section.querySelectorAll<HTMLElement>('[data-reveal]');
        const animatedItems = [...words, ...revealItems];
        const sectionStart = index * SECTION_BLOCK_DURATION;

        if (index === 0) {
          timeline.set(section, { autoAlpha: 1 }, 0).set(animatedItems, { autoAlpha: 1, y: 0 }, 0);
          return;
        }

        const previousSection = sections[index - 1];

        timeline
          .set(animatedItems, { autoAlpha: 0, y: 60 }, 0)
          .to(previousSection, { autoAlpha: 0, duration: SECTION_FADE_DURATION }, sectionStart - SECTION_FADE_DURATION)
          .set(section, { autoAlpha: 1 }, sectionStart)
          .to(
            words,
            {
              autoAlpha: 1,
              y: 0,
              duration: REVEAL_DURATION,
              stagger: { amount: 0.55 },
            },
            sectionStart
          )
          .to(
            revealItems,
            {
              autoAlpha: 1,
              y: 0,
              duration: REVEAL_DURATION,
              stagger: { amount: 0.18 },
            },
            sectionStart + 0.22
          );
      });

      ScrollTrigger.refresh();
    }, container);

    return () => {
      ctx.revert();
      gsap.ticker.remove(onTick);
      lenis.destroy();
      progressRef.current = 0;
    };
  }, [containerRef, progressRef]);
}
