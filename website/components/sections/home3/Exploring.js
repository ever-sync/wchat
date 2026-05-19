import React from 'react'
import VideoPopup from "@/components/elements/VideoPopup"
export default function Exploring() {
  return (
    <>
      <section className="exploring-section">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-43.png)" }}></div>
            <div className="auto-container">
                <div className="upper-box">
                    <div className="row clearfix">
                        <div className="col-lg-7 col-md-12 col-sm-12 video-column">
                            <div className="video-inner">
                                <div className="bg-layer" style={{ backgroundImage: "url(assets/images/resource/video-1.jpg)" }}></div>
                                <div className="btn-box">
                                    <div className="video-btn">
                                        <VideoPopup />
                                    </div>
                                    <h6>How Its’ Work</h6>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-5 col-md-12 col-sm-12 content-column">
                            <div className="content-box">
                                <div className="sec-title">
                                    <h6>[ Exploring the Future ]</h6>
                                    <h2>Exploring the <br />Future of Content Creation</h2>
                                </div>
                                <div className="text-box">
                                    <div className="bold-text">Undertakes laborious physical exercise except.</div>
                                    <p>To obtain some advantage from it take a trivial example which obtain some advantage itself because it is pain but because occasionally circumstances.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lower-box centred">
                    <div className="row clearfix">
                        <div className="col-lg-4 col-md-6 col-sm-12 single-column">
                            <div className="single-item">
                                <h3>10X Output</h3>
                                <p>Trouble that are bound to ensue equal blame weakness what we like best.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 col-sm-12 single-column">
                            <div className="single-item">
                                <h3>30+Language</h3>
                                <p>Bound to ensue equal blame belongs to those who fail in their duty.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 col-sm-12 single-column">
                            <div className="single-item">
                                <h3>Free AI Tools</h3>
                                <p>Master-builder human happiness one rejects dislikes avoids pleasure itself.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
  )
}
