import Layout from "@/components/layout/Layout"
import Banner from "@/components/sections/home3/Banner"
import Clients from "@/components/sections/home3/Clients"
import Review from "@/components/sections/home3/Review"
import Service from "@/components/sections/home3/Service"
import Article from "@/components/sections/home3/Article"
import Benefit from "@/components/sections/home3/Benefit"
import Exploring from "@/components/sections/home3/Exploring"
import Tools from "@/components/sections/home3/Tools"
export default function Home_3() {

    return (
        <>
            <Layout headerStyle={3} footerStyle={3}>
                <Banner />
                <Clients />
                <Review />
                <Service />
                <Article />
                <Benefit />
                <Exploring />
                <Tools />
            </Layout>
        </>
    )
}