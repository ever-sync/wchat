import PricingSection from "@/components/wchat/PricingSection";
import WchatLayout from "@/components/wchat/WchatLayout";
import AboutSection from "@/components/wchat/sections/AboutSection";
import BrandSection from "@/components/wchat/sections/BrandSection";
import CtaSection from "@/components/wchat/sections/CtaSection";
import FeaturesSection from "@/components/wchat/sections/FeaturesSection";
import TestimonialsSection from "@/components/wchat/sections/TestimonialsSection";
import WhyChooseSection from "@/components/wchat/sections/WhyChooseSection";

export default function AboutPage() {
  return (
    <WchatLayout breadcrumbTitle="Conheça o wChat">
      <AboutSection variant="page" />
      <BrandSection />
      <WhyChooseSection />
      <FeaturesSection />
      <TestimonialsSection showCta={false} />
      <CtaSection />
      <PricingSection />
    </WchatLayout>
  );
}
