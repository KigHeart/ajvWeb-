import { INSTITUTION_META } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

interface ContactFooterProps {
  onOpenInquiry: () => void;
}

export function ContactFooter({ onOpenInquiry }: ContactFooterProps) {
  return (
    <>
      <section className="py-20 lg:py-24">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div className="neu-raised rounded-[28px] p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2
                className="font-serif text-3xl sm:text-5xl font-medium text-[#0B2228] tracking-tight leading-[1.1] mb-3"
                style={{ textWrap: 'balance' }}
              >
                An enduring institution at the frontier of autonomous systems.
              </h2>
              <p className="text-sm sm:text-base text-[#43585D]">
                Institutional documentation shared privately upon qualified inquiry.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenInquiry}
              className="self-start lg:self-auto px-7 py-3.5 text-xs font-semibold tracking-wide text-white neu-btn-teal rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Request LP Brief
            </button>
          </div>
        </div>
      </section>

      <footer className="pb-12 pt-4 text-[#43585D]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-[#D6DFE1]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="neu-raised-sm rounded-xl px-4 py-2 inline-block self-start">
                <ResilientImage
                  src={INSTITUTION_META.logoSrc}
                  alt="Ajentir Ventures"
                  className="h-8 w-auto object-contain"
                  fallbackTitle="Ajentir Ventures"
                />
              </div>
              <span className="text-xs text-[#43585D]">
                {INSTITUTION_META.headquarters} · {INSTITUTION_META.founder}
              </span>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-8 text-xs font-medium">
              <a href="#thesis" className="hover:text-[#0B2228] transition-colors">
                Thesis
              </a>
              <a href="#focus" className="hover:text-[#0B2228] transition-colors">
                Focus
              </a>
              <a href="#fund-i" className="hover:text-[#0B2228] transition-colors">
                Fund I
              </a>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px]">
            <span>© {INSTITUTION_META.year} Ajentir Ventures</span>
            <span>
              Informational overview only; no commitments solicited prior to regulatory
              authorisations.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
