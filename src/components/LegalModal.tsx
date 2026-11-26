import { X } from 'lucide-react';

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
}

export function LegalModal({ open, onClose }: LegalModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/55 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="neu-raised rounded-3xl w-full max-w-lg p-7 sm:p-9 relative max-h-[85vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close privacy notice"
          className="absolute top-6 right-6 w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-xs font-medium text-[#0B5563] mb-1.5">Ajentir Ventures</p>
        <h3
          id="legal-modal-title"
          className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228] mb-5"
        >
          Privacy Notice
        </h3>

        <div className="space-y-4 text-sm text-[#43585D] leading-relaxed">
          <p>
            Information submitted through the contact form is used solely to review founder,
            executive training, or partnership inquiries addressed to Ajentir Ventures.
          </p>
          <p>
            This site does not deploy third-party advertising cookies or behavioral tracking
            profiles.
          </p>
        </div>
      </div>
    </div>
  );
}
