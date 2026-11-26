export function ArchitectureSection() {
  return (
    <section id="approach" className="py-20 lg:py-28 border-b border-[#E2DFD7] bg-[#FAF9F6]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-medium tracking-wider text-[#0B5563] mb-2">
            01. Institutional Approach
          </p>
          <h2
            className="font-serif text-3xl sm:text-4xl font-semibold text-[#0E2024] tracking-tight mb-4"
            style={{ textWrap: 'balance' }}
          >
            Two complementary engines under disciplined separation.
          </h2>
          <p className="text-base text-[#4B5D61] leading-relaxed">
            Some defining businesses of the autonomous economy will be built by existing founders;
            others require deliberate technical and commercial assembly before capital exists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-white border border-[#E2DFD7] p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#4B5D61] mb-5 pb-4 border-b border-[#E2DFD7]">
                <span>Engine A</span>
                <span className="text-[#0B5563] tabular-nums">$4.125m Target Pool</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0E2024] mb-4">
                External Venture Investment
              </h3>
              <p className="text-sm sm:text-base text-[#35484C] leading-relaxed">
                Direct equity investments in independent founding teams across Africa and global
                research hubs demonstrating technical execution, commercial traction, and structural
                defensibility beyond foundation-model commoditisation.
              </p>
            </div>
            <p className="mt-8 pt-4 border-t border-[#E2DFD7] text-xs text-[#4B5D61]">
              Independently sourced founders · Diligence-led underwriting
            </p>
          </div>

          <div className="bg-white border border-[#E2DFD7] p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#4B5D61] mb-5 pb-4 border-b border-[#E2DFD7]">
                <span>Engine B</span>
                <span className="text-[#B5862A] tabular-nums">$1.375m Fund Cap</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0E2024] mb-4">
                Venture Creation Studio
              </h3>
              <p className="text-sm sm:text-base text-[#35484C] leading-relaxed">
                Systematic origination of new ventures around validated enterprise bottlenecks—such
                as agent transaction security, runtime orchestration, and cryptographic
                authority—financed separately from Fund I operating commitments.
              </p>
            </div>
            <p className="mt-8 pt-4 border-t border-[#E2DFD7] text-xs text-[#4B5D61]">
              Separate studio budget · Independent Investment Committee approval required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
