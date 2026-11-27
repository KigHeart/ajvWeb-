import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  RESEARCH_CATEGORIES,
  type ResearchCategory,
  type ResearchNote,
} from '../data/research';

interface ResearchSectionProps {
  notes: ResearchNote[];
  onSelectNote: (note: ResearchNote) => void;
}

export function ResearchSection({ notes, onSelectNote }: ResearchSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | ResearchCategory>('All');

  const visibleNotes = useMemo(() => {
    if (activeCategory === 'All') return notes;
    return notes.filter((note) => note.category === activeCategory);
  }, [notes, activeCategory]);

  return (
    <section id="research" className="py-14 lg:py-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="lg:col-span-3 pt-1">
            <span className="text-xs font-medium tracking-wide text-[#0B5563]">
              Research
            </span>
          </div>

          <div className="lg:col-span-9 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <p className="text-sm text-[#43585D] leading-relaxed max-w-[46ch]">
                Short notes from our field work on operational workflows and agentic systems.
              </p>

              <div
                role="tablist"
                aria-label="Filter research notes by topic"
                className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs shrink-0"
              >
                {(['All', ...RESEARCH_CATEGORIES] as const).map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveCategory(cat)}
                      className={`py-1 border-b transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'text-[#0B2228] font-medium border-[#B5862A]'
                          : 'text-[#6A7C80] border-transparent hover:text-[#0B2228]'
                      }`}
                    >
                      {cat === 'All' ? 'All' : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-b border-[#D8E1E3] divide-y divide-[#D8E1E3]">
              {visibleNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelectNote(note)}
                  className="w-full py-4 sm:py-4.5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 group transition-colors hover:bg-white/30 px-2 -mx-2 rounded-lg focus-visible:outline-2 focus-visible:outline-[#0B5563] cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-display text-sm sm:text-[15px] font-medium tracking-[-0.01em] text-[#0B2228] group-hover:text-[#0B5563] transition-colors truncate">
                      {note.title}
                    </h3>
                    <p className="text-xs text-[#5E7175] truncate max-w-[68ch]">
                      {note.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-[#6A7C80]">
                    <span className="whitespace-nowrap">
                      {note.category} · {note.readTime}
                    </span>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 text-[#8D9DA1] group-hover:text-[#0B5563] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
