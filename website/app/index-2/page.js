import Layout from "@/components/layout/Layout"
import Banner from "@/components/sections/home2/Banner"
import Clients from "@/components/sections/home2/Clients"
import Service from "@/components/sections/home2/Service"
import Working from "@/components/sections/home2/Working"
import Chooseus from "@/components/sections/home2/Chooseus"
import Masterpiece from "@/components/sections/home2/Masterpiece"
import Testimonial from "@/components/sections/home2/Testimonial"
import Pricing from "@/components/sections/home2/Pricing"
import Contact from "@/components/sections/home2/Contact"
export default function Home_2() {

    return (
        <>
            <Layout headerStyle={2} footerStyle={2}>
                <Banner />
                <Clients />
                <Service />
                <Working />
                <Chooseus />
                <Masterpiece />
                <Testimonial />
                <Pricing />
                <Contact />
            </Layout>
        </>
    )
}