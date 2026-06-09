import WchatLayout from "@/components/wchat/WchatLayout";
import BlogDetailSection from "@/components/wchat/sections/BlogDetailSection";

export default function BlogDetailsPage() {
  return (
    <WchatLayout breadcrumbTitle="Artigo">
      <BlogDetailSection />
    </WchatLayout>
  );
}
