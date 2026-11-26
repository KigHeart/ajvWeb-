import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { FOCUS_AREAS } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

export function MandateSection() {
  const [activeId, setActiveId] = useState(FOCUS_AREAS[0].id);
  const current = FOCUS_AREAS.find((v) => v.id === activeId) || FOCUS_AREAS[0];

  return (
    <section id="focus" className="relative py-20 lg:py-28 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/3 w-[520px] h-[520px] -translate-y-1/2 rounded-full bg-[#0B5563]/8 blur-3xl"
      />

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <div className="mb-10">
              <span className="inline-block neu-pressed rounded-xl px-4 py-2 text-xs font-medium text-[#0B5563] mb-4">
                Focus
              </span>
              <h2
                className="font-display text-2xl sm:text-4xl font-semibold text-[#0B2228] tracking-[-0.025em]"
                style={{ textWrap: 'balance' }}
              >
                Where we invest.
              </h2>
            </div>

            <div className="space-y-3">
              {FOCUS_AREAS.map((area) => {
                const isActive = area.id === current.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onMouseEnter={() => setActiveId(area.id)}
                    onClick={() => setActiveId(area.id)}
                    aria-expanded={isActive}
                    className={`w-full text-left px-6 py-5 rounded-2xl transition-all duration-200 group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0B5563] ${
                      isActive ? 'neu-raised' : 'hover:bg-white/40'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <span
                        className={`font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] transition-colors duration-150 ${
                          isActive
                            ? 'text-[#0B5563]'
                            : 'text-[#0B2228] group-hover:text-[#0B5563]'
                        }`}
                      >
                        {area.title}
                      </span>

                      <ArrowUpRight
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isActive
                            ? 'text-[#B5862A] translate-x-0.5 -translate-y-0.5'
                            : 'text-[#8D9DA1] group-hover:text-[#0B2228]'
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    {isActive && (
                      <p className="mt-2.5 text-sm sm:text-base text-[#43585D] leading-relaxed max-w-[50ch]">
                        {area.summary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="neu-raised p-3 rounded-[28px]">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-[#E3E9EA]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0.45 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.45 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                  >
                    <ResilientImage
                      src={current.image}
                      alt={current.imageAlt}
                      className="w-full h-full object-cover"
                      fallbackTitle={current.title}
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-3.5 left-3.5 right-3.5 glass-light rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#0B2228]">
                  <span className="font-display font-medium text-xs sm:text-sm">
                    {current.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
