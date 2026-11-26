import { motion } from 'motion/react';
import { INSTITUTION_META } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onOpenInquiry: () => void;
}

export function HeroSection({ onOpenInquiry }: HeroSectionProps) {
  return (
    <section id="top" className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
      {/* Subtle ambient light pools behind glass surfaces */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-[#0B5563]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 -left-24 w-[380px] h-[380px] rounded-full bg-[#C89B3C]/12 blur-3xl"
      />

      <div className="relative max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="max-w-4xl">
          <div className="inline-block neu-raised-sm rounded-2xl px-5 py-3.5 mb-10">
            <ResilientImage
              src={INSTITUTION_META.logoSrc}
              alt="Ajentir Ventures"
              className="h-12 sm:h-14 w-auto object-contain"
              fallbackTitle="Ajentir Ventures"
            />
          </div>

          <h1
            className="font-display font-semibold tracking-[-0.035em] text-[#0B2228] leading-[1.01] mb-7"
            style={{ fontSize: 'clamp(2.65rem, 5.5vw, 4.75rem)', textWrap: 'balance' }}
          >
            Investing in the autonomous economy.
          </h1>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
            <p className="text-base sm:text-lg leading-[1.65] text-[#43585D] max-w-[46ch]">
              Hybrid venture capital and venture creation from Nairobi, backing global agentic
              systems and autonomous enterprises.
            </p>

            <div className="flex items-center gap-6 shrink-0">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="px-6 py-3.5 text-xs font-semibold tracking-wide text-white neu-btn-teal rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer"
              >
                Request LP Brief
              </button>
              <a
                href="#thesis"
                className="px-5 py-3 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl hover:text-[#0B5563] transition-colors whitespace-nowrap"
              >
                Read Thesis
              </a>
            </div>
          </div>
        </div>

        {/* Sculpted Neumorphic Frame + Frosted Glass Overlay Plate */}
        <motion.div
          initial={{ opacity: 0.92, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="neu-raised p-2.5 sm:p-3.5 rounded-[28px]"
        >
          <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden rounded-[18px] bg-[#E3E9EA]">
            <ResilientImage
              src="/src/assets/images/hero_agentic_systems_1795692350262.jpg"
              alt="Multi-layer autonomous agent orchestration and compute architecture"
              className="w-full h-full object-cover"
              fallbackTitle="Agentic Systems"
            />

            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 glass-light rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#0B2228]">
              <span className="font-semibold">Fund I · $10M Target</span>
              <span className="text-[#43585D]">Agentic Systems & Autonomous Economy</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
