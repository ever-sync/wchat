import React from 'react';
import OctadeskHeader from '@/components/octadesk/OctadeskHeader';
import HeroSection from '@/components/octadesk/HeroSection';
import IntelligenceSection from '@/components/octadesk/IntelligenceSection';
import SegmentSection from '@/components/octadesk/SegmentSection';
import CasesSection from '@/components/octadesk/CasesSection';
import IntegrationsSection from '@/components/octadesk/IntegrationsSection';
import FaqSection from '@/components/octadesk/FaqSection';
import PreFooterCta from '@/components/octadesk/PreFooterCta';
import OctadeskFooter from '@/components/octadesk/OctadeskFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <OctadeskHeader />
      <main>
        <HeroSection />
        <IntelligenceSection />
        <SegmentSection />
        <CasesSection />
        <IntegrationsSection />
        <FaqSection />
        <PreFooterCta />
      </main>
      <OctadeskFooter />
    </div>
  );
}
