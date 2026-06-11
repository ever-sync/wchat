import { BLOG_POSTS } from "../content/blog";

export default function BlogListingSection() {
  return (
    <section className="overflow-hidden space">
      <div className="container th-container5">
        <div className="title-area text-center">
          <span className="sub-title style3 text-anime-style-2">[ Blog ]</span>
          <h2 className="sec-title h3 text-anime-style-3">Insights para vender mais pelo WhatsApp</h2>
        </div>
        <div className="row gy-4">
          {BLOG_POSTS.map((post) => (
            <div key={post.slug} className="col-md-6 col-xl-4">
              <div className="blog-card style2 wow fadeInUp h-100">
                <div className="box-img global-img">
                  <a href={post.href}>
                    <img src={post.image} alt={post.title} />
                  </a>
                </div>
                <div className="box-content">
                  <div className="blog-meta">
                    <a href="/blog">{post.date}</a>
                    <span> · {post.category}</span>
                  </div>
                  <h3 className="box-title">
                    <a href={post.href}>{post.title}</a>
                  </h3>
                  <p className="box-text">{post.excerpt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
