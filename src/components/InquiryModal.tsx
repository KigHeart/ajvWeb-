import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type {
  FounderTrack,
  InquiryLane,
  InquiryPreset,
  PartnerType,
  TrainingFocus,
} from '../data/memorandum';
import { EMAIL_PATTERN, PAYLOAD_LIMITS } from '../lib/firebase';
import { submitInquiry, type InquirySubTrack, type TeamSizeOption } from '../lib/inquiries';
import { submitSelfHostedInquiry } from '../lib/selfHostedInquiryApi';

interface InquiryModalProps {
  open: boolean;
  preset?: InquiryPreset | null;
  onClose: () => void;
}

const LANE_COPY: Record<InquiryLane, { prompt: string; placeholder: string }> = {
  founder: {
    prompt: 'What workflow are you automating?',
    placeholder: 'Briefly describe the SME or enterprise problem, product stage, and team...',
  },
  training: {
    prompt: 'Leadership priorities',
    placeholder: 'Share industry focus and key AI governance or SME workflow goals...',
  },
  partner: {
    prompt: 'Collaboration scope',
    placeholder:
      'Describe how we can work together—compute credits, sandbox pilots, or SME distribution...',
  },
};

const FOUNDER_TRACKS: { id: FounderTrack; label: string }[] = [
  { id: 'investment', label: 'Venture Investment' },
  { id: 'incubation', label: 'Idea Incubation' },
];

const TRAINING_FOCUSES: { id: TrainingFocus; label: string }[] = [
  { id: 'governance', label: 'Governance & Risk' },
  { id: 'workflow', label: 'SME Workflows' },
  { id: 'workshop', label: 'Executive Workshop' },
];

const TEAM_SIZE_OPTIONS: { id: Exclude<TeamSizeOption, ''>; label: string }[] = [
  { id: '1-10 leaders', label: '1–10 leaders' },
  { id: '11-30 leaders', label: '11–30 leaders' },
  { id: '30+ leaders', label: '30+ leaders' },
];

const PARTNER_TYPES: { id: PartnerType; label: string }[] = [
  { id: 'model-provider', label: 'AI Model Provider' },
  { id: 'bank', label: 'Bank / FI' },
  { id: 'enterprise', label: 'Enterprise Network' },
];

