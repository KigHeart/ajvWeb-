import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play } from 'lucide-react';
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
    image: '/src/assets/images/vertical_autonomous_robotics_hardware_1795692992197.jpg',
    imageAlt: 'Articulated autonomous industrial arm in workshop daylight',
  },
  {
    id: 'enterprise-compute',
    tag: 'Agentic Infrastructure',
    caption: 'Execution layers engineered for enterprise reliability.',
    image: '/src/assets/images/hero_agentic_compute_grid_1795692991510.jpg',
    imageAlt: 'Liquid-cooled AI compute clusters and optical fiber conduits',
  },
  {
    id: 'security-trust',
    tag: 'Trust & Authority',
    caption: 'Safe permissions and verifiable control for autonomous systems.',
    image: '/src/assets/images/vertical_cryptographic_hardware_1795692992377.jpg',
    imageAlt: 'Enterprise hardware security module and cryptographic authentication keys',
  },
  {
    id: 'scale-ops',
    tag: 'Production Scale',
    caption: 'Infrastructure built for real-world commercial operations.',
    image: '/src/assets/images/vertical_nairobi_datacenter_1795692578329.jpg',
    imageAlt: 'Enterprise server racks and structured optical fiber aisle',
  },
];

export function HeroCinemaReel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % REEL_FRAMES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const current = REEL_FRAMES[activeIdx];

  return (
    <div className="neu-raised p-2.5 sm:p-3.5 rounded-[28px]">
      <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2/1] w-full overflow-hidden rounded-[18px] bg-[#06262D]">
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
              className="w-full h-full object-cover"
              fallbackTitle={current.tag}
            />
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#06262D]/90 via-[#06262D]/30 to-transparent pointer-events-none"
        />

        <div className="relative z-10 p-4 sm:p-6 flex justify-end">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? 'Pause showcase reel' : 'Play showcase reel'}
            className="glass-dark w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white hover:text-[#E2C275] transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 z-10 p-4 sm:p-6 space-y-4">
          <div className="glass-dark rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-2xl">
            <span className="font-mono text-xs text-[#E2C275] shrink-0">{current.tag}</span>
            <span className="text-sm sm:text-base text-white font-medium">{current.caption}</span>
          </div>

          <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Visual showcase frames">
            {REEL_FRAMES.map((frame, idx) => {
              const active = idx === activeIdx;
              return (
                <button
                  key={frame.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveIdx(idx);
                    setIsPlaying(false);
                  }}
                  aria-label={frame.tag}
                  className="py-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E2C275]"
                >
                  <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
                    {active ? (
                      <motion.div
                        key={`${frame.id}-${isPlaying}`}
                        initial={{ scaleX: isPlaying ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: isPlaying ? 4.5 : 0.2, ease: 'linear' }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full w-full bg-[#E2C275]"
                      />
                    ) : (
                      <div className="h-full w-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
