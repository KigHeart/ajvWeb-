import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Download, Plus, Trash2 } from 'lucide-react';
import {
  computeOpportunityScore,
  deleteDiscoveryOrg,
  deleteVentureOpportunity,
  DISCOVERY_SECTORS,
  exportOpportunitiesToCsv,
  getScoreThresholdLabel,
  INTERVENTIONS,
  OPPORTUNITY_CATEGORIES,
  ORG_STATUSES,
  PIPELINE_STAGES,
  saveDiscoveryOrg,
  saveVentureOpportunity,
  SCORECARD_CRITERIA,
  subscribeToDiscoveryOrgs,
  subscribeToVentureOpportunities,
  type DiscoveryOrgRecord,
  type DiscoveryOrgStatus,
  type DiscoverySector,
  type OpportunityCategory,
  type PipelineStage,
  type VentureOpportunityRecord,
  type WorkflowIntervention,
} from '../lib/discovery';

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

export function DiscoveryWorkspace() {
  const [subView, setSubView] = useState<SubView>('opportunities');
  const [orgs, setOrgs] = useState<DiscoveryOrgRecord[]>([]);
  const [opps, setOpps] = useState<VentureOpportunityRecord[]>([]);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const unsubOrgs = subscribeToDiscoveryOrgs(
      (items) => setOrgs(items),
      () => setError('Unable to load discovery organisations.'),
    );
    const unsubOpps = subscribeToVentureOpportunities(
      (items) => setOpps(items),
      () => setError('Unable to load venture opportunities.'),
    );
    return () => {
      unsubOrgs();
      unsubOpps();
    };
  }, []);

  const sortedOpps = useMemo(() => {
    return [...opps].sort((a, b) => computeOpportunityScore(b) - computeOpportunityScore(a));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save opportunity.');
    } finally {
      setSavingOpp(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 neu-pressed rounded-xl">
          <button
            type="button"
            onClick={() => setSubView('opportunities')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subView === 'orgs'
                ? 'neu-raised-sm text-[#0B2228]'
                : 'text-[#43585D] hover:text-[#0B2228]'
            }`}
          >
            01–02 Organisations &amp; Workflows ({orgs.length})
          </button>
        </div>

        {subView === 'opportunities' && (
          <button
            type="button"
            disabled={sortedOpps.length === 0}
            onClick={() => exportOpportunitiesToCsv(sortedOpps)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B2228] neu-raised-sm rounded-xl hover:text-[#0B5563] disabled:opacity-45 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Scorecard CSV</span>
          </button>
        )}
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

            {orgs.map((org) => {
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
                  <p className="text-xs text-[#43585D] truncate">{org.sector}</p>
                </button>
              );
            })}
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
                    void deleteDiscoveryOrg(editingOrgId);
                    setEditingOrgId(null);
                    setOrgForm(EMPTY_ORG);
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
              <label className="block text-xs font-semibold text-[#0B2228] mb-1">
                Workflow Inventory &amp; Baseline Friction
              </label>
              <textarea
                rows={4}
                maxLength={3000}
                value={orgForm.workflowsSummary}
                onChange={(e) => setOrgForm((p) => ({ ...p, workflowsSummary: e.target.value }))}
                placeholder="Document triggers, actors, manual handoffs, exception rates, turnaround delays, and transaction costs..."
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

            {sortedOpps.map((opp) => {
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
                    <span className="font-mono text-xs font-semibold text-[#0B5563] shrink-0">
                      {total}/100
                    </span>
                  </div>
                  <p className="text-xs text-[#43585D] truncate">
                    {opp.category.split(' — ')[0]} · {opp.pipelineStage}
                    {opp.orgName ? ` · ${opp.orgName}` : ''}
                  </p>
                </button>
              );
            })}
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
                <p className="text-[11px] font-medium text-[#0B5563] mt-0.5">
                  Score: <span className="font-mono font-semibold">{currentScore}/100</span> ·{' '}
                  {scoreMeta.tier}
                </p>
              </div>
              {editingOppId && (
                <button
                  type="button"
                  onClick={() => {
                    void deleteVentureOpportunity(editingOppId);
                    setEditingOppId(null);
                    setOppForm(EMPTY_OPP);
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
                        <span className="font-mono font-semibold text-[#0B2228]">
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
                placeholder="Repeatable workflow pain, agent authority limits, human approvals, and M-Pesa / Data Protection considerations..."
                className="w-full px-3 py-2 text-xs bg-white/75 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#0B2228]">
                Commercial Validation Evidence
              </label>
              <textarea
                rows={2}
                maxLength={1200}
                value={oppForm.validationEvidence}
                onChange={(e) => setOppForm((p) => ({ ...p, validationEvidence: e.target.value }))}
                placeholder="Signed design-partner agreements, paid pilots, purchase commitments, or external buyer interviews..."
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
