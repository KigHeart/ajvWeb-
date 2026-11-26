import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ArchitectureSection } from './components/ArchitectureSection';
import { ContactFooter } from './components/ContactFooter';
import { FundISection } from './components/FundISection';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InquiryModal } from './components/InquiryModal';
import { LegalModal, type LegalTab } from './components/LegalModal';
import { MandateSection } from './components/MandateSection';
import { FOCUS_AREAS } from './data/memorandum';

export default function App() {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInquiryOpen(false);
        setLegalTab(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    FOCUS_AREAS.forEach((area) => {
      const img = new Image();
      img.src = area.image;
    });
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#EDF1F2] text-[#0B2228]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#0B5563] focus:text-white focus:text-xs focus:font-semibold"
        >
          Skip to content
        </a>

        <Header onOpenInquiry={() => setInquiryOpen(true)} />

        <main id="main-content">
          <HeroSection onOpenInquiry={() => setInquiryOpen(true)} />
          <ArchitectureSection />
          <MandateSection />
          <FundISection onOpenInquiry={() => setInquiryOpen(true)} />
        </main>

        <ContactFooter
          onOpenInquiry={() => setInquiryOpen(true)}
          onOpenLegal={(tab) => setLegalTab(tab)}
        />

        <InquiryModal open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
        <LegalModal
          tab={legalTab}
          onChangeTab={(tab) => setLegalTab(tab)}
          onClose={() => setLegalTab(null)}
        />
      </div>
    </MotionConfig>
  );
}
