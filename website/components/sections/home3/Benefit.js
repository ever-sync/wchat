import React from 'react'
import Link from "next/link"
export default function Benefit() {
  return (
    <>
        <section className="benefit-section sec-pad">
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
    </>
  )
}
