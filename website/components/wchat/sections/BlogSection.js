import { BLOG_POSTS } from "../content/blog";

export default function BlogSection() {
  const slides = [...BLOG_POSTS, BLOG_POSTS[0]];

  return (
    <section className="overflow-hidden space overflow-hidden" id="blog-sec">
      <div className="container">
        <div className="title-area text-center">
          <span className="sub-title style3 text-anime-style-2">[ Blog ]</span>
          <h2 className="sec-title h3 text-anime-style-3">Insights e novidades</h2>
        </div>
        <div className="slider-area">
          <div
            className="swiper th-slider has-shadow"
            id="blogSlider2"
            data-slider-options='{"loop":false,"mousewheel": {"enabled": true,"sensitivity": 4, "releaseOnEdges":true},"breakpoints":{"0":{"slidesPerView":1},"576":{"slidesPerView":"1"},"768":{"slidesPerView":"1"},"992":{"slidesPerView":"2"},"1200":{"slidesPerView":"3"}}}'
          >
            <div className="swiper-wrapper">
              {slides.map((post, i) => (
                <div key={`${post.title}-${i}`} className="swiper-slide">
                  <div className="blog-card style2 wow fadeInUp">
                    <div className="box-img global-img">
                      <img src={post.image} alt={post.title} />
                    </div>
                    <div className="box-content">
                      <div className="blog-meta">
                        <a href="/blog">{post.date}</a>
                      </div>
                      <h3 className="box-title">
                        <a href={post.href}>{post.title}</a>
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="icon-box mt-60 d-flex justify-content-center">
            <button data-slider-prev="#blogSlider2" className="slider-arrow default slider-prev">
              <img src="assets/img/icon/arrow-left2.svg" alt="Anterior" />
            </button>
            <button data-slider-next="#blogSlider2" className="slider-arrow default slider-next">
              <img src="assets/img/icon/arrow-right2.svg" alt="Próximo" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
