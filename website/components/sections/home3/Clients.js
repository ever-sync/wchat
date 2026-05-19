'use client'
import Link from "next/link"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 1,
    spaceBetween: 30,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
    },
    loop: true,

    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        575: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        767: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        991: {
            slidesPerView: 4,
            spaceBetween: 30,
        },
        1199: {
            slidesPerView: 5,
            spaceBetween: 30,
        },
        1350: {
            slidesPerView: 5,
            spaceBetween: 30,
        },
    }
}
export default function Clients() {
    return (
        <>
        <section className="clients-style-three centred">
            <div className="auto-container">
                <div className="inner-container">
                    <Swiper {...swiperOptions} className="theme_carousel owl-theme">
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-15.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-16.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-17.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-18.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-19.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-15.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-16.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-17.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-18.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="clients-box">
                                <Link href="/index-3"><img src="assets/images/clients/clients-19.png" alt=""/></Link>
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>
        </section>
        </>
    )
}


