import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenInquiry: () => void;
}

const NAV_LINKS = [
  { id: 'what-we-do', label: 'What We Do', href: '#what-we-do' },
  { id: 'venture-discovery', label: 'Venture Discovery', href: '#venture-discovery' },
  { id: 'venture-desk', label: 'Venture Desk', href: `${import.meta.env.BASE_URL}?view=venture-desk` },
  { id: 'focus', label: 'Focus', href: '#focus' },
  { id: 'approach', label: 'Approach', href: '#approach' },
];

export function Header({ onOpenInquiry }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / docHeight)));
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-35% 0px -50% 0px' },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-3 z-40 px-4 sm:px-6 lg:px-10">
      <div className="relative max-w-[1200px] mx-auto glass-light rounded-2xl px-6 h-15 flex items-center justify-between gap-8 overflow-hidden">
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#0B2228] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0B5563]"
        >
          <img
            src="assets/ajv-halo-emblem.png"
            alt=""
            aria-hidden="true"
            className="h-6 w-auto object-contain shrink-0"
          />
          <span>Ajentir Ventures</span>
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-10 text-sm font-medium text-[#43585D]"
        >
          {NAV_LINKS.map((link) => {
            const active = activeId === link.id;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors duration-150 ${
                  active
                    ? 'text-[#0B2228] border-[#B5862A]'
                    : 'border-transparent hover:text-[#0B2228]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
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

        {/* Subtle reading progress hairline */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent pointer-events-none"
        >
          <div
            className="h-full bg-gradient-to-r from-[#0B5563] to-[#C89B3C] origin-left transition-transform duration-150"
            style={{ transform: `scaleX(${scrollProgress})` }}
          />
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden max-w-[1200px] mx-auto mt-2 glass-light rounded-2xl px-6 py-5 space-y-4">
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
