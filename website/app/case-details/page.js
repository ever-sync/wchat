'use client'
import Layout from "@/components/layout/Layout"
import Pricing from "@/components/sections/home2/Pricing"
import Tools from "@/components/sections/home3/Tools"
import Link from "next/link"
import { useState } from "react"
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


export default function cases_details() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }

    return (
        <>
            <Layout headerStyle={1} footerStyle={1}>

                {/* cases-details */}
                <section className="case-details">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-6.jpg)" }}></div>
                    <div className="auto-container">
                        <div className="inner-container">
                            <div className="sec-title light">
                                <div className="icon-box"><img src="assets/images/icons/icon-66.png" alt=""/></div>
                                <h6>[ Content Genration ]</h6>
                                <h2>Make your Content <br />Stand out with Our AI.zenius</h2>
                                <p>Expound the actual teachings of the great explorer truth master-builder of human <br />happiness one rejects, dislikes, or avoids pleasure itself.</p>
                            </div>
                            <div className="inner-box">
                                <div className="shape rotate-me" style={{ backgroundImage: "url(assets/images/shape/shape-53.png)" }}></div>
                                <div className="row clearfix">
                                    <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                                        <div className="content-box">
                                            <h3>Users in Last Week</h3>
                                            <div className="inner-text">
                                                <h2>5.2k</h2>
                                                <p>There are many variations of passages of <br />available but the majority.</p>
                                            </div>
                                            <div className="btn-box">
                                                <Link href="/case-details" className="theme-btn btn-one">Try AI.zenius for Free</Link>
                                            </div>
                                            <ul className="list-item clearfix">
                                                <li>7 Days Free Trial.</li>
                                                <li>No Credit Card Required.</li>
                                            </ul>
                                            <Link href="/case-details" className="scroll-btn scroll-to-target">
                                                <i className="flaticon-down-arrow"></i>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-12 col-sm-12 image-column">
                                        <figure className="image-box"><img src="assets/images/resource/dashboard-16.jpg" alt=""/></figure>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* cases-details end */}


                {/* clients-style-two */}
                <section className="clients-style-two centred sec-pad">
                    <div className="auto-container">
                        <div className="sec-title">
                            <h6>[ Clients & Partners ]</h6>
                            <h2>Trusted by 1.5M+ Users</h2>
                            <p>Undertakes laborious physical exercise except tto obtain some advantage from it? </p>
                        </div>
                        <ul className="clients-list clearfix">
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-1.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-2.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-3.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-4.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-5.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-6.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-7.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-8.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-9.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-10.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-11.png" alt=""/></Link></li>
                            <li><Link href="/index-2"><img src="assets/images/clients/clients-12.png" alt=""/></Link></li>
                        </ul>
                        <div className="rating-box">
                            <ul className="rating clearfix">
                                <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                                <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                                <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                                <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                                <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                            </ul>
                            <h6>Average rating of <span>4.89/5</span> on Trustpilot<Link href="/index-2">Read Reviews</Link></h6>
                        </div>
                    </div>
                </section>
                {/* clients-style-two end */}


                {/* chooseus-style-two */}
                <section className="chooseus-style-two bg-color-2">
                    <div className="auto-container">
                        <div className="row clearfix">
                            <div className="col-lg-4 col-md-6 col-sm-12 title-column">
                                <div className="sec-title light">
                                    <h6>[ Why Choose Us ]</h6>
                                    <h2>Reasons to Choosing Our AI Service</h2>
                                    <p>Undertakes laborious physical exercise except to obtain some advantage from it.</p>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-67.png" alt=""/></div>
                                        <h3><Link href="/blog">Blog Post</Link></h3>
                                        <p>Dolore magnam aliquam quaer autem enim ad minima veniam.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-68.png" alt=""/></div>
                                        <h3><Link href="/case-details">SEO Content</Link></h3>
                                        <p>Laborious physical exercise, except to obtain some advantage.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-69.png" alt=""/></div>
                                        <h3><Link href="/case-details">Website Content</Link></h3>
                                        <p>Rationally encounter consequence that anyone who loves or pursues.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-70.png" alt=""/></div>
                                        <h3><a href="case-details.html">Social Media Content</a></h3>
                                        <p>Indignation and dislike men who are so beguiled and demoralized.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-71.png" alt=""/></div>
                                        <h3><Link href="/case-details">Copywriting</Link></h3>
                                        <p>To the claims of duty or the obligations pleasures have to be repudiated.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-72.png" alt=""/></div>
                                        <h3><Link href="/case-details">Press Releases</Link></h3>
                                        <p>Dolore magnam aliquam quaer autem enim ad minima veniam.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-73.png" alt=""/></div>
                                        <h3><Link href="/case-details">E-book Writing</Link></h3>
                                        <p>Laborious physical exercise, except to obtain some advantage.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 chooseus-block">
                                <div className="chooseus-block-one">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-33.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-74.png" alt=""/></div>
                                        <h3><Link href="/case-details">Product Description</Link></h3>
                                        <p>Rationally encounter consequence that anyone who loves or pursues.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* chooseus-style-two end */}


                {/* benefit-section */}
                <section className="benefit-section case-details-page sec-pad">
                    <div className="auto-container">
                        <div className="sec-title centred">
                            <h6>[ beneficiaries ]</h6>
                            <h2>Who Can Benefit from Us</h2>
                            <p>Undertakes laborious physical exercise except to obtain <br />some advantage from it.</p>
                        </div>
                        <div className="row clearfix">
                            <div className="col-lg-4 col-md-6 col-sm-12 benefit-block">
                                <div className="benefit-block-one">
                                    <div className="inner-box">
                                        <div className="block-shape" style={{ backgroundImage: "url(assets/images/shape/shape-42.png)" }}></div>
                                        <div className="icon-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-41.png)" }}></div>
                                            <div className="icon"><img src="assets/images/icons/icon-43.png" alt=""/></div>
                                        </div>
                                        <h3><Link href="/index-3">Entrepreneurs</Link></h3>
                                        <p>The claims of duty or the obligations at  business will frequently.</p>
                                        <ul className="list-item clearfix">
                                            <li>Indignation and dislike men.</li>
                                            <li>Who are so beguiled & demoralized.</li>
                                            <li>The charms of pleasure.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 benefit-block">
                                <div className="benefit-block-one">
                                    <div className="inner-box">
                                        <div className="block-shape" style={{ backgroundImage: "url(assets/images/shape/shape-42.png)" }}></div>
                                        <div className="icon-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-41.png)" }}></div>
                                            <div className="icon"><img src="assets/images/icons/icon-44.png" alt=""/></div>
                                        </div>
                                        <h3><Link href="/index-3">Freelancers</Link></h3>
                                        <p>Every pleasure is to be welcomed every pain but in certain circumstances.</p>
                                        <ul className="list-item clearfix">
                                            <li>Cases are perfectly simple.</li>
                                            <li>Easy to distinguish.</li>
                                            <li>In Link free hour when our power.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-12 benefit-block">
                                <div className="benefit-block-one">
                                    <div className="inner-box">
                                        <div className="block-shape" style={{ backgroundImage: "url(assets/images/shape/shape-42.png)" }}></div>
                                        <div className="icon-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-41.png)" }}></div>
                                            <div className="icon"><img src="assets/images/icons/icon-45.png" alt=""/></div>
                                        </div>
                                        <h3><Link href="/index-3">Marketers</Link></h3>
                                        <p>Holds in these matters to this principle selection rejects pleasures.</p>
                                        <ul className="list-item clearfix">
                                            <li>Take Link trivial example which of us.</li>
                                            <li>Ever undertakes laborious.</li>
                                            <li>Physical exercise except to obtain.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* benefit-section end */}


                {/* working-section */}
                <section className="working-section case-details-page bg-color-2">
                    <figure className="image-layer float-bob-x"><img src="assets/images/resource/working-1.png" alt=""/></figure>
                    <span className="big-text">How It’s Work</span>
                    <div className="auto-container">
                        <div className="tabs-box">
                            <div className="row clearfix">
                                <div className="col-lg-6 col-md-12 col-sm-12 left-column">
                                    <div className="inner-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-6.png)" }}></div>
                                        <div className="image-box">
                                            <figure className="image"><img src="assets/images/resource/dashboard-4.jpg" alt=""/></figure>
                                        </div>
                                        <div className="tab-btns tab-buttons clearfix">
                                            <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>Select template <span>Step 01</span></li>
                                            <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>Describe topic <span>Step 02</span></li>
                                            <li onClick={() => handleOnClick(3)} className={activeIndex === 3 ? "tab-btn active-btn" : "tab-btn"}>Get Results <span>Step 03</span></li>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                                    <div className="tabs-content">
                                        <div className={activeIndex === 1 ? "tab active-tab" : "tab"}>
                                            <div className="content-box">
                                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-7.png)" }}></div>
                                                <h2>01 <span>- 03</span></h2>
                                                <h3>Select Your Template</h3>
                                                <p>Chooses to enjoy a pleasure that has annoying consequences or one who avoids a pain that produces no resultant pleasure the master-builder of human happiness.</p>
                                                <ul className="list-item clearfix">
                                                    <li>Toil and pain can procure him some great.</li>
                                                    <li>Produces no resultant pleasure.</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="topic">
                                            <div className="content-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-7.png)" }}></div>
                                                <h2>02 <span>- 03</span></h2>
                                                <h3>Describe topic</h3>
                                                <p>Chooses to enjoy a pleasure that has annoying consequences or one who avoids a pain that produces no resultant pleasure the master-builder of human happiness.</p>
                                                <ul className="list-item clearfix">
                                                    <li>Toil and pain can procure him some great.</li>
                                                    <li>Produces no resultant pleasure.</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className={activeIndex === 3 ? "tab active-tab" : "tab"} id="results">
                                            <div className="content-box">
                                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-7.png)" }}></div>
                                                <h2>03 <span>- 03</span></h2>
                                                <h3>Get Results</h3>
                                                <p>Chooses to enjoy a pleasure that has annoying consequences or one who avoids a pain that produces no resultant pleasure the master-builder of human happiness.</p>
                                                <ul className="list-item clearfix">
                                                    <li>Toil and pain can procure him some great.</li>
                                                    <li>Produces no resultant pleasure.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* working-section end */}


                <Pricing />


                {/* testimonial-section */}
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
                {/* testimonial-section end */}
                
                
                <Tools />

            </Layout>
        </>
    )
}