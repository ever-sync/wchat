import WchatLayout from "@/components/wchat/WchatLayout";
import { FAQ_PAGE_ITEMS } from "@/components/wchat/content/faq";
import CtaSection from "@/components/wchat/sections/CtaSection";
import FaqSection from "@/components/wchat/sections/FaqSection";

export default function FaqPage() {
  return (
    <WchatLayout breadcrumbTitle="Perguntas frequentes">
      <FaqSection
        items={FAQ_PAGE_ITEMS}
        accordionId="faqPageAccordion"
        sectionId="faq-page"
        showCta={false}
      />
      <CtaSection />
    </WchatLayout>
  );
}
