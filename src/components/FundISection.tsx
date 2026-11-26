interface FundISectionProps {
  onOpenInquiry: () => void;
}

export function FundISection({ onOpenInquiry }: FundISectionProps) {
  return (
    <section
      id="fund-i"
      className="relative py-24 lg:py-32 bg-[#06262D] text-[#F5F7F7] overflow-hidden"
    >
      {/* Ambient lighting behind dark glassmorphic panels */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-24 w-[480px] h-[480px] rounded-full bg-[#137B8E]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#C89B3C]/15 blur-3xl"
      />

      <div className="relative max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Monumental figure inside frosted dark glass */}
          <div className="lg:col-span-5 glass-dark rounded-3xl p-8 sm:p-10">
            <span className="text-xs font-medium text-[#E2C275] block mb-4">
              Fund I · Target Commitments
            </span>
            <div
              className="font-serif font-medium text-white tracking-tight leading-none mb-5 tabular-nums"
              style={{ fontSize: 'clamp(4rem, 7vw, 6.25rem)' }}
            >
              $10M
            </div>
            <p className="text-sm sm:text-base text-[#C6D5D8] leading-relaxed">
              Concentrated early-stage capital, disciplined reserves, and independent governance.
            </p>
          </div>

          {/* Right: Frosted dark-glass rows */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-dark rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline">
              <div className="sm:col-span-4 text-xs font-medium text-[#E2C275]">Portfolio</div>
              <div className="sm:col-span-8 text-sm sm:text-base text-white leading-relaxed">
                12–15 companies across external founders ($4.125m) and studio ventures ($1.375m
                cap).
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline">
              <div className="sm:col-span-4 text-xs font-medium text-[#E2C275]">Capital</div>
              <div className="sm:col-span-8 text-sm sm:text-base text-white leading-relaxed">
                $5.5m initial deployment, $3.5m performance-gated reserves, and $1.0m operations.
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline">
              <div className="sm:col-span-4 text-xs font-medium text-[#E2C275]">Governance</div>
              <div className="sm:col-span-8 text-sm sm:text-base text-white leading-relaxed">
                Separate studio financing, independent Investment Committee, and Nairobi-to-global
                mandate.
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="px-6 py-3.5 text-xs font-semibold text-[#06262D] bg-[#E2C275] hover:bg-[#ECD08D] rounded-xl shadow-[0_8px_24px_rgba(226,194,117,0.22)] transition-all duration-150 cursor-pointer"
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
