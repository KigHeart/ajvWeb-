import { ArrowUpRight } from 'lucide-react';
import type { ResearchNote } from '../data/research';

interface ResearchSectionProps {
  notes: ResearchNote[];
  onSelectNote: (note: ResearchNote) => void;
}

export function ResearchSection({ notes, onSelectNote }: ResearchSectionProps) {
  const displayNotes = notes.slice(0, 4);

  return (
    <section id="research" className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
          <div className="lg:col-span-3 pt-2">
            <span className="text-xs font-medium tracking-wide text-[#0B5563]">
              Research
            </span>
          </div>

          <div className="lg:col-span-9">
            <div className="divide-y divide-[#DDE4E6] border-t border-b border-[#DDE4E6]">
              {displayNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelectNote(note)}
                  className="w-full py-3.5 text-left flex items-center justify-between gap-6 group transition-colors hover:text-[#0B5563] focus-visible:outline-2 focus-visible:outline-[#0B5563] cursor-pointer"
                >
                  <span className="font-display text-sm sm:text-[15px] font-medium text-[#0B2228] group-hover:text-[#0B5563] transition-colors truncate">
                    {note.title}
                  </span>

                  <span className="inline-flex items-center gap-3 shrink-0 text-xs text-[#7E9094]">
                    <span className="hidden sm:inline">{note.category}</span>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 text-[#8D9DA1] group-hover:text-[#0B5563] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
