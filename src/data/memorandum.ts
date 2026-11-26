export interface InvestmentVertical {
  roman: string;
  title: string;
  sharePercent: number;
  allocation: string;
  description: string;
  image?: string;
  imageAlt?: string;
}

export const INSTITUTION_META = {
  name: 'Ajentir Ventures',
  tagline: 'Investing in the Autonomous Economy',
  fundName: 'Fund I',
  targetSize: '$10M',
  founder: 'Kiprop arap Yego',
  headquarters: 'Nairobi, Kenya',
  date: 'November 2026',
  logoSrc: '/assets/aistudio/AJENTIR_Ventures_Turquoise_Gold_Logo_c1541649.png',
};

export const INVESTMENT_VERTICALS: InvestmentVertical[] = [
  {
    roman: 'I',
    title: 'Agentic Infrastructure',
    sharePercent: 25,
    allocation: '$2.5m',
    description:
      'Runtime orchestration, memory, distributed execution, scheduling, and multi-agent observability.',
    image: '/src/assets/images/vertical_infrastructure_system_1795689826633.jpg',
    imageAlt: 'Slate-teal and brushed brass distributed compute rack architecture',
  },
  {
    roman: 'II',
    title: 'Security & Trust',
    sharePercent: 20,
    allocation: '$2.0m',
    description:
      'Cryptographic identity, scoped authority, policy enforcement, auditability, and financial controls.',
    image: '/src/assets/images/vertical_cryptographic_trust_1795689826762.jpg',
    imageAlt: 'Machined brass and smoked quartz hardware attestation module on limestone',
  },
  {
    roman: 'III',
    title: 'Vertical Autonomous Enterprises',
    sharePercent: 35,
    allocation: '$3.5m',
    description:
      'Autonomous financial operations, industrial engineering, logistics, cybersecurity, and scientific workflows.',
    image: '/src/assets/images/vertical_autonomous_enterprise_1795689827169.jpg',
    imageAlt: 'Automated precision engineering and scientific instrumentation bay',
  },
  {
    roman: 'IV',
    title: 'Agentic Compute & Data',
    sharePercent: 10,
    allocation: '$1.0m',
    description:
      'Inference optimisation, specialised compute routing, and high-integrity data systems.',
  },
  {
    roman: 'V',
    title: 'Emerging Technologies',
    sharePercent: 10,
    allocation: '$1.0m',
    description:
      'Frontier autonomous primitives and coordination systems maturing alongside agent capability.',
  },
];

export const TECHNICAL_PILLARS = [
  'Capability',
  'Reliability',
  'Autonomy',
  'Authority',
  'Security',
  'Verification',
  'Economics',
  'Defensibility',
];

export const FUND_ALLOCATION = [
  { label: 'Initial Investments', detail: '12–15 companies across external VC & studio', amount: '$5.5m', share: 55 },
  { label: 'Follow-On Reserves', detail: 'Performance-gated support for breakout holdings', amount: '$3.5m', share: 35 },
  { label: 'Fund Operations', detail: 'Legal, administration, audit, and compliance', amount: '$1.0m', share: 10 },
];
