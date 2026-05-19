import Link from "next/link"

export default function Service() {
    return (
        <> 

        <section className="service-style-two">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-2.jpg)" }}></div>
            <div className="auto-container">
                <div className="title-box">
                    <div className="row clearfix">
                        <div className="col-lg-6 col-md-12 col-sm-12 title-column">
                            <div className="sec-title light">
                                <h6>[ Services ]</h6>
                                <h2>Most Popular Services</h2>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 col-sm-12 text-column">
                            <div className="title-text">
                                <p>Undertakes laborious physical exercise except to obtain some advantage from it?</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row clearfix">
                    <div className="col-lg-4 col-md-6 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-29.png)" }}></div>
                                <div className="content-box">
                                    <h3><Link href="/case-details"><span>Content</span><span>Generation</span></Link></h3>
                                    <p>Toil and pain can procure him some of great pleasure take Link trivial examples, which of us ever undertakes.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-5.png" alt=""/></div>
                                        <Link href="/case-details">Read More</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-29.png)" }}></div>
                                <div className="content-box">
                                    <h3><Link href="case-details-2.html"><span>Marketing</span><span>Communications</span></Link></h3>
                                    <p>Except to obtain some advantage from it but who has any right to find fault all pleasure that has now.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-6.png" alt=""/></div>
                                        <Link href="case-details-2.html">Read More</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-29.png)" }}></div>
                                <div className="content-box">
                                    <h3><Link href="case-details-3.html"><span>Editing &</span><span>Proof Reading</span></Link></h3>
                                    <p>The system, and expound the actual teachings of the great explorer of the truth the master-builder one.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-7.png" alt=""/></div>
                                        <Link href="case-details-3.html">Read More</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-29.png)" }}></div>
                                <div className="content-box">
                                    <h3><Link href="case-details-4.html"><span>Language </span><span>Localization</span></Link></h3>
                                    <p>The system, and expound the actual teachings of the great explorer of the truth the master-builder one. </p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-8.png" alt=""/></div>
                                        <Link href="case-details-4.html">Read More</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-29.png)" }}></div>
                                <div className="content-box">
                                    <h3><Link href="case-details-5.html"><span>Ecommerce</span><span>Product Description</span></Link></h3>
                                    <p>Toil and pain can procure him some of great pleasure take Link trivial examples, which of us ever undertakes.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-22.png" alt=""/></div>
                                        <Link href="case-details-5.html">Read More</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-29.png)" }}></div>
                                <div className="content-box">
                                    <h3><Link href="case-details-6.html"><span>SEO</span><span>Content Optimization</span></Link></h3>
                                    <p>Except to obtain some advantage from it but who has any right to find fault all pleasure that has now.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-23.png" alt=""/></div>
                                        <Link href="case-details-6.html">Read More</Link>
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
