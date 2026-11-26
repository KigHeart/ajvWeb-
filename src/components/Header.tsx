import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenInquiry: () => void;
}

const NAV_LINKS = [
  { label: 'Approach', href: '#approach' },
  { label: 'Focus', href: '#focus' },
  { label: 'Fund I', href: '#fund-i' },
  { label: 'Governance', href: '#governance' },
];

export function Header({ onOpenInquiry }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E2DFD7]">
      <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#0E2024] whitespace-nowrap shrink-0"
        >
          Ajentir Ventures
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4B5D61]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-[#0E2024] hover:border-[#B5862A] transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenInquiry}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-xs font-semibold tracking-wide text-white bg-[#0B5563] hover:bg-[#073D47] rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Request LP Brief
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-[#0E2024] hover:bg-[#F2F0EB] rounded transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2DFD7] bg-[#FAF9F6] px-6 py-5 space-y-4">
          <nav aria-label="Mobile" className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-base font-medium text-[#0E2024] border-b border-[#E2DFD7]/60"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenInquiry();
            }}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#0B5563] hover:bg-[#073D47] rounded transition-colors cursor-pointer"
          >
            Request LP Brief
          </button>
        </div>
      )}
    </header>
  );
}
