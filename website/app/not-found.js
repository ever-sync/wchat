
import Link from "next/link"
export default function error() {

    return (
        <>
            <section className="error-section centred">
                <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-6.jpg)" }}></div>
                <div className="scroll-text">
                    <div className="text-box-one">
                        <div className="text-inner text-one">
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                        </div>
                    </div>
                    <div className="text-box-two">
                        <div className="text-inner text-two">
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                            <h3>Page Not Found</h3>
                        </div>
                    </div>
                </div>
                <div className="auto-container">
                    <div className="content-box">
                        <div className="image-box">
                            <h3>Oops!</h3>
                            <figure className="error-image"><img src="assets/images/icons/error-1.png" alt=""/></figure>
                        </div>
                        <h2>Something Went Wrong, Try Later</h2>
                        <p>Try refining your search or use the navigation below to <br />return to the main home page.</p>
                        <div className="form-inner">
                            <form action="error.html" method="post">
                                <div className="form-group">
                                    <input type="search" name="search-field" placeholder="Search..." required=""/>
                                    <button type="submit"><i className="fas fa-search"></i></button>
                                </div>
                            </form>
                        </div>
                        <div className="btn-box">
                            <Link href="/" className="theme-btn btn-one">Back to Home Page</Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
