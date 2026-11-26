export interface FocusArea {
  id: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
}

export const BRAND_META = {
  name: 'Ajentir Ventures',
  year: '2026',
  logoEmblemSrc: '/assets/ajv-halo-emblem.png',
};

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'sme',
    title: 'SME Automation',
    summary: 'Autonomous operations, finance, and workflows built for underserved small and mid-sized businesses.',
    image: '/src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Automated industrial system in workshop daylight',
  },
  {
    id: 'infrastructure',
    title: 'Agentic Infrastructure',
    summary: 'Reliable runtime, orchestration, and execution layers designed for real enterprise environments.',
    image: '/src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise server racks and fiber infrastructure',
  },
  {
    id: 'security',
    title: 'Security & Trust',
    summary: 'Identity, permissions, and verifiable controls so enterprises can safely delegate work to agents.',
    image: '/src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Enterprise cryptographic security hardware and authentication keys',
  },
  {
    id: 'compute',
    title: 'Applied Autonomy',
    summary: 'High-efficiency compute and execution systems turning intelligence into dependable output.',
    image: '/src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'High-density AI compute clusters and optical fiber conduits',
  },
];
