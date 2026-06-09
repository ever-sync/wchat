import WchatLayout from "@/components/wchat/WchatLayout";
import ErrorPageSection from "@/components/wchat/sections/ErrorPageSection";

export default function NotFound() {
  return (
    <WchatLayout breadcrumbTitle="Página não encontrada">
      <ErrorPageSection />
    </WchatLayout>
  );
}
