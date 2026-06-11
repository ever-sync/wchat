import WchatLayout from "@/components/wchat/WchatLayout";
import CasesListingSection from "@/components/wchat/sections/CasesListingSection";

export default function CasesPage() {
  return (
    <WchatLayout breadcrumbTitle="Funcionalidades">
      <CasesListingSection />
    </WchatLayout>
  );
}
