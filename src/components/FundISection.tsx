import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { InquiryPreset } from '../data/memorandum';

interface FundISectionProps {
  onOpenInquiry: (preset: InquiryPreset) => void;
}

const APPROACH_SLIDES = [
  {
    id: 'workflow-discovery',
    kicker: 'Workflow Discovery',
    headline: 'Inside real operations, before software.',
    body: 'We examine how people, tasks, and payments actually move inside organisations—uncovering repeatable bottlenecks that can grow into independent agentic AI companies.',
  },
  {
    id: 'sme-gap',
    kicker: 'Underserved SMEs',
    headline: 'Automating everyday enterprise work.',
    body: 'Small and mid-sized businesses need autonomous workflows across finance, compliance, and customer channels—not tools engineered only for large corporations.',
  },
  {
    id: 'incubation-training',
    kicker: 'Governance & Incubation',
    headline: 'Readiness for executives, demand for builders.',
    body: 'We equip SME leaders to govern shadow AI safely while pairing incubated builders with early design partners before spinout.',
  },
  {
    id: 'partners',
    kicker: 'Ecosystem Alignment',
    headline: 'Model providers, banks, and operators.',
    body: 'We connect frontier AI compute credits and commercial bank sandbox pilots so trusted agentic software reaches production faster.',
  },
];

const ECOSYSTEM_NODES: {
  title: string;
  role: string;
  preset: InquiryPreset;
}[] = [
  {
    title: 'Organisations',
    role: 'Operational workflow discovery and design-partner pilots',
    preset: { lane: 'partner', partnerType: 'discovery' },
  },
  {
    title: 'Founders & Builders',
    role: 'Capital and demand-backed venture incubation',
    preset: { lane: 'founder', founderTrack: 'incubation' },
  },
  {
    title: 'SME Leadership',
    role: 'Executive governance and workflow clinics',
    preset: { lane: 'training', trainingFocus: 'governance' },
  },
  {
    title: 'Banks & Model Labs',
    role: 'Regulated sandboxes and pooled inference credits',
    preset: { lane: 'partner', partnerType: 'bank' },
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
    <section id="approach" className="py-24 lg:py-28 bg-[#06262D] text-[#F5F7F7]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-medium tracking-wide text-[#E2C275] block mb-2">
              Our Conviction
            </span>
            <h2
              className="font-display text-2xl sm:text-4xl font-semibold text-white tracking-[-0.025em]"
              style={{ textWrap: 'balance' }}
            >
              Practical autonomy for real businesses.
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenInquiry({ lane: 'partner', partnerType: 'bank' })}
            className="self-start sm:self-auto px-6 py-3 text-xs font-semibold text-[#06262D] bg-[#E2C275] hover:bg-[#ECD08D] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Partner With Us
          </button>
        </div>

        <div className="glass-dark rounded-3xl p-8 sm:p-10 min-h-[164px] flex items-center">
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
                <span className="text-xs font-medium text-[#E2C275] block mb-2">
                  {current.kicker}
                </span>
                <h3 className="font-display text-xl sm:text-3xl font-semibold text-white tracking-[-0.02em]">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ECOSYSTEM_NODES.map((node) => (
            <button
              key={node.title}
              type="button"
              onClick={() => onOpenInquiry(node.preset)}
              className="glass-dark rounded-2xl p-5 text-left group hover:border-[#E2C275]/45 transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold text-white group-hover:text-[#E2C275] transition-colors">
                  {node.title}
                </span>
                <ArrowUpRight
                  className="w-3.5 h-3.5 text-[#E2C275]/80 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs text-[#C1D2D5] leading-relaxed">{node.role}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
