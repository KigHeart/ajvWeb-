import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ResilientImage } from './ResilientImage';

interface ReelFrame {
  id: string;
  tag: string;
  caption: string;
  image: string;
  imageAlt: string;
}

const REEL_FRAMES: ReelFrame[] = [
  {
    id: 'sme-automation',
    tag: 'SME Automation',
    caption: 'Bringing autonomous workflows to underserved businesses.',
    image: 'src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Articulated autonomous industrial arm in workshop daylight',
  },
  {
    id: 'enterprise-compute',
    tag: 'Agentic Infrastructure',
    caption: 'Execution layers engineered for enterprise reliability.',
    image: 'src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'Liquid-cooled AI compute clusters and optical fiber conduits',
  },
  {
    id: 'security-trust',
    tag: 'Trust & Authority',
    caption: 'Safe permissions and verifiable control for autonomous systems.',
    image: 'src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Enterprise hardware security module and cryptographic authentication keys',
  },
  {
    id: 'scale-ops',
    tag: 'Production Scale',
    caption: 'Infrastructure built for real-world commercial operations.',
    image: 'src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise server racks and structured optical fiber aisle',
  },
];

export function HeroCinemaReel() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % REEL_FRAMES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const current = REEL_FRAMES[activeIdx];

  return (
    <div className="neu-raised p-2.5 sm:p-3 rounded-[26px]">
      <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2/1] w-full overflow-hidden rounded-[16px] bg-[#06262D]">
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 4.8, ease: 'linear' },
            }}
            className="absolute inset-0"
          >
            <ResilientImage
              src={current.image}
              alt={current.imageAlt}
              className="w-full h-full object-cover"
              fallbackTitle={current.tag}
            />
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#06262D]/85 via-[#06262D]/20 to-transparent pointer-events-none"
        />

        {/* Subtle ambient autonomous routing constellation (no tabs or progress lines) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 220 120"
          fill="none"
          className="hidden sm:block absolute top-5 right-5 w-44 h-24 opacity-65 pointer-events-none"
        >
          <path
            d="M20 88 C68 84, 92 38, 138 42 C164 44, 182 24, 198 22"
            stroke="rgba(226,194,117,0.45)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <path
            d="M38 30 C76 34, 102 68, 154 74 C174 76, 188 64, 198 54"
            stroke="rgba(214,226,228,0.35)"
            strokeWidth="1"
          />
          <motion.circle
            cx="138"
            cy="42"
            r="3.2"
            fill="#E2C275"
            animate={{ opacity: [0.45, 1, 0.45], r: [2.8, 3.8, 2.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="198"
            cy="22"
            r="2.6"
            fill="#F5F7F7"
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />
          <motion.circle
            cx="38"
            cy="30"
            r="2.4"
            fill="#E2C275"
            animate={{ opacity: [0.3, 0.85, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
          />
        </svg>

        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-dark rounded-xl px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3"
            >
              <span className="font-display text-xs font-semibold text-[#E2C275] shrink-0">
                {current.tag}
              </span>
              <span className="hidden sm:inline text-white/35" aria-hidden="true">
                ·
              </span>
              <span className="text-xs sm:text-sm text-white/95 font-medium">
                {current.caption}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
