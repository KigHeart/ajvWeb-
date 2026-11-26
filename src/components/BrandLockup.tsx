import { BRAND_META } from '../data/memorandum';
import { ResilientImage } from './ResilientImage';

interface BrandLockupProps {
  size?: 'hero' | 'footer';
}

export function BrandLockup({ size = 'hero' }: BrandLockupProps) {
  const isHero = size === 'hero';

  return (
    <div className="inline-flex flex-col items-center text-center select-none">
      <ResilientImage
        src={BRAND_META.logoEmblemSrc}
        alt="ajv — Ajentir Ventures"
        className={isHero ? 'h-16 sm:h-20 w-auto object-contain' : 'h-11 w-auto object-contain'}
        fallbackTitle="ajv"
      />
      <div
        className={`mt-2 flex items-center gap-1.5 font-display font-semibold tracking-[0.18em] uppercase ${
          isHero ? 'text-xs sm:text-sm' : 'text-[10px]'
        }`}
      >
        <span className="text-[#0B5563]">Ajentir</span>
        <span className="text-[#B5862A]">Ventures</span>
      </div>
    </div>
  );
}
