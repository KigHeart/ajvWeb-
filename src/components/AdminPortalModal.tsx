import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Download,
  ExternalLink,
  KeyRound,
  LogOut,
  Mail,
  Send,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import type { InquiryLane } from '../data/memorandum';
import { getPortalUser, type PortalUser } from '../lib/authSession';
import {
  addTeamMember,
  claimPortalPassword,
  DEFAULT_SITE_CONFIG,
  deleteInquiry,
  exportInquiriesToCsv,
  fetchAdminHealth,
  fetchAuthStatus,
  fetchInquiries,
  fetchSiteConfig,
  fetchTeamMembers,
  loginPortal,
  logoutPortal,
  removeTeamMember,
  saveSiteConfig,
  updateInquiryTriage,
  type AdminHealthStatus,
  type AuthStatus,
  type IncubationStatus,
  type InquiryRecord,
  type InquiryStatus,
  type SiteConfig,
  type StageTag,
  type TeamMemberRecord,
} from '../lib/inquiries';
import { ADMIN_OWNER_EMAIL, PAYLOAD_LIMITS, sanitizeWebsiteUrl } from '../lib/validation';
import { DiscoveryWorkspace, type DiscoveryOrgPrefill } from './DiscoveryWorkspace';
import { ResearchPortalTab } from './ResearchPortalTab';

interface AdminPortalModalProps {
  open: boolean;
  onClose: () => void;
  onSiteConfigUpdated?: (config: SiteConfig) => void;
  onResearchUpdated?: () => void;
}

type PortalTab = 'inbox' | 'discovery' | 'research' | 'site' | 'team';

const LANE_LABELS: Record<InquiryLane, string> = {
  founder: 'Founders',
  training: 'Training',
  partner: 'Partners',
};

