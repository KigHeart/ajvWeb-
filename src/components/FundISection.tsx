import { FUND_ALLOCATION } from '../data/memorandum';

interface FundISectionProps {
  onOpenInquiry: () => void;
}

export function FundISection({ onOpenInquiry }: FundISectionProps) {
  return (
    <section
      id="fund-i"
      className="py-20 lg:py-28 bg-[#072D35] text-[#F5F4F0] border-b border-[#0E4652]"
    >
      <div className="max-w-[1160px] mx-auto px-6 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Capital Architecture */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <p className="text-xs font-medium tracking-wider text-[#D4AF5A] mb-2">
                03. Fund I · Capital Architecture
              </p>
              <h2
                className="font-serif text-3xl sm:text-5xl font-semibold text-white tracking-tight mb-4"
                style={{ textWrap: 'balance' }}
              >
                $10,000,000 target commitments.
              </h2>
              <p className="text-sm sm:text-base text-[#D6E0E2] leading-relaxed">
                Structured for concentrated conviction across 12–15 companies, with disciplined
                reserves held strictly for demonstrated commercial performance.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              {FUND_ALLOCATION.map((row) => (
                <div key={row.label} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-sm font-semibold text-white">{row.label}</span>
                      <span className="block text-xs text-[#B7C9CD]">{row.detail}</span>
                    </div>
                    <span className="font-mono text-base font-medium text-[#D4AF5A] tabular-nums shrink-0">
                      {row.amount}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/15">
                    <div className="h-full bg-[#D4AF5A]" style={{ width: `${row.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quiet Institutional Governance */}
          <div
            id="governance"
            className="lg:col-span-6 bg-[#0B3943] border border-white/15 p-8 lg:p-10 space-y-6"
          >
            <div>
              <p className="text-xs font-medium tracking-wider text-[#D4AF5A] mb-2">
                04. Governance & Fiduciary Discipline
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white mb-3">
                Independent oversight and LP alignment.
              </h3>
              <p className="text-sm text-[#D6E0E2] leading-relaxed">
                The venture studio operates on separate capital from Fund I. Every studio-originated
                company faces a strict 25% allocation cap, formal conflict recusal, independent
                valuation scrutiny, and Investment Committee approval.
              </p>
            </div>

            <div className="pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#C6D5D8] leading-relaxed">
              <div>
                <div className="font-semibold text-white mb-1">Nairobi Headquarters</div>
                Origination anchored in Kenya and East Africa with global investment and syndication
                reach.
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Regulatory Readiness</div>
                Structured in compliance with Capital Markets Authority and applicable fund
                frameworks prior to commitments.
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="px-6 py-3 text-xs font-semibold text-[#072D35] bg-[#D4AF5A] hover:bg-[#E2C275] rounded transition-colors cursor-pointer"
              >
                Request LP Memorandum
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
