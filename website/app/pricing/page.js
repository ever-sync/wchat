import PricingSection from "@/components/wchat/PricingSection";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function PricingPage() {
  return (
    <WchatLayout breadcrumbTitle="Planos e preços">
      <PricingSection showHeading={false} />
    </WchatLayout>
  );
}
