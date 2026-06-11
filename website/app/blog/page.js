import WchatLayout from "@/components/wchat/WchatLayout";
import BlogListingSection from "@/components/wchat/sections/BlogListingSection";
import CtaSection from "@/components/wchat/sections/CtaSection";

export default function BlogPage() {
  return (
    <WchatLayout breadcrumbTitle="Blog">
      <BlogListingSection />
      <CtaSection />
    </WchatLayout>
  );
}
