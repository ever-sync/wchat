'use client'
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
        el: '.swiper-pagination',
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
export default function Testimonial() {
    return (
        <>
        <section className="testimonial-section sec-pad bg-color-2">
            <div className="auto-container">
                <div className="sec-title light">
                    <h6>[ Testimonials ]</h6>
                    <h2>What Our Users Say About Us</h2>
                </div>
                <div className="inner-container">
                    <Swiper {...swiperOptions} className="theme_carousel owl-theme">
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-1.png" alt=""/></div>
                                    <h3>Unique highly effective!</h3>
                                    <p>Loves or pursues or desires to obtain pain because it is pain but because occasionaly ofall our circumstances.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.5 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-1.png" alt=""/></figure>
                                        <h4>Dedrew Kowzel</h4>
                                        <span className="designation">Founder - Anaplan Info Tech</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-2.png" alt=""/></div>
                                    <h3>Amazing & Efficient!</h3>
                                    <p>Cases are perfectly simple and easy to distinguish in a free hour, when our power choice is when nothing prevents.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 5 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-2.png" alt=""/></figure>
                                        <h4>Alice Isabella</h4>
                                        <span className="designation">Project Head - Datarobot</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-3.png" alt=""/></div>
                                    <h3>My Favorite Tool</h3>
                                    <p>The claims of duty or the obligations of business it will frequently occur pleasures repudiated and annoyances.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.9 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-3.png" alt=""/></figure>
                                        <h4>Jack Oliver</h4>
                                        <span className="designation">Manager - Gridsome Sol</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-1.png" alt=""/></div>
                                    <h3>Unique highly effective!</h3>
                                    <p>Loves or pursues or desires to obtain pain because it is pain but because occasionaly ofall our circumstances.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.5 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-1.png" alt=""/></figure>
                                        <h4>Dedrew Kowzel</h4>
                                        <span className="designation">Founder - Anaplan Info Tech</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-2.png" alt=""/></div>
                                    <h3>Amazing & Efficient!</h3>
                                    <p>Cases are perfectly simple and easy to distinguish in a free hour, when our power choice is when nothing prevents.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 5 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-2.png" alt=""/></figure>
                                        <h4>Alice Isabella</h4>
                                        <span className="designation">Project Head - Datarobot</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-3.png" alt=""/></div>
                                    <h3>My Favorite Tool</h3>
                                    <p>The claims of duty or the obligations of business it will frequently occur pleasures repudiated and annoyances.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.9 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-3.png" alt=""/></figure>
                                        <h4>Jack Oliver</h4>
                                        <span className="designation">Manager - Gridsome Sol</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-1.png" alt=""/></div>
                                    <h3>Unique highly effective!</h3>
                                    <p>Loves or pursues or desires to obtain pain because it is pain but because occasionaly ofall our circumstances.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.5 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-1.png" alt=""/></figure>
                                        <h4>Dedrew Kowzel</h4>
                                        <span className="designation">Founder - Anaplan Info Tech</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-2.png" alt=""/></div>
                                    <h3>Amazing & Efficient!</h3>
                                    <p>Cases are perfectly simple and easy to distinguish in a free hour, when our power choice is when nothing prevents.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 5 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-2.png" alt=""/></figure>
                                        <h4>Alice Isabella</h4>
                                        <span className="designation">Project Head - Datarobot</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide className="slide-item">
                            <div className="testimonial-block-one">
                                <div className="inner-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-35.png)" }}></div>
                                    <div className="clients-logo"><img src="assets/images/icons/clients-3.png" alt=""/></div>
                                    <h3>My Favorite Tool</h3>
                                    <p>The claims of duty or the obligations of business it will frequently occur pleasures repudiated and annoyances.</p>
                                    <h6><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.9 out of 5</h6>
                                    <div className="author-box">
                                        <div className="quote"><img src="assets/images/icons/icon-32.png" alt=""/></div>
                                        <figure className="thumb-box"><img src="assets/images/resource/testimonial-3.png" alt=""/></figure>
                                        <h4>Jack Oliver</h4>
                                        <span className="designation">Manager - Gridsome Sol</span>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    </Swiper>

                    <div className="owl-nav">
                        <button type="button" className="owl-prev"><span className="flaticon-left-arrow"></span></button>
                        <button type="button" className="owl-next"><span className="flaticon-right-arrow"></span></button>
                    </div>

                    <div className="owl-dots">
                        <div className="swiper-pagination"></div>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}


