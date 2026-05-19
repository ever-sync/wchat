'use client'
import { useState } from "react"
export default function Working() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }
    return (
        <>
        <section className="working-section bg-color-2">
            <figure className="image-layer float-bob-x"><img src="assets/images/resource/working-1.png" alt=""/></figure>
            <span className="big-text">How It’s Work</span>
            <div className="auto-container">
                <div className="tabs-box">
                    <div className="row clearfix">
                        <div className="col-lg-6 col-md-12 col-sm-12 left-column">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-6.png)" }}></div>
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/dashboard-4.jpg" alt=""/></figure>
                                </div>
                                <div className="tab-btns tab-buttons clearfix">
                                    <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>Select template <span>Step 01</span></li>
                                    <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>Describe topic <span>Step 02</span></li>
                                    <li onClick={() => handleOnClick(3)} className={activeIndex === 3 ? "tab-btn active-btn" : "tab-btn"}>Get Results <span>Step 03</span></li>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                            <div className="tabs-content">
                                <div id="desc" className={activeIndex === 1 ? "tab active-tab" : "tab"}>
                                    <div className="content-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-7.png)" }}></div>
                                        <h2>01 <span>- 03</span></h2>
                                        <h3>Select Your Template</h3>
                                        <p>Chooses to enjoy a pleasure that has annoying consequences or one who avoids a pain that produces no resultant pleasure the master-builder of human happiness.</p>
                                        <ul className="list-item clearfix">
                                            <li>Toil and pain can procure him some great.</li>
                                            <li>Produces no resultant pleasure.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="topic">
                                    <div className="content-box">
                                      <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-7.png)" }}></div>
                                        <h2>02 <span>- 03</span></h2>
                                        <h3>Describe topic</h3>
                                        <p>Chooses to enjoy a pleasure that has annoying consequences or one who avoids a pain that produces no resultant pleasure the master-builder of human happiness.</p>
                                        <ul className="list-item clearfix">
                                            <li>Toil and pain can procure him some great.</li>
                                            <li>Produces no resultant pleasure.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className={activeIndex === 3 ? "tab active-tab" : "tab"} id="results">
                                    <div className="content-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-7.png)" }}></div>
                                        <h2>03 <span>- 03</span></h2>
                                        <h3>Get Results</h3>
                                        <p>Chooses to enjoy a pleasure that has annoying consequences or one who avoids a pain that produces no resultant pleasure the master-builder of human happiness.</p>
                                        <ul className="list-item clearfix">
                                            <li>Toil and pain can procure him some great.</li>
                                            <li>Produces no resultant pleasure.</li>
                                        </ul>
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
