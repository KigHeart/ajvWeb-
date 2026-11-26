import { BRAND_META } from '../data/memorandum';
import { HeroCinemaReel } from './HeroCinemaReel';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onOpenInquiry: () => void;
}

export function HeroSection({ onOpenInquiry }: HeroSectionProps) {
  return (
    <section id="top" className="relative pt-10 pb-20 lg:pt-14 lg:pb-24 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-[#0B5563]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 -left-24 w-[380px] h-[380px] rounded-full bg-[#C89B3C]/12 blur-3xl"
      />

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="max-w-4xl">
          <div className="inline-block neu-raised-sm rounded-2xl px-5 py-3 mb-8">
            <ResilientImage
              src={BRAND_META.logoSrc}
              alt="Ajentir Ventures"
              className="h-11 sm:h-13 w-auto object-contain"
              fallbackTitle="Ajentir Ventures"
            />
          </div>

          <h1
            className="font-display font-semibold tracking-[-0.035em] text-[#0B2228] leading-[1.01] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5.2vw, 4.5rem)', textWrap: 'balance' }}
          >
            Investing in agentic AI for enterprise.
          </h1>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <p className="text-base sm:text-lg leading-[1.65] text-[#43585D] max-w-[46ch]">
              We back teams building autonomous workflows for SMEs—businesses deeply underserved by
              agentic AI infrastructure.
            </p>

            <div className="flex items-center gap-5 shrink-0">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="px-6 py-3.5 text-xs font-semibold tracking-wide text-white neu-btn-teal rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer"
              >
                Get in Touch
              </button>
              <a
                href="#focus"
                className="px-5 py-3 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl hover:text-[#0B5563] transition-colors whitespace-nowrap"
              >
                Our Focus
              </a>
            </div>
          </div>
        </div>

        <HeroCinemaReel />
      </div>
    </section>
  );
}
