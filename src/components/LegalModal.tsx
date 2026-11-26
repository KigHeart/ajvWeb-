import { X } from 'lucide-react';

export type LegalTab = 'privacy' | 'disclosures';

interface LegalModalProps {
  tab: LegalTab | null;
  onChangeTab: (tab: LegalTab) => void;
  onClose: () => void;
}

export function LegalModal({ tab, onChangeTab, onClose }: LegalModalProps) {
  if (!tab) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/55 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="neu-raised rounded-3xl w-full max-w-lg p-7 sm:p-9 relative max-h-[85vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notice"
          className="absolute top-6 right-6 w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-xs font-medium text-[#0B5563] mb-1.5">Ajentir Ventures</p>
        <h3
          id="legal-modal-title"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228] mb-5"
        >
          {tab === 'privacy' ? 'Privacy Notice' : 'General Disclosures'}
        </h3>

        <div
          role="tablist"
          aria-label="Legal documents"
          className="grid grid-cols-2 gap-1.5 p-1.5 neu-pressed rounded-2xl mb-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'disclosures'}
            onClick={() => onChangeTab('disclosures')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              tab === 'disclosures'
                ? 'neu-raised-sm text-[#0B2228]'
                : 'text-[#43585D] hover:text-[#0B2228]'
            }`}
          >
            Disclosures
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'privacy'}
            onClick={() => onChangeTab('privacy')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              tab === 'privacy'
                ? 'neu-raised-sm text-[#0B2228]'
                : 'text-[#43585D] hover:text-[#0B2228]'
            }`}
          >
            Privacy
          </button>
        </div>

        {tab === 'disclosures' ? (
          <div className="space-y-4 text-sm text-[#43585D] leading-relaxed">
            <p>
              This website is provided for general informational purposes only and describes the
              investment focus of Ajentir Ventures.
            </p>
            <p>
              Nothing on this website constitutes an offer to sell, or a solicitation of an offer to
              buy, any security or investment product in any jurisdiction, nor should it be relied
              upon as investment, legal, or tax advice.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-[#43585D] leading-relaxed">
            <p>
              Information submitted through the contact form is used solely to review founder,
              partner, or general inquiries addressed to Ajentir Ventures.
            </p>
            <p>
              This site does not deploy third-party advertising cookies or behavioral tracking
              profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
