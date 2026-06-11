import PricingSection from "@/components/wchat/PricingSection";
import SiteFooter from "@/components/wchat/SiteFooter";
import SiteHeader from "@/components/wchat/SiteHeader";
import SiteShell from "@/components/wchat/SiteShell";
import AboutSection from "@/components/wchat/sections/AboutSection";
import BlogSection from "@/components/wchat/sections/BlogSection";
import BrandSection from "@/components/wchat/sections/BrandSection";
import ContactSection from "@/components/wchat/sections/ContactSection";
import FaqSection from "@/components/wchat/sections/FaqSection";
import FeaturesSection from "@/components/wchat/sections/FeaturesSection";
import HeroSection from "@/components/wchat/sections/HeroSection";
import HomeMiddleSections from "@/components/wchat/sections/HomeMiddleSections";
import TestimonialsSection from "@/components/wchat/sections/TestimonialsSection";

export default function Page() {
  return (
    <>
      <SiteShell onePage />
      <SiteHeader onePage absolute />
      <HeroSection />
      <AboutSection />
      <BrandSection />
      <FeaturesSection />
      <HomeMiddleSections />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <BlogSection />
      <ContactSection />
      <SiteFooter onePage />
    </>
  );
}
