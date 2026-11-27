import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Download, Plus, Search, Trash2 } from 'lucide-react';
import {
  computeOpportunityScore,
  deleteDiscoveryOrg,
  deleteVentureOpportunity,
  DISCOVERY_SECTORS,
  exportDiscoveryOrgsToCsv,
  exportOpportunitiesToCsv,
  fetchDiscoveryOrgs,
  fetchVentureOpportunities,
  getScoreThresholdLabel,
  INTERVENTIONS,
  OPPORTUNITY_CATEGORIES,
  ORG_STATUSES,
  PIPELINE_STAGES,
  saveDiscoveryOrg,
  saveVentureOpportunity,
  SCORECARD_CRITERIA,
  type DiscoveryOrgRecord,
  type DiscoveryOrgStatus,
  type DiscoverySector,
  type OpportunityCategory,
  type PipelineStage,
  type VentureOpportunityRecord,
  type WorkflowIntervention,
} from '../lib/discovery';

export interface DiscoveryOrgPrefill {
  key: number;
  name: string;
  workflowOwners: string;
  workflowsSummary: string;
}

interface DiscoveryWorkspaceProps {
  orgPrefill?: DiscoveryOrgPrefill | null;
  onPrefillConsumed?: () => void;
}

type SubView = 'opportunities' | 'orgs';

const EMPTY_ORG: Omit<DiscoveryOrgRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  sector: 'Financial services',
  size: '',
  operatingModel: '',
  workflowOwners: '',
  workflowsSummary: '',
  status: 'Access',
};

const EMPTY_OPP: Omit<VentureOpportunityRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  orgId: '',
  orgName: '',
  category: 'C — New venture',
  intervention: 'Reconstruct',
  problemSummary: '',
  validationEvidence: '',
  hasPaidDemandEvidence: false,
  scoreSeverity: 10,
  scoreRepeatability: 10,
  scoreWtp: 12,
  scoreAgentic: 10,
  scoreScalability: 10,
  scoreFeasibility: 6,
  scoreFit: 7,
  pipelineStage: 'Investigate',
};

