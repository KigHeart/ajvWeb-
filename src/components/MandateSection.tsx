import { INVESTMENT_VERTICALS, TECHNICAL_PILLARS } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

export function MandateSection() {
  const featured = INVESTMENT_VERTICALS.slice(0, 3);
  const secondary = INVESTMENT_VERTICALS.slice(3);

  return (
    <section id="focus" className="py-20 lg:py-28 border-b border-[#E2DFD7] bg-white">
      <div className="max-w-[1160px] mx-auto px-6 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wider text-[#0B5563] mb-2">
              02. Strategic Investment Focus
            </p>
            <h2
              className="font-serif text-3xl sm:text-4xl font-semibold text-[#0E2024] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Five verticals across the autonomous economy.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm text-[#4B5D61] leading-relaxed">
              Target Fund I portfolio exposure across core infrastructure, verifiable security, and
              autonomous enterprise production.
            </p>
          </div>
        </div>

        {/* Featured 3 verticals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featured.map((vertical) => (
            <article
              key={vertical.roman}
              className="border border-[#E2DFD7] bg-[#FAF9F6] flex flex-col justify-between"
            >
              <div>
                {vertical.image && (
                  <div className="aspect-[4/3] overflow-hidden border-b border-[#E2DFD7] bg-[#EAE7DF]">
                    <ResilientImage
                      src={vertical.image}
                      alt={vertical.imageAlt || vertical.title}
                      className="w-full h-full object-cover"
                      fallbackTitle={vertical.title}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between text-xs font-mono text-[#4B5D61] mb-3">
                    <span>{vertical.roman}</span>
                    <span className="text-[#0B5563] tabular-nums">
                      {vertical.sharePercent}% · {vertical.allocation}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#0E2024] mb-2.5">
                    {vertical.title}
                  </h3>
                  <p className="text-sm text-[#35484C] leading-relaxed">{vertical.description}</p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="h-0.5 w-full bg-[#E2DFD7]">
                  <div
                    className="h-full bg-[#0B5563]"
                    style={{ width: `${vertical.sharePercent}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Secondary 2 verticals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {secondary.map((vertical) => (
            <article
              key={vertical.roman}
              className="border border-[#E2DFD7] bg-[#FAF9F6] p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#4B5D61] mb-2.5">
                  <span>{vertical.roman}</span>
                  <span className="text-[#0B5563] tabular-nums">
                    {vertical.sharePercent}% · {vertical.allocation}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#0E2024] mb-2">
                  {vertical.title}
                </h3>
                <p className="text-sm text-[#35484C] leading-relaxed mb-5">{vertical.description}</p>
              </div>
              <div className="h-0.5 w-full bg-[#E2DFD7]">
                <div
                  className="h-full bg-[#B5862A]"
                  style={{ width: `${vertical.sharePercent}%` }}
                />
              </div>
            </article>
          ))}
        </div>

        {/* Quiet Underwriting Standard Strip */}
        <div className="pt-10 border-t border-[#E2DFD7] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <h3 className="font-serif text-2xl font-semibold text-[#0E2024] mb-2">
              The Ajentir Technical Standard
            </h3>
            <p className="text-sm text-[#4B5D61] leading-relaxed">
              Every investment is evaluated on representative production workloads and unit
              economics rather than synthetic benchmarks.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm text-[#0E2024]">
            {TECHNICAL_PILLARS.map((pillar, i) => (
              <div key={pillar} className="py-2 border-b border-[#E2DFD7] flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-[#B5862A] tabular-nums">0{i + 1}</span>
                <span className="font-medium">{pillar}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
