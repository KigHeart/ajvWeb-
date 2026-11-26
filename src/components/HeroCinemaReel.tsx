import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, ArrowRight } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface ReelScene {
  id: string;
  label: string;
  headline: string;
  metricLabel: string;
  metricValue: string;
  flowFrom: string;
  flowMid: string;
  flowTo: string;
  image: string;
  imageAlt: string;
  objectPosition: string;
}

const REEL_SCENES: ReelScene[] = [
  {
    id: 'inflow',
    label: '01 · Capital In',
    headline: 'LP Commitments Enter Fund I',
    metricLabel: 'Target Fund I',
    metricValue: '$10.0M',
    flowFrom: 'Anchor ($3–5M) + Closes',
    flowMid: '$10.0M Pool',
    flowTo: '12–15 Companies',
    image: '/src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'High-density AI compute clusters with liquid cooling manifolds and optical fiber bundles',
    objectPosition: 'object-center',
  },
  {
    id: 'origination',
    label: '02 · Allocation Out',
    headline: 'Initial Deployment & Reserves',
    metricLabel: 'Initial + Reserves',
    metricValue: '$5.5M / $3.5M',
    flowFrom: '$5.5M Initial Capital',
    flowMid: '$4.125M VC · $1.375M Studio',
    flowTo: '$3.5M Follow-On',
    image: '/src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise data center racks and structured optical fiber routing aisle',
    objectPosition: 'object-center',
  },
  {
    id: 'infra',
    label: '03 · Agentic Stack',
    headline: 'Infrastructure & Cryptographic Trust',
    metricLabel: 'Stack Exposure',
    metricValue: '45% ($4.5M)',
    flowFrom: '25% Infra ($2.5M)',
    flowMid: '20% Security ($2.0M)',
    flowTo: '10% Compute ($1.0M)',
    image: '/src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Hardware security module board and cryptographic authentication keys on slate',
    objectPosition: 'object-center',
  },
  {
    id: 'enterprise',
    label: '04 · Real Economy',
    headline: 'Autonomous Production & Robotics',
    metricLabel: 'Enterprise Mandate',
    metricValue: '35% ($3.5M)',
    flowFrom: '35% Vertical Systems',
    flowMid: '10% Emerging ($1.0M)',
    flowTo: 'Realised Exits',
    image: '/src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Articulated autonomous industrial robotic arm with optical inspection sensor',
    objectPosition: 'object-center',
  },
];

export function HeroCinemaReel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % REEL_SCENES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const current = REEL_SCENES[activeIdx];

  return (
    <div className="neu-raised p-2.5 sm:p-3.5 rounded-[28px]">
      <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2/1] w-full overflow-hidden rounded-[18px] bg-[#06262D]">
        {/* Animated Cross-Fading Ken Burns Photography Layer */}
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 4.8, ease: 'linear' },
            }}
            className="absolute inset-0"
          >
            <ResilientImage
              src={current.image}
              alt={current.imageAlt}
              className={`w-full h-full object-cover ${current.objectPosition}`}
              fallbackTitle={current.headline}
            />
          </motion.div>
        </AnimatePresence>

        {/* Measured Contrast Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#06262D]/95 via-[#06262D]/45 to-[#06262D]/20 pointer-events-none"
        />

        {/* Top Bar Inside Reel: Active Scene Metric + Play/Pause Control */}
        <div className="relative z-10 p-4 sm:p-6 flex items-start justify-between gap-4">
          <div className="glass-dark rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="font-mono text-[10px] sm:text-[11px] text-[#E2C275] uppercase tracking-wider">
              {current.metricLabel}
            </div>
            <div className="font-display text-xl sm:text-3xl font-semibold text-white tabular-nums tracking-[-0.03em]">
              {current.metricValue}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? 'Pause overview reel' : 'Play overview reel'}
            className="glass-dark w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white hover:text-[#E2C275] transition-colors cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom Animated Capital-Flow & Agentic Numbers HUD */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-4 sm:p-6 space-y-4">
          <div className="glass-dark rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-[#E2C275] mb-1">{current.label}</div>
              <div className="font-display text-lg sm:text-2xl font-semibold text-white tracking-[-0.02em]">
                {current.headline}
              </div>
            </div>

            {/* Animated Capital Flow Pipeline */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 text-xs font-mono tabular-nums">
              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/15 whitespace-nowrap">
                {current.flowFrom}
              </span>

              <motion.span
                key={`${current.id}-arrow-1`}
                initial={{ opacity: 0.35, x: -3 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[#E2C275] shrink-0"
                aria-hidden="true"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>

              <span className="px-3 py-1.5 rounded-lg bg-[#0E6272]/80 text-white border border-[#E2C275]/40 whitespace-nowrap font-medium">
                {current.flowMid}
              </span>

              <motion.span
                key={`${current.id}-arrow-2`}
                initial={{ opacity: 0.35, x: -3 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-[#E2C275] shrink-0"
                aria-hidden="true"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>

              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-[#E2C275] border border-white/15 whitespace-nowrap">
                {current.flowTo}
              </span>
            </div>
          </div>

          {/* Interactive 4-Scene Timeline Selector */}
          <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Fund overview scenes">
            {REEL_SCENES.map((scene, idx) => {
              const active = idx === activeIdx;
              return (
                <button
                  key={scene.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveIdx(idx);
                    setIsPlaying(false);
                  }}
                  className="text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E2C275]"
                >
                  <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden mb-1.5">
                    {active ? (
                      <motion.div
                        key={`${scene.id}-${isPlaying}`}
                        initial={{ scaleX: isPlaying ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: isPlaying ? 4.5 : 0.2, ease: 'linear' }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full w-full bg-[#E2C275]"
                      />
                    ) : (
                      <div className="h-full w-0 bg-[#E2C275]" />
                    )}
                  </div>
                  <span
                    className={`hidden sm:block font-mono text-[10px] truncate transition-colors ${
                      active ? 'text-white' : 'text-white/60 group-hover:text-white/90'
                    }`}
                  >
                    {scene.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
