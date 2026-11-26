export function ArchitectureSection() {
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
              className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] font-semibold text-[#0B2228] leading-[1.2] tracking-[-0.025em] max-w-[30ch]"
              style={{ textWrap: 'balance' }}
            >
              Enterprise agentic AI built for the SMEs most providers overlook.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="neu-raised rounded-3xl p-8">
                <h3 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-2.5">
                  SME Automation
                </h3>
                <p className="text-sm sm:text-base text-[#43585D] leading-[1.65]">
                  Backing founders automating core finance, operations, and supply workflows for
                  small and mid-sized enterprises.
                </p>
              </div>

              <div className="neu-raised rounded-3xl p-8">
                <h3 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-2.5">
                  Agentic Infrastructure
                </h3>
                <p className="text-sm sm:text-base text-[#43585D] leading-[1.65]">
                  Supporting the runtime, security, and execution tools required for businesses to
                  deploy autonomous software reliably.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
