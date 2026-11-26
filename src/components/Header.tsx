import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenInquiry: () => void;
}

const NAV_LINKS = [
  { label: 'Thesis', href: '#thesis' },
  { label: 'Focus', href: '#focus' },
  { label: 'Fund I', href: '#fund-i' },
];

export function Header({ onOpenInquiry }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1240px] mx-auto glass-light rounded-2xl px-6 h-15 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#0B2228] whitespace-nowrap shrink-0"
        >
          Ajentir Ventures
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-10 text-sm font-medium text-[#43585D]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 hover:text-[#0B2228] transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenInquiry}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-xs font-semibold tracking-wide text-white neu-btn-teal rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inquire
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-[#0B2228] rounded-xl cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden max-w-[1240px] mx-auto mt-2 glass-light rounded-2xl px-6 py-5 space-y-4">
          <nav aria-label="Mobile" className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-base font-medium text-[#0B2228]"
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
            className="w-full py-3 px-4 text-sm font-semibold text-white neu-btn-teal rounded-xl cursor-pointer"
          >
            Inquire
          </button>
        </div>
      )}
    </header>
  );
}
