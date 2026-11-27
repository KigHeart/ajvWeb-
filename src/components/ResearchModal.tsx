import { useEffect, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { InquiryPreset } from '../data/memorandum';
import type { ResearchNote } from '../data/research';

interface ResearchModalProps {
  note: ResearchNote | null;
  onClose: () => void;
  onInquire: (preset: InquiryPreset) => void;
}

export function ResearchModal({ note, onClose, onInquire }: ResearchModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (note) {
      const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
  }, [note]);

  if (!note) return null;

  const paragraphs = note.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const preset: InquiryPreset = note.ctaPreset ?? {
    lane: 'partner',
    partnerType: 'discovery',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/55 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="research-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <article className="neu-raised rounded-3xl w-full max-w-2xl p-7 sm:p-10 relative max-h-[90vh] overflow-y-auto">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close research note"
          className="absolute top-6 right-6 w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <header className="pr-10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#43585D] mb-2">
              <span className="font-semibold text-[#0B5563]">{note.category}</span>
              <span aria-hidden="true">·</span>
              <span>{note.publishedLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{note.readTime}</span>
            </div>

            <h3
              id="research-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228] leading-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              {note.title}
            </h3>

            <p className="text-sm sm:text-base text-[#43585D] leading-relaxed">{note.summary}</p>
          </header>

          {note.sectors && (
            <div className="pt-4 border-t border-[#DDE4E6] text-xs text-[#43585D]">
              <span className="font-semibold text-[#0B2228]">Sectors examined: </span>
              <span>{note.sectors}</span>
            </div>
          )}

          {note.findings.length > 0 && (
            <div className="neu-pressed rounded-2xl p-5 space-y-2.5">
              <span className="block text-xs font-semibold text-[#0B5563]">Key Takeaways</span>
              <ul className="space-y-2 text-sm text-[#0B2228] leading-relaxed list-disc pl-4">
                {note.findings.map((finding, idx) => (
                  <li key={`${idx}-${finding.slice(0, 24)}`}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 text-sm sm:text-[15px] text-[#0B2228] leading-[1.75]">
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <footer className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-[#DDE4E6]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-xs font-semibold text-[#43585D] hover:text-[#0B2228] neu-raised-sm rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onInquire(preset);
              }}
              className="px-6 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Discuss This Research</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </footer>
        </div>
      </article>
    </div>
  );
}
