import Layout from "@/components/layout/Layout"
import Banner from "@/components/sections/home2/Banner"
import Service from "@/components/sections/home1/Service"
import Chooseus from "@/components/sections/home2/Chooseus"
import ServiceTabs from "@/components/sections/home3/Service"
import Article from "@/components/sections/home3/Article"
import Masterpiece from "@/components/sections/home1/Masterpiece"
import Clients from "@/components/sections/home1/Clients"
import Pricing from "@/components/sections/home1/Pricing"
import Faq from "@/components/sections/home1/Faq"
import Easier from "@/components/sections/home1/Easier"

export default function Home() {

    return (
        <>
            <Layout headerStyle={2} footerStyle={2}>
                <Banner />
                <Service />
                <Chooseus />
                <ServiceTabs />
                <Article />
                <Masterpiece />
                <Clients />
                <Pricing />
                <Faq />
                <Easier />
            </Layout>
        </>
    )
}
