import WchatLayout from "@/components/wchat/WchatLayout";
import ErrorPageSection from "@/components/wchat/sections/ErrorPageSection";

export default function ErrorPage() {
  return (
    <WchatLayout breadcrumbTitle="Página não encontrada">
      <ErrorPageSection />
    </WchatLayout>
  );
}
