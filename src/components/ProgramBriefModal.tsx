import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { OfferingItem } from '../data/memorandum';
import { DEFAULT_SITE_CONFIG, fetchSiteConfig, type SiteConfig } from '../lib/inquiries';

interface ProgramBriefModalProps {
  offering: OfferingItem | null;
  onClose: () => void;
  onProceedToInquiry: (offering: OfferingItem) => void;
}

export function ProgramBriefModal({
  offering,
  onClose,
  onProceedToInquiry,
}: ProgramBriefModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    if (offering) {
      const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);
      void fetchSiteConfig().then(setSiteConfig);
      return () => window.clearTimeout(timer);
    }
  }, [offering]);

  if (!offering) return null;

  const getLiveStatusBanner = () => {
    if (offering.id === 'incubation') {
      return `Incubation intake: ${siteConfig.incubationStatus}`;
    }
    if (offering.id === 'training') {
      return siteConfig.nextBriefingLabel;
    }
    if (offering.id === 'partnerships') {
      return siteConfig.partnerSandboxNote;
    }
    return null;
  };

  const liveNote = getLiveStatusBanner();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/55 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brief-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="neu-raised rounded-3xl w-full max-w-lg p-7 sm:p-9 relative max-h-[90vh] overflow-y-auto">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close program brief"
          className="absolute top-6 right-6 w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <div className="pr-10">
            <p className="text-xs font-medium text-[#0B5563] mb-1.5">{offering.brief.kicker}</p>
            <h3
              id="brief-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228] mb-2"
            >
              {offering.title}
            </h3>
            <p className="text-sm text-[#43585D] leading-relaxed">{offering.brief.format}</p>
            {liveNote && (
              <p className="mt-2.5 text-xs font-semibold text-[#0B5563]">{liveNote}</p>
            )}
          </div>

          <div className="space-y-3">
            {offering.brief.points.map((point) => (
              <div key={point.label} className="neu-pressed rounded-2xl p-4 sm:p-5">
                <span className="block text-xs font-semibold text-[#0B5563] mb-1">
                  {point.label}
                </span>
                <p className="text-sm text-[#0B2228] leading-relaxed">{point.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-xs font-semibold text-[#43585D] hover:text-[#0B2228] neu-raised-sm rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onProceedToInquiry(offering)}
              className="px-6 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inquire About {offering.title}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
