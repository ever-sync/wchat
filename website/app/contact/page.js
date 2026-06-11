import WchatLayout from "@/components/wchat/WchatLayout";
import { FAQ_ITEMS } from "@/components/wchat/content/faq";
import ContactInfoSection from "@/components/wchat/sections/ContactInfoSection";
import ContactSection from "@/components/wchat/sections/ContactSection";
import FaqSection from "@/components/wchat/sections/FaqSection";

export default function ContactPage() {
  return (
    <WchatLayout breadcrumbTitle="Fale com a gente">
      <ContactInfoSection />
      <ContactSection />
      <FaqSection
        items={FAQ_ITEMS}
        accordionId="contactFaqAccordion"
        sectionId="contact-faq"
        showCta={false}
        title="Dúvidas comuns"
      />
    </WchatLayout>
  );
}
