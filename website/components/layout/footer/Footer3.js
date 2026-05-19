import Link from "next/link"

export default function Footer3() {
    return (
        <>           
            
        <footer className="footer-style-two footer-home-three">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-47.png)" }}></div>
            <div className="widget-section">
                <div className="auto-container">
                    <div className="row clearfix">
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget logo-widget">
                                <div className="widget-content">
                                    <figure className="footer-logo"><Link href="/index-3"><img src="assets/images/logo-2.png" alt=""/></Link></figure>
                                    <p>Have questions <br />that aren't answered here?</p>
                                    <h4>Mail Us</h4>
                                    <div className="email-box"><Link href="mailto:supportme@example.com">supportme@example.com</Link></div>
                                    <ul className="social-links clearfix">
                                        <li><Link href="/index-3"><i className="fa-brands fa-facebook"></i></Link></li>
                                        <li><Link href="/index-3"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                        <li><Link href="/index-3"><i className="fa-brands fa-pinterest"></i></Link></li>
                                        <li><Link href="/index-3"><i className="fa-brands fa-youtube"></i></Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget links-widget">
                                <div className="widget-title">
                                    <h3>Useful Links</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="links-list clearfix">
                                        <li><Link href="/index-3">Blog writing</Link></li>
                                        <li><Link href="/index-3">Emails</Link></li>
                                        <li><Link href="/index-3">Social media Ads</Link></li>
                                        <li><Link href="/index-3">Video</Link></li>
                                        <li><Link href="/index-3">Copywriting</Link></li>
                                        <li><Link href="/index-3">Creative writing</Link></li>
                                        <li><Link href="/index-3">SEO</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget links-widget">
                                <div className="widget-title">
                                    <h3>Company</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="links-list clearfix">
                                        <li><Link href="/index-3">About us</Link></li>
                                        <li><Link href="/index-3">Pricing</Link></li>
                                        <li><Link href="/index-3">Press Room</Link></li>
                                        <li><Link href="/index-3">Partners</Link></li>
                                        <li><Link href="/index-3">Help Center</Link></li>
                                        <li><Link href="/index-3">Live Training</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget download-widget">
                                <div className="widget-title">
                                    <h3>Download App</h3>
                                </div>
                                <div className="widget-content">
                                    <p>Download from Google play store & Appstore.</p>
                                    <ul className="download-list clearfix">
                                        <li><Link href="index-3.html"><img src="assets/images/icons/icon-55.png" alt=""/>Google Play</Link></li>
                                        <li><Link href="index-3.html"><img src="assets/images/icons/icon-56.png" alt=""/>App Store</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom-two">
                <div className="auto-container">
                    <div className="bottom-inner">
                        <div className="copyright">
                            <p>&copy; {new Date().getFullYear()} <Link href="/">AI.zenius.</Link> All Rights Reserved.</p>
                        </div>
                        <ul className="footer-nav clearfix">
                            <li><Link href="/index-3">Privacy Policy</Link></li>
                            <li><Link href="/index-3">Terms & Condition</Link></li>
                            <li><Link href="/index-3">Legal</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>


        </>
    )
}
