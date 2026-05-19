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

    // Navigation
    navigation: {
        nextEl: '.owl-prev',
        prevEl: '.owl-next',
    },

    // Pagination
    pagination: {
        el: '.swiper-pagination-tools',
        clickable: true,
    },

    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        575: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        767: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        991: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        1199: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1350: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
    }
}

export default function Tools() {
    return (
        <>
        <section className="tools-section centred">
            <div className="auto-container">
                <div className="sec-title">
                    <h6>[ Can be used anywhere ]</h6>
                    <h2>Where You Can Utilize Our Tools for <br />Create & Enhance</h2>
                </div>
                <ul className="other-links">
                    <li><Link href="/index-3"><img src="assets/images/icons/icon-48.png" alt=""/></Link></li>
                    <li><Link href="/index-3"><img src="assets/images/icons/icon-49.png" alt=""/></Link></li>
                    <li><Link href="/index-3"><img src="assets/images/icons/icon-50.png" alt=""/></Link></li>
                    <li><Link href="/index-3"><img src="assets/images/icons/icon-51.png" alt=""/></Link></li>
                    <li><Link href="/index-3"><img src="assets/images/icons/icon-52.png" alt=""/></Link></li>
                    <li><Link href="/index-3"><img src="assets/images/icons/icon-53.png" alt=""/></Link></li>
                </ul>
                <div className="inner-container">
                    <Swiper {...swiperOptions} className="theme_carousel owl-theme">
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-44.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-13.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Figma</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-45.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-14.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Google Docs</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-46.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-15.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Google Chrome</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-44.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-13.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Figma</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-45.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-14.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Google Docs</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-46.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-15.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Google Chrome</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-44.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-13.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Figma</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-45.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-14.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Google Docs</Link></h3>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="single-item">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-46.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-15.jpg" alt=""/></figure>
                                    <div className="view-btn"><Link href="/"><img src="assets/images/icons/icon-54.png" alt=""/></Link></div>
                                </div>
                                <h3><Link href="/index-3">Google Chrome</Link></h3>
                            </div>
                        </SwiperSlide>
                    </Swiper>

                    <div className="owl-nav">
                        <button type="button" className="owl-prev"><span className="flaticon-left-arrow"></span></button>
                        <button type="button" className="owl-next"><span className="flaticon-right-arrow"></span></button>
                    </div>

                    <div className="owl-dots">
                        <div className="swiper-pagination-tools"></div>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}


