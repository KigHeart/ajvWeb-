import { useState, type FormEvent } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
}

export function InquiryModal({ open, onClose }: InquiryModalProps) {
  const [role, setRole] = useState<'founder' | 'partner' | 'general'>('founder');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim() || !emailPattern.test(email.trim())) {
      setError('Please enter your name and a valid email address.');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/55 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
    >
      <div className="neu-raised rounded-3xl w-full max-w-lg p-7 sm:p-9 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Close contact modal"
          className="absolute top-6 right-6 w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-6 space-y-4">
            <CheckCircle2 className="w-8 h-8 text-[#0B5563]" aria-hidden="true" />
            <h3
              id="inquiry-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228]"
            >
              Message Received
            </h3>
            <p className="text-sm text-[#43585D] leading-relaxed">
              Thank you, {fullName}. We have received your note and will be in touch.
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="mt-2 px-6 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-[#0B5563] mb-1.5">Ajentir Ventures</p>
            <h3
              id="inquiry-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228] mb-5"
            >
              Get in Touch
            </h3>

            <div
              role="tablist"
              aria-label="Contact category"
              className="grid grid-cols-3 gap-1.5 p-1.5 neu-pressed rounded-2xl mb-6"
            >
              {[
                { id: 'founder', label: 'Founder' },
                { id: 'partner', label: 'Partner' },
                { id: 'general', label: 'General' },
              ].map((tab) => {
                const active = role === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRole(tab.id as 'founder' | 'partner' | 'general')}
                    className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      active ? 'neu-raised-sm text-[#0B2228]' : 'text-[#43585D] hover:text-[#0B2228]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="modal-name" className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                  Name
                </label>
                <input
                  id="modal-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label htmlFor="modal-company" className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                  Company (optional)
                </label>
                <input
                  id="modal-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company or organisation"
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label htmlFor="modal-email" className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                  Email
                </label>
                <input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label htmlFor="modal-message" className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                  What are you building?
                </label>
                <textarea
                  id="modal-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A short note on your product or inquiry..."
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563] resize-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-[#9A3412]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-5 text-sm font-semibold text-white neu-btn-teal rounded-xl transition-all cursor-pointer"
              >
                Send Message
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
