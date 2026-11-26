import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ArchitectureSection } from './components/ArchitectureSection';
import { ContactFooter } from './components/ContactFooter';
import { FundISection } from './components/FundISection';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InquiryModal } from './components/InquiryModal';
import { MandateSection } from './components/MandateSection';

export default function App() {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInquiryOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#EDF1F2] text-[#0B2228]">
        <Header onOpenInquiry={() => setInquiryOpen(true)} />
        <main>
          <HeroSection onOpenInquiry={() => setInquiryOpen(true)} />
          <ArchitectureSection />
          <MandateSection />
          <FundISection onOpenInquiry={() => setInquiryOpen(true)} />
        </main>
        <ContactFooter onOpenInquiry={() => setInquiryOpen(true)} />
        <InquiryModal open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
      </div>
    </MotionConfig>
  );
}
