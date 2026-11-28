/**
 * Site memorandum: brand metadata, focus areas, offerings and inquiry types.
 *
 * RECONSTRUCTED: the original of this module was never committed (the root
 * .gitignore pattern `data/` matched `src/data/`). This file was rebuilt from
 * how the components consume it and from copy already on the site. Its types
 * are exact; its marketing copy is inferred and must be reviewed by the
 * owner against the original before it is treated as final.
 */

export type InquiryLane = 'founder' | 'training' | 'partner';

export type FounderTrack = 'investment' | 'incubation';
export type TrainingFocus = 'governance' | 'workflow' | 'workshop';
export type PartnerType = 'discovery' | 'bank' | 'model-provider' | 'enterprise';

export interface InquiryPreset {
  lane: InquiryLane;
  founderTrack?: FounderTrack;
  trainingFocus?: TrainingFocus;
  partnerType?: PartnerType;
}

export interface OfferingBriefPoint {
  label: string;
  text: string;
}

export interface OfferingItem {
  id: string;
  title: string;
  summary: string;
  ctaLabel: string;
  preset: InquiryPreset;
  brief: {
    kicker: string;
    format: string;
    points: OfferingBriefPoint[];
  };
}

export interface FocusArea {
  id: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
}

export const BRAND_META = {
  name: 'Ajentir Ventures',
  year: 2026,
  logoEmblemSrc: 'assets/ajv-halo-emblem.png',
} as const;

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'sme-automation',
    title: 'SME workflow automation',
    summary:
      'Autonomous workflows across finance, compliance and customer channels for small and mid-sized businesses that large-enterprise tooling does not serve.',
    image: 'src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Articulated autonomous industrial arm in workshop daylight',
  },
  {
    id: 'agentic-infrastructure',
    title: 'Agentic infrastructure',
    summary:
      'Execution layers engineered for enterprise reliability: orchestration, memory and tooling that agentic software depends on.',
    image: 'src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'Liquid-cooled AI compute clusters and optical fiber conduits',
  },
  {
    id: 'trust-and-authority',
    title: 'Trust and authority',
    summary:
      'Safe permissions and verifiable control for autonomous systems, so agents act only within the authority they were given.',
    image: 'src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Enterprise hardware security module and cryptographic authentication keys',
  },
  {
    id: 'production-scale',
    title: 'Production scale',
    summary:
      'Infrastructure built for real-world commercial operations, with regulated sandbox pilots before wider rollout.',
    image: 'src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise server racks and structured optical fiber aisle',
  },
];

export const OFFERINGS: OfferingItem[] = [
  {
    id: 'investment',
    title: 'Venture Investment',
    summary:
      'Capital for agentic AI ventures built on workflow problems that repeat across organisations and have evidenced demand.',
    ctaLabel: 'Discuss investment',
    preset: { lane: 'founder', founderTrack: 'investment' },
    brief: {
      kicker: 'Founders',
      format: 'Demand-backed investment in agentic AI ventures for underserved SMEs.',
      points: [
        {
          label: 'What we look for',
          text: 'A repeatable workflow problem, a clear agentic approach and evidence that customers will pay.',
        },
        {
          label: 'How we decide',
          text: 'Opportunities are scored on problem severity, repeatability, willingness to pay, agentic suitability, scalability, feasibility and fit.',
        },
        {
          label: 'Next step',
          text: 'Send a short summary of the workflow you automate and your current stage.',
        },
      ],
    },
  },
  {
    id: 'incubation',
    title: 'Idea Incubation',
    summary:
      'Incubated builders paired with early design partners before spinout.',
    ctaLabel: 'Apply to incubate',
    preset: { lane: 'founder', founderTrack: 'incubation' },
    brief: {
      kicker: 'Builders',
      format: 'Incubation for ideas grounded in real operational workflows.',
      points: [
        {
          label: 'Design partners',
          text: 'Builders work alongside organisations whose workflows were mapped and decomposed first.',
        },
        {
          label: 'Before spinout',
          text: 'Ideas are validated against paid pilots or signed design-partner commitments.',
        },
        {
          label: 'Next step',
          text: 'Describe the workflow, your team and the stage of the idea.',
        },
      ],
    },
  },
  {
    id: 'discovery',
    title: 'Workflow Discovery',
    summary:
      'We map operations end to end, find the constraints that limit performance and identify where agentic AI changes the outcome.',
    ctaLabel: 'Start discovery',
    preset: { lane: 'partner', partnerType: 'discovery' },
    brief: {
      kicker: 'Organisations',
      format: 'End-to-end workflow mapping for a partner organisation.',
      points: [
        {
          label: 'Map',
          text: 'Decompose a workflow step by step, with owners, handoffs and constraints.',
        },
        {
          label: 'Intervene',
          text: 'For each step: eliminate, simplify, augment, delegate or reconstruct.',
        },
        {
          label: 'Outcome',
          text: 'A ranked set of opportunities, from internal transformation to replicable products and new ventures.',
        },
      ],
    },
  },
  {
    id: 'training',
    title: 'Executive Training',
    summary:
      'Briefings and workshops that equip SME leaders to govern shadow AI safely.',
    ctaLabel: 'Request a briefing',
    preset: { lane: 'training', trainingFocus: 'governance' },
    brief: {
      kicker: 'SME leaders',
      format: 'Executive briefings and workshops on AI governance and SME workflows.',
      points: [
        {
          label: 'Governance and risk',
          text: 'Policies and controls for AI already in use inside the business.',
        },
        {
          label: 'SME workflows',
          text: 'Where autonomous workflows fit finance, compliance and customer channels.',
        },
        {
          label: 'Format',
          text: 'Executive workshop or briefing for your leadership team.',
        },
      ],
    },
  },
  {
    id: 'partnerships',
    title: 'Ecosystem Partnerships',
    summary:
      'Model providers, banks and operators connected so trusted agentic software reaches production faster.',
    ctaLabel: 'Partner with us',
    preset: { lane: 'partner', partnerType: 'bank' },
    brief: {
      kicker: 'Partners',
      format: 'Sandbox pilots and pooled compute for the agentic ecosystem.',
      points: [
        {
          label: 'Banks and financial institutions',
          text: 'Regulated sandbox pilots and underwriting for agentic software.',
        },
        {
          label: 'AI model providers',
          text: 'Pooled compute credits and distribution to SMEs.',
        },
        {
          label: 'Enterprise networks',
          text: 'Introductions to operators with workflows worth mapping.',
        },
      ],
    },
  },
];
