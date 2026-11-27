import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AdminPortalModal } from './components/AdminPortalModal';
import { ArchitectureSection } from './components/ArchitectureSection';
import { ContactFooter } from './components/ContactFooter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FundISection } from './components/FundISection';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InquiryModal } from './components/InquiryModal';
import { LegalModal } from './components/LegalModal';
import { MandateSection } from './components/MandateSection';
import { ProgramBriefModal } from './components/ProgramBriefModal';
import { WorkflowDiscoverySection } from './components/WorkflowDiscoverySection';
import { FOCUS_AREAS, type InquiryPreset, type OfferingItem } from './data/memorandum';
import { DEFAULT_SITE_CONFIG, fetchSiteConfig, type SiteConfig } from './lib/inquiries';

const TRACK_PRESETS: Record<string, InquiryPreset> = {
  investment: { lane: 'founder', founderTrack: 'investment' },
  incubation: { lane: 'founder', founderTrack: 'incubation' },
  training: { lane: 'training', trainingFocus: 'governance' },
  partners: { lane: 'partner', partnerType: 'bank' },
  partner: { lane: 'partner', partnerType: 'bank' },
};

export default function App() {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryPreset, setInquiryPreset] = useState<InquiryPreset | null>(null);
  const [activeOffering, setActiveOffering] = useState<OfferingItem | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  const openInquiry = (preset: InquiryPreset | null = null) => {
    setInquiryPreset(preset);
    setInquiryOpen(true);
  };

  useEffect(() => {
    void fetchSiteConfig().then(setSiteConfig);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const track = params.get('track')?.toLowerCase();
    if (track && TRACK_PRESETS[track]) {
      setInquiryPreset(TRACK_PRESETS[track]);
      setInquiryOpen(true);
    } else if (window.location.hash === '#inquire') {
      setInquiryOpen(true);
    } else if (window.location.hash === '#portal' || window.location.hash === '#admin') {
      setPortalOpen(true);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInquiryOpen(false);
        setActiveOffering(null);
        setPrivacyOpen(false);
        setPortalOpen(false);
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
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-[#EDF1F2] text-[#0B2228]">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#0B5563] focus:text-white focus:text-xs focus:font-semibold"
          >
            Skip to content
          </a>

          <Header onOpenInquiry={() => openInquiry(null)} />

          <main id="main-content">
            <HeroSection onOpenInquiry={() => openInquiry(null)} />
            <ArchitectureSection onSelectOffering={(offering) => setActiveOffering(offering)} />
            <WorkflowDiscoverySection onOpenInquiry={(preset) => openInquiry(preset)} />
            <MandateSection />
            <FundISection onOpenInquiry={(preset) => openInquiry(preset)} />
          </main>

          <ContactFooter
            onOpenInquiry={() => openInquiry(null)}
            onOpenPrivacy={() => setPrivacyOpen(true)}
            onOpenPortal={() => setPortalOpen(true)}
          />

          <ProgramBriefModal
            offering={activeOffering}
            siteConfig={siteConfig}
            onClose={() => setActiveOffering(null)}
            onProceedToInquiry={(offering) => {
              setActiveOffering(null);
              openInquiry(offering.preset);
            }}
          />

          <InquiryModal
            open={inquiryOpen}
            preset={inquiryPreset}
            onClose={() => setInquiryOpen(false)}
          />

          <LegalModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />

          <AdminPortalModal
            open={portalOpen}
            onClose={() => setPortalOpen(false)}
            onSiteConfigUpdated={(nextConfig) => setSiteConfig(nextConfig)}
          />
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}
