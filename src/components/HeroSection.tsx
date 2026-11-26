import { BrandLockup } from './BrandLockup';
import { HeroCinemaReel } from './HeroCinemaReel';

interface HeroSectionProps {
  onOpenInquiry: () => void;
}

export function HeroSection({ onOpenInquiry }: HeroSectionProps) {
  return (
    <section id="top" className="pt-12 pb-20 lg:pt-16 lg:pb-24">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="max-w-4xl">
          <div className="mb-9">
            <BrandLockup size="hero" />
          </div>

          <h1
            className="font-display font-semibold tracking-[-0.03em] text-[#0B2228] leading-[1.04] mb-6"
            style={{ fontSize: 'clamp(2.4rem, 4.9vw, 4.25rem)', textWrap: 'balance' }}
          >
            Investing in agentic AI for enterprise.
          </h1>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <p className="text-base sm:text-[17px] leading-[1.65] text-[#43585D] max-w-[46ch]">
              We back teams building autonomous workflows for SMEs—businesses deeply underserved by
              agentic AI infrastructure.
            </p>

            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="px-6 py-3.5 text-xs font-semibold tracking-wide text-white neu-btn-teal rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer"
              >
                Get in Touch
              </button>
              <a
                href="#focus"
                className="px-5 py-3.5 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl hover:text-[#0B5563] transition-colors whitespace-nowrap"
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