export function DiscoveryWorkspace({ orgPrefill, onPrefillConsumed }: DiscoveryWorkspaceProps) {
  const [subView, setSubView] = useState<SubView>('opportunities');
  const [orgs, setOrgs] = useState<DiscoveryOrgRecord[]>([]);
  const [opps, setOpps] = useState<VentureOpportunityRecord[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [error, setError] = useState('');

  // Filtering & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | PipelineStage>('all');
  const [sectorFilter, setSectorFilter] = useState<'all' | DiscoverySector>('all');

  // Org editor state
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [orgForm, setOrgForm] = useState(EMPTY_ORG);
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  // Opportunity editor state
  const [editingOppId, setEditingOppId] = useState<string | null>(null);
  const [oppForm, setOppForm] = useState(EMPTY_OPP);
  const [savingOpp, setSavingOpp] = useState(false);
  const [oppSaved, setOppSaved] = useState(false);

  const loadDiscoveryData = async () => {
    try {
      const [orgItems, oppItems] = await Promise.all([
        fetchDiscoveryOrgs(),
        fetchVentureOpportunities(),
      ]);
      setOrgs(orgItems);
      setOpps(oppItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Discovery OS records.');
    } finally {
      setLoadingOrgs(false);
      setLoadingOpps(false);
    }
  };

  useEffect(() => {
    void loadDiscoveryData();
  }, []);

  useEffect(() => {
    if (!orgPrefill) return;
    setSubView('orgs');
    setEditingOrgId(null);
    setOrgForm({
      ...EMPTY_ORG,
      name: orgPrefill.name.slice(0, 140),
      workflowOwners: orgPrefill.workflowOwners.slice(0, 200),
      workflowsSummary: orgPrefill.workflowsSummary.slice(0, 3000),
      status: 'Access',
    });
    setOrgSaved(false);
    onPrefillConsumed?.();
  }, [orgPrefill, onPrefillConsumed]);

  const sortedOpps = useMemo(() => {
    return [...opps].sort((a, b) => computeOpportunityScore(b) - computeOpportunityScore(a));
  }, [opps]);

  const filteredOpps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedOpps.filter((opp) => {
      const stageMatch = stageFilter === 'all' || opp.pipelineStage === stageFilter;
      if (!stageMatch) return false;
      if (!q) return true;
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.orgName.toLowerCase().includes(q) ||
        opp.problemSummary.toLowerCase().includes(q)
      );
    });
  }, [sortedOpps, stageFilter, searchQuery]);

  const filteredOrgs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orgs.filter((org) => {
      const sectorMatch = sectorFilter === 'all' || org.sector === sectorFilter;
      if (!sectorMatch) return false;
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        org.sector.toLowerCase().includes(q) ||
        org.workflowOwners.toLowerCase().includes(q) ||
        org.workflowsSummary.toLowerCase().includes(q)
      );
    });
  }, [orgs, sectorFilter, searchQuery]);

  const pipelineCounts = useMemo(() => {
    return PIPELINE_STAGES.reduce<Record<PipelineStage, number>>(
      (acc, st) => {
        acc[st] = opps.filter((o) => o.pipelineStage === st).length;
        return acc;
      },
      { Reject: 0, Investigate: 0, Validate: 0, Incubate: 0, Invest: 0 },
    );
  }, [opps]);

  const currentScore = computeOpportunityScore(oppForm);
  const scoreMeta = getScoreThresholdLabel(currentScore, oppForm.hasPaidDemandEvidence);

  const handleSaveOrg = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOrgSaved(false);
    setSavingOrg(true);
    try {
      const id = await saveDiscoveryOrg({ ...orgForm, id: editingOrgId ?? undefined });
      setEditingOrgId(id);
      setOrgSaved(true);
      await loadDiscoveryData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save organisation.');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleSaveOpp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOppSaved(false);
    setSavingOpp(true);
    try {
      const matchedOrg = orgs.find((o) => o.id === oppForm.orgId);
      const id = await saveVentureOpportunity({
        ...oppForm,
        orgName: matchedOrg ? matchedOrg.name : oppForm.orgName,
        id: editingOppId ?? undefined,
      });
      setEditingOppId(id);
      setOppSaved(true);
      await loadDiscoveryData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save opportunity.');
    } finally {
      setSavingOpp(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 neu-pressed rounded-xl">
          <button
            type="button"
            onClick={() => setSubView('opportunities')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              subView === 'opportunities'
                ? 'neu-raised-sm text-[#0B2228]'
                : 'text-[#43585D] hover:text-[#0B2228]'
            }`}
          >
            03–06 Opportunities &amp; Scorecard ({opps.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('orgs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              subView === 'orgs'
                ? 'neu-raised-sm text-[#0B2228]'
                : 'text-[#43585D] hover:text-[#0B2228]'
            }`}
          >
            01–02 Organisations &amp; Workflows ({orgs.length})
          </button>
        </div>

        <button
          type="button"
          disabled={subView === 'opportunities' ? sortedOpps.length === 0 : orgs.length === 0}
          onClick={() => {
            if (subView === 'opportunities') {
              exportOpportunitiesToCsv(sortedOpps);
            } else {
              exportDiscoveryOrgsToCsv(orgs);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl hover:text-[#0B5563] disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{subView === 'opportunities' ? 'Export Scorecard CSV' : 'Export Orgs CSV'}</span>
        </button>
      </div>

      {/* Pipeline Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {subView === 'opportunities' ? (
          <div className="flex flex-wrap gap-1 p-1 neu-pressed rounded-xl">
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                stageFilter === 'all'
                  ? 'neu-raised-sm text-[#0B2228]'
                  : 'text-[#43585D] hover:text-[#0B2228]'
              }`}
            >
              All ({opps.length})
            </button>
            {PIPELINE_STAGES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  stageFilter === st
                    ? 'neu-raised-sm text-[#0B5563]'
                    : 'text-[#43585D] hover:text-[#0B2228]'
                }`}
              >
                {st} ({pipelineCounts[st]})
              </button>
            ))}
          </div>
        ) : (
          <select
            aria-label="Filter organisations by sector"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value as 'all' | DiscoverySector)}
            className="px-3 py-1.5 text-xs font-medium bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
          >
            <option value="all">All Sectors ({orgs.length})</option>
            {DISCOVERY_SECTORS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        )}

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="w-3.5 h-3.5 text-[#7E9094] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subView === 'opportunities'
                ? 'Filter opportunities or orgs...'
                : 'Filter organisations or owners...'
            }
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/75 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-[#9A3412]">
          {error}
        </p>
      )}

      {subView === 'orgs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setEditingOrgId(null);
                setOrgForm(EMPTY_ORG);
                setOrgSaved(false);
              }}
              className="w-full p-3.5 rounded-2xl neu-raised-sm text-xs font-semibold text-[#0B5563] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Discovery Organisation</span>
            </button>

            {loadingOrgs ? (
              <div className="neu-pressed rounded-2xl p-6 text-center text-xs text-[#43585D]">
                Loading discovery organisations...
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="neu-pressed rounded-2xl p-6 text-center space-y-2">
                <p className="text-xs font-medium text-[#0B2228]">
                  {orgs.length === 0
                    ? 'No organisations mapped yet.'
                    : 'No organisations match your filter.'}
                </p>
                <p className="text-[11px] text-[#43585D] leading-relaxed">
                  Record Stage 1–2 organisational profiles, workflow owners, and baseline friction
                  here.
                </p>
              </div>
            ) : (
              filteredOrgs.map((org) => {
                const active = editingOrgId === org.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setEditingOrgId(org.id);
                      setOrgForm({
                        name: org.name,
                        sector: org.sector,
                        size: org.size,
                        operatingModel: org.operatingModel,
                        workflowOwners: org.workflowOwners,
                        workflowsSummary: org.workflowsSummary,
                        status: org.status,
                      });
                      setOrgSaved(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                      active ? 'neu-raised ring-1 ring-[#0B5563]/30' : 'neu-pressed hover:bg-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display text-sm font-semibold text-[#0B2228] truncate">
                        {org.name}
                      </span>
                      <span className="text-[11px] font-medium text-[#0B5563] shrink-0">
                        {org.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#43585D] truncate">
                      {org.sector}
                      {org.size ? ` · ${org.size}` : ''}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSaveOrg}
            className="lg:col-span-7 neu-pressed rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-display text-base font-semibold text-[#0B2228]">
                {editingOrgId ? 'Edit Organisation & Workflows' : 'Add Organisation Profile'}
              </h4>
              {editingOrgId && (
                <button
                  type="button"
                  onClick={() => {
                    if (!editingOrgId) return;
                    void deleteDiscoveryOrg(editingOrgId).then(async () => {
                      setEditingOrgId(null);
                      setOrgForm(EMPTY_ORG);
                      await loadDiscoveryData();
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#9A3412] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                  Organisation Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={orgForm.name}
                  onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Rift Valley Distributors"
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">Sector</label>
                <select
                  value={orgForm.sector}
                  onChange={(e) =>
                    setOrgForm((p) => ({ ...p, sector: e.target.value as DiscoverySector }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                >
                  {DISCOVERY_SECTORS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">Size</label>
                <input
                  type="text"
                  maxLength={60}
                  value={orgForm.size}
                  onChange={(e) => setOrgForm((p) => ({ ...p, size: e.target.value }))}
                  placeholder="e.g., 120 staff"
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                  Workflow Owners
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={orgForm.workflowOwners}
                  onChange={(e) => setOrgForm((p) => ({ ...p, workflowOwners: e.target.value }))}
                  placeholder="Head of Ops, Finance Lead"
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">Stage</label>
                <select
                  value={orgForm.status}
                  onChange={(e) =>
                    setOrgForm((p) => ({ ...p, status: e.target.value as DiscoveryOrgStatus }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                >
                  {ORG_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                Operating Model Summary
              </label>
              <input
                type="text"
                maxLength={240}
                value={orgForm.operatingModel}
                onChange={(e) => setOrgForm((p) => ({ ...p, operatingModel: e.target.value }))}
                placeholder="Core systems (ERP, M-Pesa, WhatsApp, spreadsheets) and transaction flow"
                className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <label className="block text-xs font-semibold text-[#0B2228]">
                  Workflow Inventory &amp; Baseline Friction
                </label>
                <span className="text-[10px] text-[#43585D]">
                  10-Dimension Map: Trigger · Input · Action · Decision · Actor · System · Output · Exception · Cost · Delay
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={3000}
                value={orgForm.workflowsSummary}
                onChange={(e) => setOrgForm((p) => ({ ...p, workflowsSummary: e.target.value }))}
                placeholder="Document cost per transaction, processing time, rework/escalation rates, and manual system handoffs..."
                className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {orgSaved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0B5563]">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
              <button
                type="submit"
                disabled={savingOrg}
                className="px-5 py-2.5 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
              >
                {savingOrg ? 'Saving...' : editingOrgId ? 'Update Organisation' : 'Save Organisation'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setEditingOppId(null);
                setOppForm(EMPTY_OPP);
                setOppSaved(false);
              }}
              className="w-full p-3.5 rounded-2xl neu-raised-sm text-xs font-semibold text-[#0B5563] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log New Venture Opportunity</span>
            </button>

            {loadingOpps ? (
              <div className="neu-pressed rounded-2xl p-6 text-center text-xs text-[#43585D]">
                Loading venture scorecard pipeline...
              </div>
            ) : filteredOpps.length === 0 ? (
              <div className="neu-pressed rounded-2xl p-6 text-center space-y-2">
                <p className="text-xs font-medium text-[#0B2228]">
                  {opps.length === 0
                    ? 'No venture opportunities scored yet.'
                    : 'No opportunities match the active filter.'}
                </p>
                <p className="text-[11px] text-[#43585D] leading-relaxed">
                  Classify Category A/B/C problems, set agent authority boundaries, and score
                  against the 100-point rubric.
                </p>
              </div>
            ) : (
              filteredOpps.map((opp) => {
                const total = computeOpportunityScore(opp);
                const active = editingOppId === opp.id;
                return (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => {
                      setEditingOppId(opp.id);
                      setOppForm({
                        title: opp.title,
                        orgId: opp.orgId,
                        orgName: opp.orgName,
                        category: opp.category,
                        intervention: opp.intervention,
                        problemSummary: opp.problemSummary,
                        validationEvidence: opp.validationEvidence,
                        hasPaidDemandEvidence: opp.hasPaidDemandEvidence,
                        scoreSeverity: opp.scoreSeverity,
                        scoreRepeatability: opp.scoreRepeatability,
                        scoreWtp: opp.scoreWtp,
                        scoreAgentic: opp.scoreAgentic,
                        scoreScalability: opp.scoreScalability,
                        scoreFeasibility: opp.scoreFeasibility,
                        scoreFit: opp.scoreFit,
                        pipelineStage: opp.pipelineStage,
                      });
                      setOppSaved(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                      active ? 'neu-raised ring-1 ring-[#0B5563]/30' : 'neu-pressed hover:bg-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display text-sm font-semibold text-[#0B2228] truncate">
                        {opp.title}
                      </span>
                      <span className="font-mono tabular-nums text-xs font-semibold text-[#0B5563] shrink-0">
                        {total}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#43585D] truncate">
                      {opp.category.split(' — ')[0]} · {opp.pipelineStage}
                      {opp.orgName ? ` · ${opp.orgName}` : ''}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSaveOpp}
            className="lg:col-span-7 neu-pressed rounded-2xl p-5 sm:p-6 space-y-4 max-h-[500px] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-base font-semibold text-[#0B2228]">
                  {editingOppId ? 'Edit Opportunity & Scorecard' : 'New Venture Opportunity'}
                </h4>
                <p className="text-[11px] font-medium text-[#0B5563] mt-0.5 tabular-nums">
                  Score: <span className="font-mono font-semibold">{currentScore}/100</span> ·{' '}
                  {scoreMeta.tier}
                </p>
              </div>
              {editingOppId && (
                <button
                  type="button"
                  onClick={() => {
                    if (!editingOppId) return;
                    void deleteVentureOpportunity(editingOppId).then(async () => {
                      setEditingOppId(null);
                      setOppForm(EMPTY_OPP);
                      await loadDiscoveryData();
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#9A3412] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {scoreMeta.warning && (
              <p className="text-[11px] font-medium text-[#9A3412] bg-[#9A3412]/10 rounded-xl px-3 py-2">
                {scoreMeta.warning}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                  Opportunity Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={oppForm.title}
                  onChange={(e) => setOppForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Agentic Supplier Operations Platform"
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                  Source Organisation
                </label>
                <select
                  value={oppForm.orgId}
                  onChange={(e) => {
                    const nextOrgId = e.target.value;
                    const found = orgs.find((o) => o.id === nextOrgId);
                    setOppForm((p) => ({
                      ...p,
                      orgId: nextOrgId,
                      orgName: found ? found.name : '',
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                >
                  <option value="">Independent / Multiple Orgs</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.sector})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">Category</label>
                <select
                  value={oppForm.category}
                  onChange={(e) =>
                    setOppForm((p) => ({
                      ...p,
                      category: e.target.value as OpportunityCategory,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                >
                  {OPPORTUNITY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                  Intervention
                </label>
                <select
                  value={oppForm.intervention}
                  onChange={(e) =>
                    setOppForm((p) => ({
                      ...p,
                      intervention: e.target.value as WorkflowIntervention,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                >
                  {INTERVENTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={oppForm.pipelineStage}
                  onChange={(e) =>
                    setOppForm((p) => ({
                      ...p,
                      pipelineStage: e.target.value as PipelineStage,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-4 space-y-2.5">
              <span className="block text-xs font-semibold text-[#0B2228]">
                100-Point Venture Scorecard
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {SCORECARD_CRITERIA.map((crit) => {
                  const val = oppForm[crit.key];
                  return (
                    <div key={crit.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#43585D]">{crit.label}</span>
                        <span className="font-mono tabular-nums font-semibold text-[#0B2228]">
                          {val}/{crit.max}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={crit.max}
                        value={val}
                        onChange={(e) =>
                          setOppForm((p) => ({
                            ...p,
                            [crit.key]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#0B5563] cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                Problem &amp; Authority Boundaries
              </label>
              <textarea
                rows={2}
                maxLength={1200}
                value={oppForm.problemSummary}
                onChange={(e) => setOppForm((p) => ({ ...p, problemSummary: e.target.value }))}
                placeholder="Agent responsibilities, human approval gates (payments, credit, legal), audit checks, and exception recovery..."
                className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563] resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <label className="block text-xs font-semibold text-[#0B2228]">
                  Commercial Validation Evidence (Stage 5)
                </label>
                <span className="text-[10px] text-[#43585D]">
                  Severity · Repetition · WTP · M-Pesa / Data Protection Act · Viability
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={1200}
                value={oppForm.validationEvidence}
                onChange={(e) => setOppForm((p) => ({ ...p, validationEvidence: e.target.value }))}
                placeholder="Signed design-partner agreements, paid pilots, purchase commitments, and external buyer interviews..."
                className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563] resize-none"
              />
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0B2228] cursor-pointer">
                <input
                  type="checkbox"
                  checked={oppForm.hasPaidDemandEvidence}
                  onChange={(e) =>
                    setOppForm((p) => ({ ...p, hasPaidDemandEvidence: e.target.checked }))
                  }
                  className="accent-[#0B5563]"
                />
                <span>Paid pilot, design-partner agreement, or purchase intent verified</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              {oppSaved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0B5563]">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
              <button
                type="submit"
                disabled={savingOpp}
                className="px-5 py-2.5 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
              >
                {savingOpp
                  ? 'Saving...'
                  : editingOppId
                    ? 'Update Opportunity'
                    : 'Save Opportunity'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
