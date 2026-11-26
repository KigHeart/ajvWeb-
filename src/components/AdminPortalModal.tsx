import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Check,
  ExternalLink,
  LogOut,
  Mail,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import type { InquiryLane } from '../data/memorandum';
import { auth, googleProvider, sanitizeWebsiteUrl } from '../lib/firebase';
import {
  checkAdminAccess,
  deleteInquiry,
  subscribeToInquiries,
  updateInquiryTriage,
  type InquiryRecord,
  type InquiryStatus,
} from '../lib/inquiries';

interface AdminPortalModalProps {
  open: boolean;
  onClose: () => void;
}

const LANE_LABELS: Record<InquiryLane, string> = {
  founder: 'Founders',
  training: 'Training',
  partner: 'Partners',
};

const SUBTRACK_LABELS: Record<string, string> = {
  investment: 'Venture Investment',
  incubation: 'Idea Incubation',
  governance: 'Governance & Risk',
  workflow: 'SME Workflows',
  workshop: 'Executive Workshop',
  'model-provider': 'AI Model Provider',
  bank: 'Bank / FI',
  enterprise: 'Enterprise Network',
};

const STATUS_OPTIONS: { id: InquiryStatus; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'archived', label: 'Archived' },
];

export function AdminPortalModal({ open, onClose }: AdminPortalModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [authError, setAuthError] = useState('');

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [dataError, setDataError] = useState('');

  const [laneFilter, setLaneFilter] = useState<'all' | InquiryLane>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<InquiryStatus>('new');
  const [draftNotes, setDraftNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthError('');
      setDataError('');

      if (!nextUser) {
        setIsAdmin(false);
        setInquiries([]);
        return;
      }

      setCheckingRole(true);
      const allowed = await checkAdminAccess(
        nextUser.uid,
        nextUser.email,
        nextUser.emailVerified,
      );
      setIsAdmin(allowed);
      setCheckingRole(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!open || !authReady || !user || !isAdmin) {
      return;
    }

    setLoadingInquiries(true);
    setDataError('');

    const unsubscribe = subscribeToInquiries(
      (items) => {
        setInquiries(items);
        setLoadingInquiries(false);
      },
      () => {
        setLoadingInquiries(false);
        setDataError('Unable to load inquiries. Check your account permissions.');
      },
    );

    return () => unsubscribe();
  }, [open, authReady, user, isAdmin]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const laneMatch = laneFilter === 'all' || item.lane === laneFilter;
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      return laneMatch && statusMatch;
    });
  }, [inquiries, laneFilter, statusFilter]);

  const selectedItem = useMemo(() => {
    return filteredInquiries.find((i) => i.id === selectedId) ?? filteredInquiries[0] ?? null;
  }, [filteredInquiries, selectedId]);

  useEffect(() => {
    if (selectedItem) {
      setDraftStatus(selectedItem.status);
      setDraftNotes(selectedItem.notes);
      setSavedNotice(false);
      setConfirmDeleteId(null);
    }
  }, [selectedItem]);

  if (!open) return null;

  const handleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Sign-in was cancelled or blocked by the browser.',
      );
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    await signOut(auth);
  };

  const handleSaveTriage = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setDataError('');
    setSavedNotice(false);
    try {
      await updateInquiryTriage(selectedItem.id, draftStatus, draftNotes);
      setSavedNotice(true);
    } catch {
      setDataError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDataError('');
    try {
      await deleteInquiry(id);
      setConfirmDeleteId(null);
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch {
      setDataError('Failed to delete inquiry.');
    }
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Just now';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06262D]/60 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="neu-raised rounded-3xl w-full max-w-4xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#D6DFE1] shrink-0">
          <div>
            <p className="text-xs font-medium text-[#0B5563] mb-1">Ajentir Ventures · Team Portal</p>
            <h3
              id="portal-modal-title"
              className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#0B2228]"
            >
              Inquiry Inbox
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#43585D] hover:text-[#0B2228] neu-raised-sm rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close portal"
              className="w-10 h-10 neu-raised-sm rounded-xl flex items-center justify-center text-[#43585D] hover:text-[#0B2228] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-6">
          {!authReady || checkingRole ? (
            <div className="py-12 text-center text-sm text-[#43585D]">
              Checking team access...
            </div>
          ) : !user ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-5">
              <p className="text-sm text-[#43585D] leading-relaxed">
                Sign in with an authorized Ajentir Ventures Google account to review inbound
                founder, executive training, and partnership inquiries.
              </p>
              {authError && (
                <p role="alert" className="text-xs font-medium text-[#9A3412]">
                  {authError}
                </p>
              )}
              <button
                type="button"
                onClick={handleSignIn}
                className="px-6 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl transition-all cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          ) : !isAdmin ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <ShieldAlert className="w-8 h-8 text-[#9A3412] mx-auto" aria-hidden="true" />
              <h4 className="font-display text-lg font-semibold text-[#0B2228]">
                Access Restricted
              </h4>
              <p className="text-sm text-[#43585D] leading-relaxed">
                Signed in as <span className="font-medium text-[#0B2228]">{user.email}</span>.
                This account does not have Ajentir Ventures admin access.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2.5 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl cursor-pointer"
              >
                Switch Account
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5 p-1 neu-pressed rounded-xl">
                  {(['all', 'founder', 'training', 'partner'] as const).map((tab) => {
                    const active = laneFilter === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setLaneFilter(tab)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          active
                            ? 'neu-raised-sm text-[#0B2228]'
                            : 'text-[#43585D] hover:text-[#0B2228]'
                        }`}
                      >
                        {tab === 'all' ? 'All Lanes' : LANE_LABELS[tab]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-1.5 p-1 neu-pressed rounded-xl">
                  {(['all', 'new', 'reviewing', 'scheduled', 'archived'] as const).map((st) => {
                    const active = statusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                          active
                            ? 'neu-raised-sm text-[#0B5563]'
                            : 'text-[#43585D] hover:text-[#0B2228]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {dataError && (
                <p role="alert" className="text-xs font-medium text-[#9A3412]">
                  {dataError}
                </p>
              )}

              {loadingInquiries ? (
                <div className="py-12 text-center text-sm text-[#43585D]">
                  Loading inquiries...
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="neu-pressed rounded-2xl p-8 text-center text-sm text-[#43585D]">
                  No inquiries match the current filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {filteredInquiries.map((item) => {
                      const active = selectedItem?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                            active
                              ? 'neu-raised ring-1 ring-[#0B5563]/30'
                              : 'neu-pressed hover:bg-white/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-display text-sm font-semibold text-[#0B2228] truncate">
                              {item.fullName}
                            </span>
                            <span className="text-[11px] font-medium capitalize text-[#0B5563] shrink-0">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#43585D] truncate">
                            {item.company || 'Independent'} · {LANE_LABELS[item.lane]}
                          </p>
                          <p className="text-[11px] text-[#7E9094] mt-1">
                            {formatTimestamp(item.createdAt)}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedItem && (
                    <div className="lg:col-span-7 neu-pressed rounded-2xl p-5 sm:p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#0B5563] mb-1">
                            {LANE_LABELS[selectedItem.lane]} ·{' '}
                            {SUBTRACK_LABELS[selectedItem.subTrack] ?? selectedItem.subTrack}
                          </p>
                          <h4 className="font-display text-xl font-semibold text-[#0B2228]">
                            {selectedItem.fullName}
                          </h4>
                          <p className="text-xs text-[#43585D] mt-0.5">
                            {selectedItem.company || 'No organisation specified'}
                          </p>
                        </div>

                        <span className="text-[11px] font-mono text-[#7E9094]">
                          {formatTimestamp(selectedItem.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs">
                        <a
                          href={`mailto:${selectedItem.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 neu-raised-sm rounded-lg font-medium text-[#0B5563] hover:text-[#0B2228]"
                        >
                          <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{selectedItem.email}</span>
                        </a>

                        {selectedItem.website && sanitizeWebsiteUrl(selectedItem.website) && (
                          <a
                            href={sanitizeWebsiteUrl(selectedItem.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 neu-raised-sm rounded-lg font-medium text-[#0B2228] hover:text-[#0B5563]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Website / Brief</span>
                          </a>
                        )}
                      </div>

                      <div className="bg-white/60 rounded-xl p-4 text-sm text-[#0B2228] leading-relaxed whitespace-pre-wrap">
                        {selectedItem.message || 'No additional notes provided.'}
                      </div>

                      <div className="space-y-3 pt-2 border-t border-[#D6DFE1]">
                        <div>
                          <span className="block text-xs font-semibold text-[#0B2228] mb-2">
                            Status
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {STATUS_OPTIONS.map((opt) => {
                              const active = draftStatus === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setDraftStatus(opt.id);
                                    setSavedNotice(false);
                                  }}
                                  className={`py-2 px-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                    active
                                      ? 'neu-raised-sm text-[#0B5563] ring-1 ring-[#0B5563]/30'
                                      : 'text-[#43585D] hover:text-[#0B2228]'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="portal-notes"
                            className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                          >
                            Internal Review Notes
                          </label>
                          <textarea
                            id="portal-notes"
                            rows={2}
                            value={draftNotes}
                            onChange={(e) => {
                              setDraftNotes(e.target.value);
                              setSavedNotice(false);
                            }}
                            placeholder="Add screening notes or next steps..."
                            className="w-full px-3.5 py-2.5 text-sm bg-white/70 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563] resize-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {confirmDeleteId === selectedItem.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[#9A3412]">
                                Confirm delete?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelete(selectedItem.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#9A3412] rounded-lg cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-[#43585D] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(selectedItem.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7E9094] hover:text-[#9A3412] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          )}

                          <div className="flex items-center gap-3">
                            {savedNotice && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0B5563]">
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                Saved
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={saving}
                              onClick={handleSaveTriage}
                              className="px-5 py-2.5 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