const SUBTRACK_LABELS: Record<string, string> = {
  discovery: 'Workflow Discovery',
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

const STAGE_TAG_OPTIONS: { id: StageTag; label: string }[] = [
  { id: '', label: 'None' },
  { id: 'Concept', label: 'Concept' },
  { id: 'MVP', label: 'MVP' },
  { id: 'Revenue', label: 'Revenue' },
  { id: 'Pilot Ready', label: 'Pilot Ready' },
  { id: 'Credit Pool', label: 'Credit Pool' },
  { id: 'Cohort', label: 'Cohort' },
];

const INCUBATION_STATUSES: IncubationStatus[] = ['Open', 'By Intro', 'Waitlist'];

function buildQuickReplyHref(item: InquiryRecord): string {
  const subjectMap: Record<InquiryLane, string> = {
    founder: `Ajentir Ventures — Next Steps (${item.company || item.fullName})`,
    training: `Ajentir Ventures — Executive Briefing Syllabus`,
    partner: `Ajentir Ventures — Strategic Partnership Discussion`,
  };
  const bodyMap: Record<InquiryLane, string> = {
    founder: `Hi ${item.fullName},\n\nThank you for reaching out to Ajentir Ventures regarding ${SUBTRACK_LABELS[item.subTrack] ?? item.subTrack}. We reviewed your note and would like to schedule a 20-minute introductory call.\n\nBest regards,\nAjentir Ventures`,
    training: `Hi ${item.fullName},\n\nThank you for your interest in Ajentir Ventures' Executive Training. Please find our upcoming briefing dates and governance syllabus outline attached below.\n\nBest regards,\nAjentir Ventures`,
    partner: `Hi ${item.fullName},\n\nThank you for connecting regarding a partnership with Ajentir Ventures. We would welcome a brief conversation on sandbox and ecosystem alignment.\n\nBest regards,\nAjentir Ventures`,
  };
  const subject = encodeURIComponent(subjectMap[item.lane]);
  const body = encodeURIComponent(bodyMap[item.lane]);
  return `mailto:${item.email}?subject=${subject}&body=${body}`;
}

export function AdminPortalModal({
  open,
  onClose,
  onSiteConfigUpdated,
  onResearchUpdated,
}: AdminPortalModalProps) {
  const [user, setUser] = useState<PortalUser | null>(() => getPortalUser());
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loadingAuthStatus, setLoadingAuthStatus] = useState(false);
  const [authError, setAuthError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Claim / login inputs
  const [claimName, setClaimName] = useState('Ajentir Owner');
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [activeTab, setActiveTab] = useState<PortalTab>('inbox');

  // Inbox state
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [dataError, setDataError] = useState('');
  const [laneFilter, setLaneFilter] = useState<'all' | InquiryLane>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<InquiryStatus>('new');
  const [draftStageTag, setDraftStageTag] = useState<StageTag>('');
  const [draftDesignPartner, setDraftDesignPartner] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Live Site Config state
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState('');

  // Team & health state
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [addingInvite, setAddingInvite] = useState(false);
  const [orgPrefill, setOrgPrefill] = useState<DiscoveryOrgPrefill | null>(null);
  const [adminHealth, setAdminHealth] = useState<AdminHealthStatus | null>(null);

  const isOwner = user?.role === 'owner';
  const isStaticPages =
    typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');

  useEffect(() => {
    if (!open || user) return;
    setLoadingAuthStatus(true);
    setAuthError('');
    void fetchAuthStatus()
      .then((status) => setAuthStatus(status))
      .catch((err) =>
        setAuthError(err instanceof Error ? err.message : 'Unable to check portal status.'),
      )
      .finally(() => setLoadingAuthStatus(false));
  }, [open, user]);

  const loadPortalData = async (currentUser: PortalUser) => {
    setLoadingInquiries(true);
    setDataError('');
    try {
      const [inqItems, cfg, health] = await Promise.all([
        fetchInquiries(),
        fetchSiteConfig(),
        fetchAdminHealth(),
      ]);
      setInquiries(inqItems);
      setSiteConfig(cfg);
      setAdminHealth(health);
      if (currentUser.role === 'owner') {
        const members = await fetchTeamMembers();
        setTeamMembers(members);
      }
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Unable to load portal data.');
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (!open || !user) return;
    void loadPortalData(user);
  }, [open, user]);

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
      setDraftStageTag(selectedItem.stageTag);
      setDraftDesignPartner(selectedItem.designPartner);
      setDraftNotes(selectedItem.notes);
      setSavedNotice(false);
      setConfirmDeleteId(null);
    }
  }, [selectedItem]);

  if (!open) return null;

  const needsInitialClaim =
    Boolean(authStatus) && !authStatus?.envPasscodeConfigured && !authStatus?.ownerClaimed;

  const handleClaimPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setSubmittingAuth(true);
    try {
      const nextUser = await claimPortalPassword({
        displayName: claimName.trim() || 'Ajentir Owner',
        email: (loginEmail.trim() || authStatus?.ownerEmailHint || ADMIN_OWNER_EMAIL).toLowerCase(),
        password,
      });
      setPassword('');
      setConfirmPassword('');
      setUser(nextUser);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to set password.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }
    setSubmittingAuth(true);
    try {
      const nextUser = await loginPortal({
        email: loginEmail.trim() || undefined,
        password,
      });
      setPassword('');
      setUser(nextUser);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleSignOut = () => {
    logoutPortal();
    setUser(null);
    setInquiries([]);
    setTeamMembers([]);
    setAdminHealth(null);
    setAuthError('');
  };

  const handleSaveTriage = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setDataError('');
    setSavedNotice(false);
    try {
      await updateInquiryTriage(selectedItem.id, {
        status: draftStatus,
        stageTag: draftStageTag,
        designPartner: draftDesignPartner,
        notes: draftNotes,
      });
      const updated = await fetchInquiries();
      setInquiries(updated);
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
      const updated = await fetchInquiries();
      setInquiries(updated);
    } catch {
      setDataError('Failed to delete inquiry.');
    }
  };

  const handleSaveSiteConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigError('');
    setConfigSaved(false);
    try {
      await saveSiteConfig(siteConfig);
      onSiteConfigUpdated?.(siteConfig);
      setConfigSaved(true);
    } catch {
      setConfigError('Failed to update live site configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddTeamMember = async (e: FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setAddingInvite(true);
    try {
      const created = await addTeamMember({
        email: inviteEmail,
        displayName: inviteName,
        password: invitePassword,
      });
      setTeamMembers((prev) => [created, ...prev]);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to add team member.');
    } finally {
      setAddingInvite(false);
    }
  };

  const handleRemoveTeamMember = async (id: string) => {
    try {
      await removeTeamMember(id);
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to remove team member.');
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
      <div className="neu-raised rounded-3xl w-full max-w-5xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#D6DFE1] shrink-0">
          <div>
            <p className="text-xs font-medium text-[#0B5563] mb-1">Ajentir Ventures · Team Portal</p>
            <h3
              id="portal-modal-title"
              className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#0B2228]"
            >
              Operations &amp; Inquiry Portal
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {user && (
              <div className="hidden sm:flex gap-1 p-1 neu-pressed rounded-xl mr-1">
                {[
                  { id: 'inbox', label: 'Inbox' },
                  { id: 'discovery', label: 'Discovery OS' },
                  { id: 'research', label: 'Research' },
                  { id: 'site', label: 'Site Updates' },
                  { id: 'team', label: 'Team & Alerts' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as PortalTab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === t.id
                        ? 'neu-raised-sm text-[#0B2228]'
                        : 'text-[#43585D] hover:text-[#0B2228]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#43585D] hover:text-[#0B2228] neu-raised-sm rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

        {user && (
          <div className="flex sm:hidden gap-1 p-1 neu-pressed rounded-xl mt-4 shrink-0 overflow-x-auto">
            {[
              { id: 'inbox', label: 'Inbox' },
              { id: 'discovery', label: 'Discovery OS' },
              { id: 'research', label: 'Research' },
              { id: 'site', label: 'Site' },
              { id: 'team', label: 'Team' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as PortalTab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? 'neu-raised-sm text-[#0B2228]'
                    : 'text-[#43585D] hover:text-[#0B2228]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pt-5">
          {!user ? (
            isStaticPages ? (
              <div className="max-w-md mx-auto py-8 text-center space-y-3">
                <KeyRound className="w-7 h-7 text-[#0B5563] mx-auto" aria-hidden="true" />
                <h4 className="font-display text-lg font-semibold text-[#0B2228]">
                  Server Hosting Required for Team Portal
                </h4>
                <p className="text-sm text-[#43585D] leading-relaxed">
                  You are viewing the static GitHub Pages mirror. Open your AI Studio or self-hosted
                  server URL to access the SQLite database and Team Portal.
                </p>
              </div>
            ) : loadingAuthStatus ? (
              <div className="py-12 text-center text-sm text-[#43585D]">
                Checking portal status...
              </div>
            ) : needsInitialClaim ? (
              <form
                onSubmit={handleClaimPassword}
                className="max-w-md mx-auto py-4 space-y-4 neu-pressed rounded-2xl p-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#0B5563]">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                    <span className="text-xs font-semibold">First-Run Setup · No MFA Required</span>
                  </div>
                  <h4 className="font-display text-xl font-semibold text-[#0B2228]">
                    Set Team Portal Password
                  </h4>
                  <p className="text-xs text-[#43585D] leading-relaxed">
                    Create your owner password to protect the SQLite Inquiry Inbox and Discovery OS.
                    You can override this anytime via <span className="font-mono">ADMIN_PASSWORD</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail || authStatus?.ownerEmailHint || ADMIN_OWNER_EMAIL}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                    Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
                    className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                {authError && (
                  <p role="alert" className="text-xs font-medium text-[#9A3412]">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {submittingAuth ? 'Securing Portal...' : 'Save Password & Enter Portal'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleLogin}
                className="max-w-md mx-auto py-4 space-y-4 neu-pressed rounded-2xl p-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#0B5563]">
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                    <span className="text-xs font-semibold">Direct Team Sign-In</span>
                  </div>
                  <h4 className="font-display text-xl font-semibold text-[#0B2228]">
                    Sign in to Ajentir Portal
                  </h4>
                  <p className="text-xs text-[#43585D] leading-relaxed">
                    Enter your portal password (and email if signing in with a team member account).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                    Email (optional for primary owner)
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={authStatus?.ownerEmailHint || ADMIN_OWNER_EMAIL}
                    className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter portal password"
                    className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                  />
                </div>

                {authError && (
                  <p role="alert" className="text-xs font-medium text-[#9A3412]">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {submittingAuth ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )
          ) : activeTab === 'inbox' ? (
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
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1.5 p-1 neu-pressed rounded-xl">
                    {(['all', 'new', 'reviewing', 'scheduled', 'archived'] as const).map((st) => {
                      const active = statusFilter === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize whitespace-nowrap shrink-0 cursor-pointer ${
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

                  <button
                    type="button"
                    disabled={filteredInquiries.length === 0}
                    onClick={() => exportInquiriesToCsv(filteredInquiries)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl hover:text-[#0B5563] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Export CSV</span>
                  </button>
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
                  <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
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
                            {item.stageTag ? ` · ${item.stageTag}` : ''}
                          </p>
                          <p className="text-[11px] text-[#7E9094] mt-1 tabular-nums">
                            {formatTimestamp(item.createdAt)}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedItem && (
                    <div className="lg:col-span-7 neu-pressed rounded-2xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[#0B5563] mb-1">
                            {LANE_LABELS[selectedItem.lane]} ·{' '}
                            {SUBTRACK_LABELS[selectedItem.subTrack] ?? selectedItem.subTrack}
                            {selectedItem.teamSize ? ` · ${selectedItem.teamSize}` : ''}
                          </p>
                          <h4 className="font-display text-xl font-semibold text-[#0B2228]">
                            {selectedItem.fullName}
                          </h4>
                          <p className="text-xs text-[#43585D] mt-0.5">
                            {selectedItem.company || 'No organisation specified'}
                          </p>
                        </div>

                        <span className="text-[11px] font-mono tabular-nums text-[#7E9094]">
                          {formatTimestamp(selectedItem.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2.5 text-xs">
                        <a
                          href={buildQuickReplyHref(selectedItem)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 neu-raised-sm rounded-lg font-medium text-[#0B5563] hover:text-[#0B2228]"
                        >
                          <Send className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Quick Reply</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setOrgPrefill({
                              key: Date.now(),
                              name: selectedItem.company || selectedItem.fullName,
                              workflowOwners: `${selectedItem.fullName} (${selectedItem.email})`,
                              workflowsSummary: selectedItem.message,
                            });
                            setActiveTab('discovery');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 neu-raised-sm rounded-lg font-medium text-[#0B2228] hover:text-[#0B5563] cursor-pointer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#B5862A]" aria-hidden="true" />
                          <span>Promote to Discovery OS</span>
                        </button>

                        <a
                          href={`mailto:${selectedItem.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 neu-raised-sm rounded-lg font-medium text-[#43585D] hover:text-[#0B2228]"
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="portal-stage-tag"
                              className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                            >
                              Pipeline Stage Tag
                            </label>
                            <select
                              id="portal-stage-tag"
                              value={draftStageTag}
                              onChange={(e) => {
                                setDraftStageTag(e.target.value as StageTag);
                                setSavedNotice(false);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                            >
                              {STAGE_TAG_OPTIONS.map((opt) => (
                                <option key={opt.id || 'none'} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="portal-design-partner"
                              className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                            >
                              Design Partner / Owner Match
                            </label>
                            <input
                              id="portal-design-partner"
                              type="text"
                              maxLength={PAYLOAD_LIMITS.designPartnerMax}
                              value={draftDesignPartner}
                              onChange={(e) => {
                                setDraftDesignPartner(e.target.value);
                                setSavedNotice(false);
                              }}
                              placeholder="Optional SME or bank pilot match"
                              className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                            />
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
                            maxLength={PAYLOAD_LIMITS.notesMax}
                            value={draftNotes}
                            onChange={(e) => {
                              setDraftNotes(e.target.value);
                              setSavedNotice(false);
                            }}
                            placeholder="Add screening notes or next steps..."
                            className="w-full px-3.5 py-2 text-sm bg-white/75 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563] resize-none"
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
          ) : activeTab === 'discovery' ? (
            <DiscoveryWorkspace
              orgPrefill={orgPrefill}
              onPrefillConsumed={() => setOrgPrefill(null)}
            />
          ) : activeTab === 'research' ? (
            <ResearchPortalTab onResearchUpdated={onResearchUpdated} />
          ) : activeTab === 'site' ? (
            <form onSubmit={handleSaveSiteConfig} className="max-w-2xl space-y-5">
              <div>
                <h4 className="font-display text-lg font-semibold text-[#0B2228]">
                  Live Cohort &amp; Briefing Status
                </h4>
                <p className="text-xs text-[#43585D] mt-1">
                  Updates here are stored in SQLite and appear immediately inside the What We Do
                  brief modals.
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#0B2228] mb-2">
                  Idea Incubation Intake Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {INCUBATION_STATUSES.map((st) => {
                    const active = siteConfig.incubationStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setSiteConfig((prev) => ({ ...prev, incubationStatus: st }));
                          setConfigSaved(false);
                        }}
                        className={`py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          active
                            ? 'neu-raised-sm text-[#0B5563] ring-1 ring-[#0B5563]/30'
                            : 'neu-pressed text-[#43585D] hover:text-[#0B2228]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="site-briefing-label"
                  className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                >
                  Next Executive Training Briefing Line
                </label>
                <input
                  id="site-briefing-label"
                  type="text"
                  maxLength={PAYLOAD_LIMITS.nextBriefingMax}
                  value={siteConfig.nextBriefingLabel}
                  onChange={(e) => {
                    setSiteConfig((prev) => ({ ...prev, nextBriefingLabel: e.target.value }));
                    setConfigSaved(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label
                  htmlFor="site-partner-note"
                  className="block text-xs font-semibold text-[#0B2228] mb-1.5"
                >
                  Strategic Partnership / Sandbox Status Line
                </label>
                <input
                  id="site-partner-note"
                  type="text"
                  maxLength={PAYLOAD_LIMITS.partnerSandboxMax}
                  value={siteConfig.partnerSandboxNote}
                  onChange={(e) => {
                    setSiteConfig((prev) => ({ ...prev, partnerSandboxNote: e.target.value }));
                    setConfigSaved(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm neu-pressed rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              {configError && (
                <p role="alert" className="text-xs font-medium text-[#9A3412]">
                  {configError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-2.5 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {savingConfig ? 'Publishing...' : 'Publish Live Updates'}
                </button>
                {configSaved && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0B5563]">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Published
                  </span>
                )}
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h4 className="font-display text-lg font-semibold text-[#0B2228]">
                    Portal Team Accounts (Password Login · Zero MFA)
                  </h4>
                  <p className="text-xs text-[#43585D] mt-1">
                    Signed in as <span className="font-medium text-[#0B2228]">{user.email}</span>
                  </p>
                </div>

                {isOwner ? (
                  <>
                    <form
                      onSubmit={handleAddTeamMember}
                      className="neu-pressed rounded-2xl p-4 space-y-3"
                    >
                      <span className="block text-xs font-semibold text-[#0B2228]">
                        Create Team Member Account
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          required
                          value={inviteName}
                          maxLength={PAYLOAD_LIMITS.fullNameMax}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="Colleague name"
                          className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                        />
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          maxLength={PAYLOAD_LIMITS.emailMax}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@ajentir.com"
                          className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                        />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          placeholder="Password (min 8 chars)"
                          className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
                        />
                      </div>
                      {inviteError && (
                        <p role="alert" className="text-xs font-medium text-[#9A3412]">
                          {inviteError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={addingInvite}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{addingInvite ? 'Adding...' : 'Create Account'}</span>
                      </button>
                    </form>

                    <div className="space-y-2">
                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-[#43585D]">
                          No additional team member accounts created yet.
                        </p>
                      ) : (
                        teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="neu-raised-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0B2228] truncate">
                                {member.displayName}
                              </p>
                              <p className="text-[11px] text-[#43585D] truncate">{member.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleRemoveTeamMember(member.id)}
                              className="text-xs font-medium text-[#9A3412] hover:underline shrink-0 cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#43585D]">
                    Only the account owner can create or revoke team member accounts.
                  </p>
                )}
              </div>

              <div className="lg:col-span-5">
                <div className="neu-pressed rounded-2xl p-5 space-y-3">
                  <h4 className="font-display text-sm font-semibold text-[#0B2228]">
                    Database &amp; Alert Delivery
                  </h4>
                  <div className="space-y-2 text-xs text-[#43585D] leading-relaxed">
                    <p>
                      Primary storage:{' '}
                      <span className="font-semibold text-[#0B2228]">
                        SQLite ({adminHealth?.database ?? 'sqlite'})
                      </span>
                    </p>
                    <p>
                      Email alerts (Resend):{' '}
                      <span className="font-semibold text-[#0B2228]">
                        {adminHealth?.emailAlertsConfigured ? 'Active' : 'Not configured'}
                      </span>
                    </p>
                    <p>
                      Webhook alerts:{' '}
                      <span className="font-semibold text-[#0B2228]">
                        {adminHealth?.webhookAlertsConfigured ? 'Active' : 'Not configured'}
                      </span>
                    </p>
                    <p className="text-[11px]">
                      Configure <span className="font-mono">ADMIN_PASSWORD</span>,{' '}
                      <span className="font-mono">RESEND_API_KEY</span>,{' '}
                      <span className="font-mono">ALERT_TO_EMAIL</span>, and{' '}
                      <span className="font-mono">ALERT_WEBHOOK_URL</span> in AI Studio Settings →
                      Secrets / Environment Variables.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
