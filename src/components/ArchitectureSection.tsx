const OFFERINGS = [
  {
    title: 'Venture Investment',
    summary:
      'Backing startups automating finance, operations, and supply workflows for underserved SMEs and enterprises.',
  },
  {
    title: 'Idea Incubation',
    summary:
      'Working alongside technical builders to turn promising agentic AI concepts into production-ready companies.',
  },
  {
    title: 'Executive Training',
    summary:
      'Focused briefings and practical workshops equipping SME leaders to adopt and govern agentic systems.',
  },
  {
    title: 'Strategic Partnerships',
    summary:
      'Collaborating with AI model providers, banks, and enterprise networks to expand real-world deployment.',
  },
];

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
              className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] font-semibold text-[#0B2228] leading-[1.2] tracking-[-0.025em] max-w-[32ch]"
              style={{ textWrap: 'balance' }}
            >
              Enterprise agentic AI built for the SMEs most providers overlook.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {OFFERINGS.map((item) => (
                <div key={item.title} className="neu-raised rounded-3xl p-7 sm:p-8">
                  <h3 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0B2228] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#43585D] leading-[1.65]">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
