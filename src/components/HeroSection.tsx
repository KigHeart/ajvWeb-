import { ArrowRight } from 'lucide-react';
import { INSTITUTION_META } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onOpenInquiry: () => void;
}

export function HeroSection({ onOpenInquiry }: HeroSectionProps) {
  return (
    <section id="top" className="pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-[#E2DFD7]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <div className="mb-10">
                <ResilientImage
                  src={INSTITUTION_META.logoSrc}
                  alt="Ajentir Ventures — Investing in the Autonomous Economy"
                  className="h-14 sm:h-16 w-auto object-contain"
                  fallbackTitle="Ajentir Ventures"
                />
              </div>

              <p className="text-xs font-medium tracking-wider text-[#4B5D61] mb-4">
                Fund I · $10M Target · Nairobi & Global
              </p>

              <h1
                className="font-serif font-semibold tracking-tight text-[#0E2024] leading-[1.06] mb-6"
                style={{ fontSize: 'clamp(2.5rem, 4.2vw, 3.85rem)', textWrap: 'balance' }}
              >
                Investing in the Autonomous Economy.
              </h1>

              <p className="text-base sm:text-[17px] leading-[1.75] text-[#35484C] max-w-[54ch] mb-10">
                Ajentir Ventures is a hybrid venture capital and venture creation institution. We
                back independent founders and originate specialist companies turning autonomous
                intelligence into reliable economic production.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-[#0B5563] hover:bg-[#073D47] rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Request LP Brief</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#focus"
                className="text-sm font-medium text-[#0E2024] border-b border-[#B5862A] pb-0.5 hover:text-[#0B5563] transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Investment Focus
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <div className="relative flex-1 min-h-[300px] lg:min-h-[440px] overflow-hidden border border-[#E2DFD7] bg-[#F2F0EB]">
              <ResilientImage
                src="/src/assets/images/hero_nairobi_institution_1795689827287.jpg"
                alt="Architectural atrium representing Ajentir Ventures institutional headquarters in Nairobi"
                className="w-full h-full lg:absolute lg:inset-0 object-cover"
                fallbackTitle="Nairobi Institutional Base"
              />
            </div>
          </div>
        </div>

        {/* Quiet 4-column summary strip */}
        <div className="mt-14 pt-8 border-t border-[#E2DFD7] grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="text-xs text-[#4B5D61] mb-1">Model</div>
            <div className="font-serif text-lg sm:text-xl font-semibold text-[#0E2024]">
              Hybrid VC & Studio
            </div>
          </div>
          <div>
            <div className="text-xs text-[#4B5D61] mb-1">Fund I Target</div>
            <div className="font-mono text-lg sm:text-xl font-medium text-[#0B5563] tabular-nums">
              $10,000,000
            </div>
          </div>
          <div>
            <div className="text-xs text-[#4B5D61] mb-1">Portfolio Construction</div>
            <div className="font-mono text-lg sm:text-xl font-medium text-[#0E2024] tabular-nums">
              12–15 Companies
            </div>
          </div>
          <div>
            <div className="text-xs text-[#4B5D61] mb-1">Institutional Base</div>
            <div className="font-serif text-lg sm:text-xl font-semibold text-[#0E2024]">
              Nairobi · Global Reach
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
