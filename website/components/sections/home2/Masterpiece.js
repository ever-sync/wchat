import Link from "next/link"

export default function Masterpiece() {
    return (
        <> 

        <section className="masterpiece-style-two">
            <div className="auto-container">
                <div className="sec-title centred">
                    <h6>[ masterpiece ]</h6>
                    <h2>Write Winning Content</h2>
                    <p>Undertakes laborious physical exercise except to obtain some advantage from it.</p>
                </div>
                <div className="inner-container">
                    <div className="row clearfix">
                        <div className="col-lg-6 col-md-12 col-sm-12 image-column">
                            <div className="image-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-30.png)" }}></div>
                                <figure className="image"><img src="assets/images/resource/dashboard-9.jpg" alt=""/></figure>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                            <div className="content-box">
                                <div className="single-item">
                                    <h3>Templates</h3>
                                    <p>Browse Templates By Category</p>
                                    <Link href="/index-2"><i className="flaticon-right-arrow"></i></Link>
                                </div>
                                <div className="single-item">
                                    <h3>30+ Languages</h3>
                                    <p>Copywriting in 30+ Languages</p>
                                    <Link href="/index-2"><i className="flaticon-right-arrow"></i></Link>
                                </div>
                                <div className="single-item">
                                    <h3>Free AI Tools</h3>
                                    <p>Free AI-powered writing generators</p>
                                    <Link href="/index-2"><i className="flaticon-right-arrow"></i></Link>
                                </div>
                                <div className="single-item">
                                    <h3>Free AI Tools</h3>
                                    <p>Free AI-powered writing generators</p>
                                    <Link href="/index-2"><i className="flaticon-right-arrow"></i></Link>
                                </div>
                                <div className="single-item">
                                    <h3>30+ Languages</h3>
                                    <p>Copywriting in 30+ Languages</p>
                                    <Link href="/index-2"><i className="flaticon-right-arrow"></i></Link>
                                </div>
                                <div className="single-item">
                                    <h3>Free AI Tools</h3>
                                    <p>Free AI-powered writing generators</p>
                                    <Link href="/index-2"><i className="flaticon-right-arrow"></i></Link>
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
