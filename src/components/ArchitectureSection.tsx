import { ArrowUpRight } from 'lucide-react';
import { OFFERINGS, type OfferingItem } from '../data/memorandum';

interface ArchitectureSectionProps {
  onSelectOffering: (offering: OfferingItem) => void;
}

export function ArchitectureSection({ onSelectOffering }: ArchitectureSectionProps) {
  return (
    <section id="what-we-do" className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-3 pt-1.5">
            <span className="text-xs font-medium tracking-wide text-[#0B5563]">
              What We Do
            </span>
          </div>

          <div className="lg:col-span-9 space-y-10">
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] font-semibold text-[#0B2228] leading-[1.2] tracking-[-0.025em] max-w-[32ch]"
              style={{ textWrap: 'balance' }}
            >
              Backing and building agentic AI companies for the SMEs most providers overlook.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {OFFERINGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectOffering(item)}
                  className="neu-raised rounded-3xl p-7 sm:p-8 text-left flex flex-col justify-between gap-6 group transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#0B5563] cursor-pointer"
                >
                  <div>
                    <h3 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0B2228] group-hover:text-[#0B5563] transition-colors mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#43585D] leading-[1.65]">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DDE4E6] text-xs font-semibold text-[#0B5563]">
                    <span>{item.ctaLabel}</span>
                    <ArrowUpRight
                      className="w-4 h-4 text-[#B5862A] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
