import { useState, type FormEvent } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
}

export function InquiryModal({ open, onClose }: InquiryModalProps) {
  const [inquiryType, setInquiryType] = useState<'lp' | 'founder' | 'partner'>('lp');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim() || !organization.trim() || !emailPattern.test(email.trim())) {
      setError('Please provide your name, organisation, and a valid institutional email address.');
      return;
    }

    setError('');
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#072D35]/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
    >
      <div className="bg-[#FAF9F6] border border-[#E2DFD7] w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Close inquiry modal"
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-[#4B5D61] hover:text-[#0E2024] hover:bg-[#EAE7DF] rounded transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-6 space-y-4">
            <CheckCircle2 className="w-8 h-8 text-[#0B5563]" aria-hidden="true" />
            <h3 id="inquiry-modal-title" className="font-serif text-3xl font-semibold text-[#0E2024]">
              Institutional Inquiry Recorded
            </h3>
            <p className="text-sm text-[#35484C] leading-relaxed">
              Thank you, {fullName}. Your request from {organization} regarding{' '}
              {inquiryType === 'lp'
                ? 'Fund I LP documentation'
                : inquiryType === 'founder'
                  ? 'Engine A venture evaluation'
                  : 'Venture Studio partnership'}{' '}
              has been logged for review by Ajentir Ventures.
            </p>
            <p className="text-xs text-[#4B5D61] leading-relaxed border-t border-[#E2DFD7] pt-4">
              Notice: No fund commitments are solicited or accepted prior to finalisation of
              governing fund documentation and applicable Capital Markets Authority or
              jurisdictional authorisations.
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="mt-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B5563] hover:bg-[#073D47] rounded transition-colors cursor-pointer"
            >
              Return to Memorandum
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium tracking-wider text-[#0B5563] mb-1.5">
              Ajentir Ventures · Nairobi & Global
            </p>
            <h3 id="inquiry-modal-title" className="font-serif text-3xl font-semibold text-[#0E2024] mb-2">
              Request LP Brief or Submit Thesis
            </h3>
            <p className="text-xs text-[#4B5D61] leading-relaxed mb-6">
              Connect with our institutional team regarding Fund I prospective LP materials,
              external venture investment, or studio co-origination.
            </p>

            <div
              role="tablist"
              aria-label="Inquiry category"
              className="grid grid-cols-3 gap-1 p-1 bg-[#EAE7DF] rounded mb-6"
            >
              {[
                { id: 'lp', label: 'Prospective LP' },
                { id: 'founder', label: 'Founder Pitch' },
                { id: 'partner', label: 'Studio Partner' },
              ].map((tab) => {
                const active = inquiryType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setInquiryType(tab.id as 'lp' | 'founder' | 'partner')}
                    className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
                      active ? 'bg-white text-[#0E2024] shadow-xs' : 'text-[#4B5D61] hover:text-[#0E2024]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="modal-name" className="block text-xs font-semibold text-[#0E2024] mb-1.5">
                  Full Name
                </label>
                <input
                  id="modal-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Wanjiku Kamau"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D4D0C5] focus:border-[#0B5563] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-org" className="block text-xs font-semibold text-[#0E2024] mb-1.5">
                  Institution / Company
                </label>
                <input
                  id="modal-org"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Rift Valley Family Office"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D4D0C5] focus:border-[#0B5563] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-email" className="block text-xs font-semibold text-[#0E2024] mb-1.5">
                  Institutional Email
                </label>
                <input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.org"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D4D0C5] focus:border-[#0B5563] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-message" className="block text-xs font-semibold text-[#0E2024] mb-1.5">
                  Mandate or Technical Summary
                </label>
                <textarea
                  id="modal-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share inquiry focus, allocation interest, or agentic architecture overview..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D4D0C5] focus:border-[#0B5563] focus:outline-none resize-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#9A3412]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-5 text-sm font-semibold text-white bg-[#0B5563] hover:bg-[#073D47] rounded transition-colors cursor-pointer"
              >
                Submit Institutional Request
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
