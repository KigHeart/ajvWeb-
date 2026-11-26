export interface FocusVertical {
  id: string;
  title: string;
  allocation: string;
  summary: string;
  image: string;
  imageAlt: string;
}

export const INSTITUTION_META = {
  name: 'Ajentir Ventures',
  tagline: 'Investing in the Autonomous Economy',
  founder: 'Kiprop arap Yego',
  headquarters: 'Nairobi, Kenya',
  year: '2026',
  logoSrc: '/assets/aistudio/AJENTIR_Ventures_Turquoise_Gold_Logo_c1541649.png',
};

export const FOCUS_VERTICALS: FocusVertical[] = [
  {
    id: 'infrastructure',
    title: 'Agentic Infrastructure',
    allocation: '25%',
    summary: 'Runtime orchestration, memory, distributed execution, and multi-agent observability.',
    image: '/src/assets/images/vertical_infrastructure_system_1795689826633.jpg',
    imageAlt: 'Distributed compute and runtime infrastructure architecture',
  },
  {
    id: 'security',
    title: 'Security & Trust',
    allocation: '20%',
    summary: 'Cryptographic identity, scoped authority, policy enforcement, and financial controls.',
    image: '/src/assets/images/vertical_cryptographic_trust_1795689826762.jpg',
    imageAlt: 'Precision cryptographic hardware attestation module',
  },
  {
    id: 'enterprise',
    title: 'Vertical Autonomous Enterprises',
    allocation: '35%',
    summary: 'Autonomous financial operations, industrial engineering, logistics, and scientific workflows.',
    image: '/src/assets/images/vertical_autonomous_enterprise_1795689827169.jpg',
    imageAlt: 'Automated precision engineering and instrumentation studio',
  },
  {
    id: 'compute',
    title: 'Agentic Compute & Data',
    allocation: '10%',
    summary: 'Inference optimisation, specialised workload routing, and high-integrity data systems.',
    image: '/src/assets/images/vertical_infrastructure_system_1795689826633.jpg',
    imageAlt: 'Specialised inference and compute architecture',
  },
  {
    id: 'emerging',
    title: 'Emerging Technologies',
    allocation: '10%',
    summary: 'Frontier autonomous primitives maturing alongside enterprise agent capability.',
    image: '/src/assets/images/hero_agentic_systems_1795692350262.jpg',
    imageAlt: 'Multi-layer autonomous agent orchestration and compute architecture',
  },
];
