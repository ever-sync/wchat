'use client'
import Layout from "@/components/layout/Layout"
import { useState } from "react"


export default function faq() {

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
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Questions & Answers">

                {/* faq-page-section */}
                <section className="faq-page-section sec-pad">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-23.png)" }}></div>
                    <div className="auto-container">
                        <div className="row clearfix">
                            <div className="col-lg-8 col-md-12 col-sm-12 offset-lg-2 content-column">
                                <div className="sec-title centred">
                                    <h6>[ faq’s ]</h6>
                                    <h2>Answer for Your Questions</h2>
                                </div>
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
                                    <li className="accordion block">
                                        <div className={isActive.key == 5 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(5)}>
                                            <div className="icon-box"></div>
                                            <h4>How does an AI writing tool work?</h4>
                                        </div>
                                        <div className={isActive.key == 5 ? "acc-content current" : "acc-content"}>
                                            <p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                        </div>
                                    </li>
                                    <li className="accordion block">
                                        <div className={isActive.key == 6 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(6)}>
                                            <div className="icon-box"></div>
                                            <h4>Can an AI writing tool replace human writers?</h4>
                                        </div>
                                        <div className={isActive.key == 6 ? "acc-content current" : "acc-content"}>
                                            <p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                        </div>
                                    </li>
                                    <li className="accordion block">
                                        <div className={isActive.key == 7 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(7)}>
                                            <div className="icon-box"></div>
                                            <h4>What can I use an AI writing tool for?</h4>
                                        </div>
                                        <div className={isActive.key == 7 ? "acc-content current" : "acc-content"}>
                                            <p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                        </div>
                                    </li>
                                    <li className="accordion block">
                                        <div className={isActive.key == 8 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(8)}>
                                            <div className="icon-box"></div>
                                            <h4>How does an AI writing tool work?</h4>
                                        </div>
                                        <div className={isActive.key == 8 ? "acc-content current" : "acc-content"}>
                                            <p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                        </div>
                                    </li>
                                    <li className="accordion block">
                                        <div className={isActive.key == 9 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(9)}>
                                            <div className="icon-box"></div>
                                            <h4>Can an AI writing tool replace human writers?</h4>
                                        </div>
                                        <div className={isActive.key == 9 ? "acc-content current" : "acc-content"}>
                                            <p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                        </div>
                                    </li>
                                    <li className="accordion block">
                                        <div className={isActive.key == 10 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(10)}>
                                            <div className="icon-box"></div>
                                            <h4>What can I use an AI writing tool for?</h4>
                                        </div>
                                        <div className={isActive.key == 10 ? "acc-content current" : "acc-content"}>
                                            <p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power choice is untrammelled and when nothing our being able do what we like best.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                {/* faq-page-section end */}


            </Layout>
        </>
    )
}


