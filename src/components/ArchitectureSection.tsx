export function ArchitectureSection() {
  return (
    <section id="thesis" className="py-20 lg:py-28">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-3">
            <span className="inline-block neu-pressed rounded-xl px-4 py-2 text-xs font-medium text-[#0B5563]">
              Institutional Thesis
            </span>
          </div>

          <div className="lg:col-span-9 space-y-12">
            <h2
              className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-[#0B2228] leading-[1.18] tracking-[-0.025em] max-w-[30ch]"
              style={{ textWrap: 'balance' }}
            >
              Some defining autonomous-system businesses are founded independently today. Others
              must be originated where critical infrastructure does not yet exist.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="neu-raised rounded-3xl p-8">
                <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-3">
                  Venture Investment
                </h3>
                <p className="text-sm sm:text-base text-[#43585D] leading-[1.7]">
                  Direct equity in independent founders with proprietary execution technology,
                  enterprise distribution, and durable unit economics.
                </p>
              </div>

              <div className="neu-raised rounded-3xl p-8">
                <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-3">
                  Venture Creation
                </h3>
                <p className="text-sm sm:text-base text-[#43585D] leading-[1.7]">
                  Originating new companies around validated enterprise bottlenecks—financed
                  separately from LP capital and governed independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
