import Link from "next/link"

export default function Banner() {
    return (
        <> 

        <section className="banner-section">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-1.jpg)" }}></div>
            <div className="auto-container">
                <div className="content-box">
                    <div className="upper-box centred">
                        <div className="copyright"><h4><i className="flaticon-check"></i>24k Copywriters</h4></div>
                        <div className="ratings"><h4><i className="flaticon-check"></i>18.5k Ratings</h4></div>
                        <div className="icon-box icon-one"><img src="assets/images/icons/icon-3.png" alt="" /></div>
                        <div className="icon-box icon-two"><img src="assets/images/icons/icon-4.png" alt="" /></div>
                        <h5>Discover the power of <span>ai.zenius</span></h5>
                        <h2><span>Leading AI</span> Writing Assistant for</h2>
                        <Link href="/">Facebook Ads</Link>
                        <h6>Join 12,000 marketers who use our AI.</h6>
                    </div>
                    <div className="lower-box">
                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-1.png)" }}></div>
                        <div className="inner-box clearfix">
                            <div className="left-column">
                                <div className="robot-image" style={{ backgroundImage: "url(assets/images/resource/robot-1.png)" }}></div>
                                <div className="text-box">
                                    <h5><span>Zenius</span> is Ready, Are you?</h5>
                                </div>
                                <div className="form-inner">
                                    <form method="post" action="index">
                                        <div className="form-group">
                                            <input type="text" name="text" placeholder="What is Artificial Intelligence?" required />
                                            <button type="submit" className="theme-btn btn-one">Write For Me</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="right-column">
                                <div className="shape-2" style={{ backgroundImage: "url(assets/images/shape/shape-2.png)" }}></div>
                                <figure className="image-box"><img src="assets/images/resource/dashboard-1.jpg" alt="" /></figure>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        </>
    )
}
