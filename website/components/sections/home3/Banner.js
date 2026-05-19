import React from 'react'
import Link from "next/link"
export default function Banner() {
  return (
    <>
      <section className="banner-style-three centred">
            <div className="pattern-layer">
                <div className="pattern-1" style={{ backgroundImage: "url(assets/images/shape/shape-36.png)" }}></div>
                <div className="pattern-2" style={{ backgroundImage: "url(assets/images/shape/shape-37.png)" }}></div>
                <div className="pattern-3" style={{ backgroundImage: "url(assets/images/shape/shape-37.png)" }}></div>
            </div>
            <div className="image-layer">
                <figure className="image image-1"><img src="assets/images/resource/dashboard-10.jpg" alt=""/></figure>
                <figure className="image image-2"><img src="assets/images/resource/dashboard-11.jpg" alt=""/></figure>
            </div>
            <div className="auto-container">
                <div className="content-box">
                    <div className="icon-box"><img src="assets/images/icons/icon-41.png" alt=""/></div>
                    <h6>[ welcome to AI.Zenius ]</h6>
                    <h2>Using AI.zenius to Improve Your Business</h2>
                    <p>Denouncing pleasure and praising pain was born will give you a <br />expound the actual teachings.</p>
                    <div className="btn-box">
                        <Link href="/index-3" className="theme-btn btn-one">View All Services</Link>
                    </div>
                </div>
            </div>
        </section>
    </>
  )
}
