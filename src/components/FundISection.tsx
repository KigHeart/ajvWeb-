import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface FundISectionProps {
  onOpenInquiry: () => void;
}

const APPROACH_SLIDES = [
  {
    id: 'sme-gap',
    tab: '01 · Underserved SMEs',
    headline: 'Automating everyday enterprise work.',
    body: 'Small and mid-sized businesses need autonomous workflows for operations, compliance, and finance—not complex tools built only for Fortune 500 teams.',
  },
  {
    id: 'production',
    tab: '02 · Production Grade',
    headline: 'Reliability over demos.',
    body: 'We partner with builders focused on dependable execution, clear permissions, and software that enterprises can trust in daily production.',
  },
  {
    id: 'builders',
    tab: '03 · Long-Term Partners',
    headline: 'Backing founders early.',
    body: 'We work closely with technical founders turning agentic AI into lasting, practical software businesses.',
  },
];

export function FundISection({ onOpenInquiry }: FundISectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % APPROACH_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const current = APPROACH_SLIDES[activeIdx];

  return (
    <section
      id="approach"
      className="relative py-24 lg:py-28 bg-[#06262D] text-[#F5F7F7] overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-24 w-[480px] h-[480px] rounded-full bg-[#137B8E]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#C89B3C]/15 blur-3xl"
      />

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-medium text-[#E2C275] block mb-2">Our Conviction</span>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-white tracking-[-0.025em]"
              style={{ textWrap: 'balance' }}
            >
              Practical autonomy for real businesses.
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenInquiry}
            className="self-start sm:self-auto px-6 py-3 text-xs font-semibold text-[#06262D] bg-[#E2C275] hover:bg-[#ECD08D] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Connect With Us
          </button>
        </div>

        <div className="glass-dark rounded-3xl p-8 sm:p-10 min-h-[168px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full"
            >
              <div className="lg:col-span-5">
                <span className="font-mono text-xs text-[#E2C275] block mb-2">{current.tab}</span>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
                  {current.headline}
                </h3>
              </div>
              <div className="lg:col-span-7">
                <p className="text-sm sm:text-base text-[#D6E2E4] leading-relaxed">
                  {current.body}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
