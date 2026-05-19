import Link from "next/link"
export default function forgot_password() {

    return (
        <>
            <section className="user-form-section forgot-password-section centred">
                <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-6.jpg)" }}></div>
                <div className="auto-container">
                    <div className="sec-title light">
                        <h6>[ Forgot Password ]</h6>
                        <h2>Reset Your Password</h2>
                        <p>Simple Step to Back your Account</p>
                    </div>
                    <div className="inner-box">
                        <div className="form-inner">
                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-51.png)" }}></div>
                            <form action="login.html" method="post">
                                <div className="form-group">
                                    <div className="text-box">
                                        <div className="icon"><img src="assets/images/icons/icon-61.png" alt=""/></div>
                                        <h6>Email</h6>
                                    </div>
                                    <input type="email" name="email" placeholder="Email Address" required=""/>
                                </div>
                                <div className="form-group message-btn">
                                    <button type="submit" className="theme-btn btn-one">Reset Your Password</button>
                                </div>
                            </form>
                        </div>
                        <div className="lower-text">
                            <h6><Link href="/login">Back to Login</Link></h6>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}