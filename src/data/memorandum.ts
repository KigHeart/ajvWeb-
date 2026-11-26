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
    image: '/src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise server racks and structured fiber-optic infrastructure aisle',
  },
  {
    id: 'security',
    title: 'Security & Trust',
    allocation: '20%',
    summary: 'Cryptographic identity, scoped authority, policy enforcement, and financial controls.',
    image: '/src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Enterprise hardware security module and cryptographic authentication keys',
  },
  {
    id: 'enterprise',
    title: 'Vertical Autonomous Enterprises',
    allocation: '35%',
    summary: 'Autonomous financial operations, industrial engineering, logistics, and scientific workflows.',
    image: '/src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Articulated industrial robotic arm and autonomous optical inspection rig',
  },
  {
    id: 'compute',
    title: 'Agentic Compute & Data',
    allocation: '10%',
    summary: 'Inference optimisation, specialised workload routing, and high-integrity data systems.',
    image: '/src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'High-density liquid-cooled AI compute cluster and optical conduits',
  },
  {
    id: 'emerging',
    title: 'Emerging Technologies',
    allocation: '10%',
    summary: 'Frontier autonomous primitives maturing alongside enterprise agent capability.',
    image: '/src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'Frontier AI compute and autonomous orchestration infrastructure',
  },
];
