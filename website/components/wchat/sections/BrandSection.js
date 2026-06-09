const BRANDS = [
  "assets/img/brand/brand_2_1.svg",
  "assets/img/brand/brand_2_2.svg",
  "assets/img/brand/brand_2_3.svg",
  "assets/img/brand/brand_2_4.svg",
  "assets/img/brand/brand_2_5.svg",
  "assets/img/brand/brand_2_6.svg",
  "assets/img/brand/brand_2_1.svg",
  "assets/img/brand/brand_2_2.svg",
];

export default function BrandSection() {
  return (
    <div className="overflow-hidden space">
      <div className="container th-container5">
        <div className="row">
          <div className="title-area mb-20 text-center">
            <h2 className="h6 fw-normal text-anime-style-2">Mais de 1.500 empresas vendem melhor com o wChat</h2>
          </div>
        </div>
        <div className="slider-area">
          <div
            className="swiper th-slider"
            id="brandSlider1"
            data-slider-options='{"breakpoints":{"0":{"slidesPerView":2},"476":{"slidesPerView":"2"},"768":{"slidesPerView":"2"},"992":{"slidesPerView":"3"},"1200":{"slidesPerView":"4"},"1400":{"slidesPerView":"6"}}}'
          >
            <div className="swiper-wrapper">
              {BRANDS.map((src, i) => (
                <div key={`${src}-${i}`} className="swiper-slide">
                  <div className="brand-item style2">
                    <span>
                      <img src={src} alt="Logo de cliente" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
