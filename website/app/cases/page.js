'use client'
import Layout from "@/components/layout/Layout"
import { useState } from "react"
import Link from "next/link"


export default function cases() {

    const [isActive, setIsActive] = useState({
        status: false,
        key: 1,
    })

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            })
        } else {
            setIsActive({
                status: true,
                key,
            })
        }
    }

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Use Cases 01">

                {/* cases-page-section */}
                <section className="cases-page-section bg-color-1">
                    <div className="auto-container">
                        <div className="row clearfix">
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Content</span><span>Generation</span></Link></h3>
                                            <p>Right to find fault with man chooses to enjoy a pleasure that has annoying...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-5.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Marketing</span><span>Communications</span></Link></h3>
                                            <p>To the claims of duty or the obligations of business it will frequently occur...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-6.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Editing &</span><span>Proof Reading</span></Link></h3>
                                            <p>The wise man therefore all always holds in these mat- ters to this principle...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-7.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Language</span><span>Localization</span></Link></h3>
                                            <p>Foresee the pain and trou- ble that are bound to ensue and equal blame...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-8.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Product</span><span>Description</span></Link></h3>
                                            <p>The wise man therefore all always holds in these mat- ters to this principle...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-62.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>SEO Content</span><span>Optimization</span></Link></h3>
                                            <p>Foresee the pain and trou- ble that are bound to ensue and equal blame...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-63.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Brand</span><span>Voice & Memory</span></Link></h3>
                                            <p>Right to find fault with man chooses to enjoy a pleasure that has annoying...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-64.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-6 col-sm-12 cases-block">
                                <div className="service-block-one">
                                    <div className="inner-box">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Brand</span><span>Name Creator</span></Link></h3>
                                            <p>To the claims of duty or the obligations of business it will frequently occur...</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-65.png" alt=""/></div>
                                                <Link href="/case-details">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* cases-page-section */}


                {/* faq-section */}
                <section className="faq-section sec-pad">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-23.png)" }}></div>
                    <div className="auto-container">
                        <div className="sec-title centred">
                            <h6>[ faq’s ]</h6>
                            <h2>Answer for Your Questions</h2>
                        </div>
                        <div className="inner-box">
                            <ul className="accordion-box">
                                <li className="accordion block">
                                    <div className={isActive.key == 1 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(1)}>
                                        <div className="icon-box"></div>
                                        <h4>What is an AI writing tool?</h4>
                                    </div>
                                    <div className={isActive.key == 1 ? "acc-content current" : "acc-content"}>
                                        <p>These cases are perfectly simple and easy to distinguish. In Link free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                    </div>
                                </li>
                                <li className="accordion block">
                                    <div className={isActive.key == 2 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(2)}>
                                        <div className="icon-box"></div>
                                        <h4>How does an AI writing tool work?</h4>
                                    </div>
                                    <div className={isActive.key == 2 ? "acc-content current" : "acc-content"}>
                                        <p>These cases are perfectly simple and easy to distinguish. In Link free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                    </div>
                                </li>
                                <li className="accordion block">
                                    <div className={isActive.key == 3 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(3)}>
                                        <div className="icon-box"></div>
                                        <h4>Can an AI writing tool replace human writers?</h4>
                                    </div>
                                    <div className={isActive.key == 3 ? "acc-content current" : "acc-content"}>
                                        <p>These cases are perfectly simple and easy to distinguish. In Link free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                    </div>
                                </li>
                                <li className="accordion block">
                                    <div className={isActive.key == 4 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(4)}>
                                        <div className="icon-box"></div>
                                        <h4>What can I use an AI writing tool for?</h4>
                                    </div>
                                    <div className={isActive.key == 4 ? "acc-content current" : "acc-content"}>
                                        <p>These cases are perfectly simple and easy to distinguish. In Link free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="btn-box">
                                <Link href="/faq" className="theme-btn btn-one">Answer for More Questions</Link>
                            </div>
                        </div>
                    </div>
                </section>
                {/* faq-section end */}


            </Layout>
        </>
    )
}


