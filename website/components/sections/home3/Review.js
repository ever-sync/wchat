import React from 'react'
import Link from "next/link"
export default function Review() {
  return (
    <>
      <section className="review-section centred">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-39.png)" }}></div>
            <div className="auto-container">
                <div className="row clearfix">
                    <div className="col-lg-4 col-md-6 col-sm-12 review-block">
                        <div className="review-block-one">
                            <div className="inner-box">
                                <div className="logo-box"><img src="assets/images/icons/clients-4.png" alt=""/></div>
                                <h3>Unique Highly Effective!</h3>
                                <h5><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.5 out of 5</h5>
                                <h6><Link href="/index-3"><span>Read More</span></Link></h6>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 review-block">
                        <div className="review-block-one">
                            <div className="inner-box">
                                <div className="logo-box"><img src="assets/images/icons/clients-5.png" alt=""/></div>
                                <h3>Best AI Post & Article Writer</h3>
                                <h5><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 5 out of 5</h5>
                                <h6><Link href="/index-3"><span>Read More</span></Link></h6>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 col-sm-12 review-block">
                        <div className="review-block-one">
                            <div className="inner-box">
                                <div className="logo-box"><img src="assets/images/icons/clients-6.png" alt=""/></div>
                                <h3>Our Favorite AI Writing Tool</h3>
                                <h5><img src="assets/images/icons/icon-21.png" alt=""/>Rated: 4.9 out of 5</h5>
                                <h6><Link href="/index-3"><span>Read More</span></Link></h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
  )
}
