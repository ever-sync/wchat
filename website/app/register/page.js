import Link from "next/link"

export default function register() {

    return (
        <>
            <section className="user-form-section register-section centred">
                <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-6.jpg)" }}></div>
                <div className="auto-container">
                    <div className="sec-title light">
                        <h6>[ Register ]</h6>
                        <h2>Begin your journey with AI.zenius</h2>
                        <p>Join 100.000s of Entrepreneurs, Freelancers, Marketers & ect...</p>
                    </div>
                    <div className="inner-box">
                        <ul className="download-list clearfix">
                            <li><Link href="/register"><img src="assets/images/icons/icon-59.png" alt=""/>Continue With Google</Link></li>
                            <li><Link href="/register"><img src="assets/images/icons/icon-60.png" alt=""/>Continue With Apple</Link></li>
                        </ul>
                        <div className="other-text">
                            <h6>or</h6>
                        </div>
                        <div className="form-inner">
                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-51.png)" }}></div>
                            <form action="/register" method="post">
                                <div className="form-group">
                                    <div className="text-box">
                                        <div className="icon"><img src="assets/images/icons/icon-57.png" alt=""/></div>
                                        <h6>User Name</h6>
                                    </div>
                                    <input type="text" name="name" placeholder="Your Name" required=""/>
                                </div>
                                <div className="form-group">
                                    <div className="text-box">
                                        <div className="icon"><img src="assets/images/icons/icon-61.png" alt=""/></div>
                                        <h6>Email</h6>
                                    </div>
                                    <input type="email" name="email" placeholder="Email Address" required=""/>
                                </div>
                                <div className="form-group">
                                    <div className="text-box">
                                        <div className="icon"><img src="assets/images/icons/icon-58.png" alt=""/></div>
                                        <h6>Password</h6>
                                    </div>
                                    <input type="password" name="password" placeholder="xxxxxxxxxx" required=""/>
                                </div>
                                <div className="form-group option-box">
                                    <div className="check-box">
                                        <input className="check" type="checkbox" id="checkbox1"/>
                                        <label for="checkbox1">I agree to the Terms of Service & Privacy Policy</label>
                                    </div>
                                </div>
                                <div className="form-group message-btn">
                                    <button type="submit" className="theme-btn btn-one">Register With AI.zenius</button>
                                </div>
                            </form>
                        </div>
                        <div className="lower-text">
                            <h6>Already have an account? <Link href="/login">Login</Link></h6>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}