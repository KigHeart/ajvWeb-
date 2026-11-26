import { BRAND_META } from '../data/memorandum';
import { BrandLockup } from './BrandLockup';
import type { LegalTab } from './LegalModal';

interface ContactFooterProps {
  onOpenInquiry: () => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export function ContactFooter({ onOpenInquiry, onOpenLegal }: ContactFooterProps) {
  return (
    <>
      <section className="py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="neu-raised rounded-[28px] p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2
                className="font-display text-2xl sm:text-4xl font-semibold text-[#0B2228] tracking-[-0.03em] leading-[1.08] mb-3"
                style={{ textWrap: 'balance' }}
              >
                Building, training, or partnering in agentic AI?
              </h2>
              <p className="text-sm sm:text-base text-[#43585D]">
                Reach out regarding investment, incubation, SME executive training, or partnerships.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenInquiry}
              className="self-start lg:self-auto px-7 py-3.5 text-xs font-semibold tracking-wide text-white neu-btn-teal rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>

      <footer className="pb-12 pt-4 text-[#43585D]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-[#D6DFE1]">
            <div className="self-start">
              <BrandLockup size="footer" />
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-8 text-xs font-medium">
              <a href="#what-we-do" className="hover:text-[#0B2228] transition-colors">
                What We Do
              </a>
              <a href="#focus" className="hover:text-[#0B2228] transition-colors">
                Focus
              </a>
              <a href="#approach" className="hover:text-[#0B2228] transition-colors">
                Approach
              </a>
              <button
                type="button"
                onClick={() => onOpenLegal('disclosures')}
                className="hover:text-[#0B2228] transition-colors cursor-pointer"
              >
                Disclosures
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-[#0B2228] transition-colors cursor-pointer"
              >
                Privacy
              </button>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px]">
            <span>© {BRAND_META.year} Ajentir Ventures</span>
            <span>Investing in the Autonomous Economy</span>
          </div>
        </div>
      </footer>
    </>
  );
}
