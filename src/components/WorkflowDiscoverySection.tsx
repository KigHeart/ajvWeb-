import { ArrowRight, Blocks, Network, ScanSearch } from 'lucide-react';
import type { InquiryPreset } from '../data/memorandum';

interface WorkflowDiscoverySectionProps {
  onOpenInquiry: (preset: InquiryPreset) => void;
}

const DISCOVERY_STEPS = [
  {
    number: '01',
    icon: ScanSearch,
    title: 'Map real work',
    body: 'Work with an operating organisation to map tasks, hand-offs, decisions, systems, costs and the points where work stalls.',
  },
  {
    number: '02',
    icon: Network,
    title: 'Find the opportunity',
    body: 'Identify workflows that can be redesigned around agents—and recurring problems that point to demand beyond one organisation.',
  },
  {
    number: '03',
    icon: Blocks,
    title: 'Build a venture',
    body: 'Where the evidence supports it, pair technical builders with design partners, validate willingness to pay and assess the opportunity for incubation or investment.',
  },
];

export function WorkflowDiscoverySection({ onOpenInquiry }: WorkflowDiscoverySectionProps) {
  return (
    <section id="venture-discovery" className="py-20 lg:py-28 bg-[#E5EBEC]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-3 pt-1.5">
            <span className="text-xs font-medium tracking-wide text-[#0B5563]">
              From Workflows to Ventures
            </span>
          </div>

          <div className="lg:col-span-9 space-y-9">
            <div className="max-w-3xl">
              <h2
                className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] font-semibold text-[#0B2228] leading-[1.16] tracking-[-0.025em] mb-4"
                style={{ textWrap: 'balance' }}
              >
                Find the problem inside the business. Build the company that solves it.
              </h2>
              <p className="text-base sm:text-lg text-[#43585D] leading-[1.7] max-w-[62ch]">
                Ajentir works with SMEs and organisations to understand how work really gets done.
                Workflow discovery can reveal more than automation opportunities: it can expose
                repeatable needs, underused capabilities and new markets for agentic software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DISCOVERY_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.number} className="neu-raised rounded-3xl p-6 sm:p-7">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xs font-semibold tracking-[0.16em] text-[#B5862A]">
                        {step.number}
                      </span>
                      <Icon className="w-5 h-5 text-[#0B5563]" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#0B2228] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#43585D] leading-[1.7]">{step.body}</p>
                  </article>
                );
              })}
            </div>

            <div className="neu-pressed rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-wide text-[#0B5563] mb-2">
                  A venture-sourcing engine
                </p>
                <p className="text-sm sm:text-base text-[#0B2228] leading-[1.7]">
                  We do not assume every process problem deserves a startup. We look for validated,
                  repeatable demand and a credible agentic software opportunity—then connect the
                  problem to builders, design partners and Ajentir's incubation and investment model.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenInquiry({ lane: 'training', trainingFocus: 'workflow' })}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Bring us a workflow
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInquiry({ lane: 'founder', founderTrack: 'incubation' })}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl transition-colors hover:text-[#0B5563] cursor-pointer whitespace-nowrap"
                >
                  Build with us
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
