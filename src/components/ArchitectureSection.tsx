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
              className="font-display text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-[#0B2228] leading-[1.18] tracking-[-0.025em] max-w-[32ch]"
              style={{ textWrap: 'balance' }}
            >
              African venture capital has funded consumer apps—leaving the autonomous execution
              layer unbuilt.
            </h2>

            {/* Clear 3-part narrative: State Today -> What Is Missing -> Where We Come In */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="neu-raised rounded-3xl p-7">
                <div className="font-mono text-[11px] text-[#43585D] mb-2">01 · Today</div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-2.5">
                  Application Focus
                </h3>
                <p className="text-sm text-[#43585D] leading-[1.65]">
                  Capital in Africa clusters around payments, logistics marketplaces, and thin AI
                  wrappers—while agentic systems are funded almost exclusively abroad.
                </p>
              </div>

              <div className="neu-raised rounded-3xl p-7">
                <div className="font-mono text-[11px] text-[#B5862A] mb-2">02 · The Gap</div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-2.5">
                  Missing Infrastructure
                </h3>
                <p className="text-sm text-[#43585D] leading-[1.65]">
                  Virtually no institutional capital backs Africa-originated agent runtimes,
                  verifiable financial authority, or autonomous industrial production.
                </p>
              </div>

              <div className="neu-raised rounded-3xl p-7">
                <div className="font-mono text-[11px] text-[#0B5563] mb-2">03 · Ajentir</div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-2.5">
                  VC & Venture Creation
                </h3>
                <p className="text-sm text-[#43585D] leading-[1.65]">
                  We invest in independent founders and run a separately financed Venture Studio to
                  originate missing companies where teams have not yet converged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