export function InquiryModal({ open, preset, onClose }: InquiryModalProps) {
  const [lane, setLane] = useState<InquiryLane>('founder');
  const [founderTrack, setFounderTrack] = useState<FounderTrack>('investment');
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>('governance');
  const [teamSize, setTeamSize] = useState<TeamSizeOption>('1-10 leaders');
  const [partnerType, setPartnerType] = useState<PartnerType>('bank');

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const openedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      setSubmitted(false);
      setError('');
      setSubmitting(false);
      setHoneypot('');
      if (preset) {
        setLane(preset.lane);
        if (preset.founderTrack) setFounderTrack(preset.founderTrack);
        if (preset.trainingFocus) setTrainingFocus(preset.trainingFocus);
        if (preset.partnerType) setPartnerType(preset.partnerType);
      }
      const timer = window.setTimeout(() => nameInputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
  }, [open, preset]);

  if (!open) return null;

  const getActiveSubTrack = (): InquirySubTrack => {
    if (lane === 'founder') return founderTrack;
    if (lane === 'training') return trainingFocus;
    return partnerType;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter your name and a valid email address.');
      return;
    }

    // Silent bot mitigation (honeypot or instant programmatic submission)
    if (Date.now() - openedAtRef.current < 800) {
      setSubmittedName(trimmedName);
      setReferenceId('');
      setSubmitted(true);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const inquiryInput = {
        lane,
        subTrack: getActiveSubTrack(),
        fullName: trimmedName,
        company,
        email: trimmedEmail,
        website,
        teamSize: lane === 'training' ? teamSize : '',
        message,
      };
      const result = import.meta.env.VITE_USE_SELF_HOSTED_API === 'true'
        ? await submitSelfHostedInquiry(inquiryInput, honeypot)
        : await submitInquiry(inquiryInput);

      setSubmittedName(trimmedName);
      setReferenceId(result.id.slice(0, 8).toUpperCase());
      setFullName('');
      setCompany('');
      setWebsite('');
      setEmail('');
      setMessage('');
      setSubmitted(true);
    } catch {
      setError('We could not save your inquiry right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setError('');
    setSubmitting(false);
    onClose();
  };

  const activeCopy = LANE_COPY[lane];

  const getTrackSummaryLabel = () => {
    if (lane === 'founder') {
      const found = FOUNDER_TRACKS.find((t) => t.id === founderTrack);
      return `Founders · ${found?.label ?? 'Investment'}`;
    }
    if (lane === 'training') {
      const found = TRAINING_FOCUSES.find((t) => t.id === trainingFocus);
      return `Executive Training · ${found?.label ?? 'Briefing'}`;
    }
    const found = PARTNER_TYPES.find((t) => t.id === partnerType);
    return `Strategic Partnership · ${found?.label ?? 'Partner'}`;
  };

  const getNextStepCopy = () => {
    if (lane === 'founder') {
      return founderTrack === 'incubation'
        ? 'Our venture team reviews early concepts weekly and will follow up within two business days if there is a strong fit for incubation.'
        : 'Our investment team reviews every submission directly and replies within two business days regarding next steps.';
    }
    if (lane === 'training') {
      return 'We will share available executive briefing dates and a concise syllabus tailored to your leadership team within two business days.';
    }
    return 'Our partnerships lead will respond within two business days to schedule an introductory discussion on sandbox or ecosystem collaboration.';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/55 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) resetAndClose();
      }}
    >
      <div className="neu-raised rounded-3xl w-full max-w-lg p-7 sm:p-9 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={resetAndClose}
          disabled={submitting}
          aria-label="Close contact modal"
          className="absolute top-6 right-6 w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-6 space-y-4">
            <CheckCircle2 className="w-8 h-8 text-[#0B5563]" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-[#0B5563] mb-1">
                {getTrackSummaryLabel()}
                {referenceId ? ` · Ref ${referenceId}` : ''}
              </p>
              <h3
                id="inquiry-modal-title"
                className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0B2228]"
              >
                Inquiry Received
              </h3>
            </div>
            <p className="text-sm text-[#43585D] leading-relaxed">
              Thank you, {submittedName}. {getNextStepCopy()}
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="mt-2 px-6 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl cursor-pointer"
            >
              Done
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
              aria-label="Inquiry lane"
              className="grid grid-cols-3 gap-1.5 p-1.5 neu-pressed rounded-2xl mb-4"
            >
              {[
                { id: 'founder', label: 'Founders' },
                { id: 'training', label: 'Training' },
                { id: 'partner', label: 'Partners' },
              ].map((tab) => {
                const active = lane === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={submitting}
                    onClick={() => setLane(tab.id as InquiryLane)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap truncate cursor-pointer ${
                      active ? 'neu-raised-sm text-[#0B2228]' : 'text-[#43585D] hover:text-[#0B2228]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Honeypot anti-bot field */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="modal-fax-confirm">Leave this field blank</label>
                <input
                  id="modal-fax-confirm"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {lane === 'founder' && (
                <div>
                  <span className="block text-xs font-semibold text-[#0B2228] mb-1.5">Track</span>
                  <div className="grid grid-cols-2 gap-2">
                    {FOUNDER_TRACKS.map((opt) => {
                      const active = founderTrack === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => setFounderTrack(opt.id)}
                          aria-pressed={active}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                            active
                              ? 'neu-raised-sm text-[#0B5563] ring-1 ring-[#0B5563]/25'
                              : 'neu-pressed text-[#43585D] hover:text-[#0B2228]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {lane === 'training' && (
                <>
                  <div>
                    <span className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                      Briefing Focus
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {TRAINING_FOCUSES.map((opt) => {
                        const active = trainingFocus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={submitting}
                            onClick={() => setTrainingFocus(opt.id)}
                            aria-pressed={active}
                            className={`py-2 px-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer truncate ${
                              active
                                ? 'neu-raised-sm text-[#0B5563] ring-1 ring-[#0B5563]/25'
                                : 'neu-pressed text-[#43585D] hover:text-[#0B2228]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                      Leadership Team Size
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {TEAM_SIZE_OPTIONS.map((opt) => {
                        const active = teamSize === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={submitting}
                            onClick={() => setTeamSize(opt.id)}
                            aria-pressed={active}
                            className={`py-2 px-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer truncate ${
                              active
                                ? 'neu-raised-sm text-[#0B5563] ring-1 ring-[#0B5563]/25'
                                : 'neu-pressed text-[#43585D] hover:text-[#0B2228]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {lane === 'partner' && (
                <div>
                  <span className="block text-xs font-semibold text-[#0B2228] mb-1.5">
                    Partner Type
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PARTNER_TYPES.map((opt) => {
                      const active = partnerType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => setPartnerType(opt.id)}
                          aria-pressed={active}
                          className={`py-2 px-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer truncate ${
                            active
                              ? 'neu-raised-sm text-[#0B5563] ring-1 ring-[#0B5563]/25'
                              : 'neu-pressed text-[#43585D] hover:text-[#0B2228]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="modal-name"
                  className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                >
                  Name
                </label>
                <input
                  ref={nameInputRef}
                  id="modal-name"
                  type="text"
                  maxLength={PAYLOAD_LIMITS.fullNameMax}
                  disabled={submitting}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="modal-company"
                    className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                  >
                    Organisation
                  </label>
                  <input
                    id="modal-company"
                    type="text"
                    maxLength={PAYLOAD_LIMITS.companyMax}
                    disabled={submitting}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company, bank, or SME"
                    className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal-email"
                    className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    maxLength={PAYLOAD_LIMITS.emailMax}
                    disabled={submitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>
              </div>

              {lane === 'founder' && (
                <div>
                  <label
                    htmlFor="modal-website"
                    className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                  >
                    {founderTrack === 'incubation'
                      ? 'Concept Note or LinkedIn URL (optional)'
                      : 'Website or Brief URL (optional)'}
                  </label>
                  <input
                    id="modal-website"
                    type="url"
                    maxLength={PAYLOAD_LIMITS.websiteMax}
                    disabled={submitting}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="modal-message"
                  className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                >
                  {activeCopy.prompt}
                </label>
                <textarea
                  id="modal-message"
                  rows={3}
                  maxLength={PAYLOAD_LIMITS.messageMax}
                  disabled={submitting}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeCopy.placeholder}
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
                disabled={submitting}
                className="w-full py-3 px-5 text-sm font-semibold text-white neu-btn-teal rounded-xl transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
