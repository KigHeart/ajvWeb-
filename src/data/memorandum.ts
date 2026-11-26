export interface FocusArea {
  id: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
}

export type InquiryLane = 'founder' | 'training' | 'partner';
export type FounderTrack = 'investment' | 'incubation';
export type TrainingFocus = 'governance' | 'workflow' | 'workshop';
export type PartnerType = 'model-provider' | 'bank' | 'enterprise';

export interface InquiryPreset {
  lane: InquiryLane;
  founderTrack?: FounderTrack;
  trainingFocus?: TrainingFocus;
  partnerType?: PartnerType;
}

export interface OfferingItem {
  id: 'investment' | 'incubation' | 'training' | 'partnerships';
  title: string;
  summary: string;
  ctaLabel: string;
  brief: {
    kicker: string;
    format: string;
    points: { label: string; text: string }[];
  };
  preset: InquiryPreset;
}

export const BRAND_META = {
  name: 'Ajentir Ventures',
  year: '2026',
  logoEmblemSrc: '/assets/ajv-halo-emblem.png',
};

export const OFFERINGS: OfferingItem[] = [
  {
    id: 'investment',
    title: 'Venture Investment',
    summary:
      'Backing startups automating finance, operations, and supply workflows for underserved SMEs and enterprises.',
    ctaLabel: 'Investment brief',
    brief: {
      kicker: 'Direct Venture Backing',
      format: 'Early-stage teams building production agentic software for SMEs',
      points: [
        {
          label: 'Who it is for',
          text: 'Technical founders replacing manual finance, compliance, procurement, and customer operations.',
        },
        {
          label: 'What we look for',
          text: 'Workflows grounded in real commercial channels—chat, mobile money, invoicing, and enterprise systems.',
        },
        {
          label: 'Beyond capital',
          text: 'Warm introductions to SME buyers, partner bank pilots, and pooled model-provider compute.',
        },
      ],
    },
    preset: { lane: 'founder', founderTrack: 'investment' },
  },
  {
    id: 'incubation',
    title: 'Idea Incubation',
    summary:
      'Working alongside technical builders to turn promising agentic AI concepts into demand-backed companies.',
    ctaLabel: 'Incubation brief',
    brief: {
      kicker: 'Demand-Backed Incubation',
      format: 'From validated SME bottleneck to incorporated, production-ready venture',
      points: [
        {
          label: 'Who it is for',
          text: 'Engineers, operators, and domain specialists with a sharp thesis before company formation.',
        },
        {
          label: 'Design-partner model',
          text: 'We pair incubated concepts with an active SME or financial institution early to validate real willingness to pay.',
        },
        {
          label: 'Technical foundation',
          text: 'Shared infrastructure credits, compliance guardrails, and architectural review from day one.',
        },
      ],
    },
    preset: { lane: 'founder', founderTrack: 'incubation' },
  },
  {
    id: 'training',
    title: 'Executive Training',
    summary:
      'Practical briefings equipping SME executives to govern shadow AI and deploy agentic systems safely.',
    ctaLabel: 'Training brief',
    brief: {
      kicker: 'SME Leadership Readiness',
      format: 'Half-day leadership briefings and hands-on workflow clinics',
      points: [
        {
          label: 'Governance & risk',
          text: 'Closing the gap between informal staff AI usage, formal policy, and data-protection readiness.',
        },
        {
          label: 'Practical workflows',
          text: 'Identifying high-return automation across reconciliation, customer operations, inventory, and compliance.',
        },
        {
          label: 'Outcome',
          text: 'Clear 90-day adoption roadmap with defined ownership, guardrails, and vendor selection criteria.',
        },
      ],
    },
    preset: { lane: 'training', trainingFocus: 'governance' },
  },
  {
    id: 'partnerships',
    title: 'Strategic Partnerships',
    summary:
      'Collaborating with AI model providers, banks, and enterprise networks to scale trusted deployment.',
    ctaLabel: 'Partnership brief',
    brief: {
      kicker: 'Ecosystem & Infrastructure',
      format: 'Structured alliances with model labs, commercial banks, and enterprise operators',
      points: [
        {
          label: 'AI model providers',
          text: 'Pooled API and inference credits plus structured SME distribution for curated startups.',
        },
        {
          label: 'Commercial banks',
          text: 'Controlled sandbox pilots for credit underwriting, trade finance, and compliance workflows.',
        },
        {
          label: 'Enterprise networks',
          text: 'Joint workflow discovery linking industry groups with audited, production-grade agentic tools.',
        },
      ],
    },
    preset: { lane: 'partner', partnerType: 'bank' },
  },
];

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'sme',
    title: 'SME Automation',
    summary:
      'Autonomous operations, finance, and workflows built for underserved small and mid-sized businesses.',
    image: '/src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Automated industrial system in workshop daylight',
  },
  {
    id: 'infrastructure',
    title: 'Agentic Infrastructure',
    summary:
      'Reliable runtime, orchestration, and execution layers designed for real enterprise environments.',
    image: '/src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise server racks and fiber infrastructure',
  },
  {
    id: 'security',
    title: 'Security & Trust',
    summary:
      'Identity, permissions, and verifiable controls so enterprises can safely delegate work to agents.',
    image: '/src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Enterprise cryptographic security hardware and authentication keys',
  },
  {
    id: 'compute',
    title: 'Applied Autonomy',
    summary:
      'High-efficiency compute and execution systems turning intelligence into dependable output.',
    image: '/src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'High-density AI compute clusters and optical fiber conduits',
  },
];
