'use client'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useState } from "react"
import { Autoplay, Navigation, Thumbs } from 'swiper/modules'
export default function Beneficiaries() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }

    return (
        <>
        <section className="beneficiaries-section">
            <div className="auto-container">
                <div className="tabs-box">
                    <div className="row clearfix">
                        <div className="col-lg-4 col-md-12 col-sm-12 title-column">
                            <div className="title-box">
                                <div className="sec-title">
                                    <h6>[ beneficiaries ]</h6>
                                    <h2>Who Can Benefit from Us</h2>
                                    <p>Undertakes laborious physical exercise except to obtain some advantage from it.</p>
                                </div>
                                <div className="tab-btns tab-buttons">
                                    <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>Students</li>
                                    <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>Content Creators</li>
                                    <li onClick={() => handleOnClick(3)} className={activeIndex === 3 ? "tab-btn active-btn" : "tab-btn"}>Professionals</li>
                                    <li onClick={() => handleOnClick(4)} className={activeIndex === 4 ? "tab-btn active-btn" : "tab-btn"}>Language Learners</li>
                                    <li onClick={() => handleOnClick(5)} className={activeIndex === 5 ? "tab-btn active-btn" : "tab-btn"}>Ecommerce</li>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-8 col-md-12 col-sm-12 content-column">
                            <div className="tabs-content">
                                <div id="desc" className={activeIndex === 1 ? "tab active-tab" : "tab"}>
                                    <div className="content-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-9.png" alt=""/></div>
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-4.png)" }}></div>
                                        <h5>AI.zenius</h5>
                                        <h3>For Students</h3>
                                        <p>Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is occasionally.</p>
                                        <ul className="feature-list clearfix">
                                            <li><span>Academic Assignments</span></li>
                                            <li><span>Essays</span></li>
                                            <li><span>Research papers</span></li>
                                            <li><span>Writing Tasks</span></li>
                                            <li><Link href="/">All Features</Link></li>
                                        </ul>
                                        <figure className="image-box"><img src="assets/images/resource/beneficiaries-1.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="creators">
                                    <div className="content-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-9.png" alt=""/></div>
                                        <h5>AI.zenius</h5>
                                        <h3>Content Creators</h3>
                                        <p>Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is occasionally.</p>
                                        <ul className="feature-list clearfix">
                                            <li><span>Academic Assignments</span></li>
                                            <li><span>Essays</span></li>
                                            <li><span>Research papers</span></li>
                                            <li><span>Writing Tasks</span></li>
                                            <li><Link href="/">All Features</Link></li>
                                        </ul>
                                        <figure className="image-box"><img src="assets/images/resource/beneficiaries-2.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className={activeIndex === 3 ? "tab active-tab" : "tab"} id="professionals">
                                    <div className="content-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-9.png" alt=""/></div>
                                        <h5>AI.zenius</h5>
                                        <h3>Professionals</h3>
                                        <p>Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is occasionally.</p>
                                        <ul className="feature-list clearfix">
                                            <li><span>Academic Assignments</span></li>
                                            <li><span>Essays</span></li>
                                            <li><span>Research papers</span></li>
                                            <li><span>Writing Tasks</span></li>
                                            <li><Link href="/">All Features</Link></li>
                                        </ul>
                                        <figure className="image-box"><img src="assets/images/resource/beneficiaries-3.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className={activeIndex === 4 ? "tab active-tab" : "tab"} id="learners">
                                    <div className="content-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-9.png" alt=""/></div>
                                        <h5>AI.zenius</h5>
                                        <h3>Language Learners</h3>
                                        <p>Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is occasionally.</p>
                                        <ul className="feature-list clearfix">
                                            <li><span>Academic Assignments</span></li>
                                            <li><span>Essays</span></li>
                                            <li><span>Research papers</span></li>
                                            <li><span>Writing Tasks</span></li>
                                            <li><Link href="/">All Features</Link></li>
                                        </ul>
                                        <figure className="image-box"><img src="assets/images/resource/beneficiaries-4.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className={activeIndex === 5 ? "tab active-tab" : "tab"} id="ecommerce">
                                    <div className="content-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-9.png" alt=""/></div>
                                        <h5>AI.zenius</h5>
                                        <h3>For Ecommerce</h3>
                                        <p>Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is occasionally.</p>
                                        <ul className="feature-list clearfix">
                                            <li><span>Academic Assignments</span></li>
                                            <li><span>Essays</span></li>
                                            <li><span>Research papers</span></li>
                                            <li><span>Writing Tasks</span></li>
                                            <li><Link href="/">All Features</Link></li>
                                        </ul>
                                        <figure className="image-box"><img src="assets/images/resource/beneficiaries-5.jpg" alt=""/></figure>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}
