import { INSTITUTION_META } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

interface ContactFooterProps {
  onOpenInquiry: () => void;
}

export function ContactFooter({ onOpenInquiry }: ContactFooterProps) {
  return (
    <>
      <section className="py-20 bg-white border-b border-[#E2DFD7]">
        <div className="max-w-[1160px] mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2
              className="font-serif text-3xl sm:text-4xl font-semibold text-[#0E2024] tracking-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              An enduring institution at the frontier of autonomous systems.
            </h2>
            <p className="text-base text-[#4B5D61] leading-relaxed">
              Full Fund I documentation, financial modelling, and governance charters are made
              available to prospective institutional partners and founders upon request.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenInquiry}
            className="self-start lg:self-auto px-7 py-3.5 text-sm font-semibold text-white bg-[#0B5563] hover:bg-[#073D47] rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Request LP Brief
          </button>
        </div>
      </section>

      <footer className="bg-[#FAF9F6] py-12 text-[#4B5D61]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-[#E2DFD7]">
            <div className="space-y-3">
              <ResilientImage
                src={INSTITUTION_META.logoSrc}
                alt="Ajentir Ventures"
                className="h-10 w-auto object-contain"
                fallbackTitle="Ajentir Ventures"
              />
              <p className="text-xs text-[#4B5D61]">
                Founder: {INSTITUTION_META.founder} · {INSTITUTION_META.headquarters} ·{' '}
                {INSTITUTION_META.date}
              </p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-6 text-xs font-medium">
              <a href="#approach" className="hover:text-[#0E2024] transition-colors">
                Approach
              </a>
              <a href="#focus" className="hover:text-[#0E2024] transition-colors">
                Focus
              </a>
              <a href="#fund-i" className="hover:text-[#0E2024] transition-colors">
                Fund I
              </a>
              <a href="#governance" className="hover:text-[#0E2024] transition-colors">
                Governance
              </a>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] leading-relaxed">
            <span>© 2026 Ajentir Ventures. All rights reserved.</span>
            <span>
              Informational overview only; no commitments solicited prior to governing fund
              authorisations.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
