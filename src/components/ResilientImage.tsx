import { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackTitle }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-[#EEF1EE] border border-[#DDE2DF] text-[#0B5563] p-8 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className="mb-3 opacity-70"
        >
          <circle cx="24" cy="24" r="18" stroke="#0B5563" strokeWidth="1.25" />
          <ellipse cx="24" cy="24" rx="22" ry="9" transform="rotate(-22 24 24)" stroke="#B5862A" strokeWidth="1.25" />
          <circle cx="32" cy="11" r="2.5" fill="#B5862A" />
        </svg>
        <span className="font-display font-semibold text-base text-[#0E2024]">{fallbackTitle || 'Ajentir Ventures'}</span>
        <span className="mt-1 text-xs text-[#4B5D61] max-w-xs">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
