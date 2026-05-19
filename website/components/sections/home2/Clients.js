import Link from "next/link"

export default function Clients() {
    return (
        <> 

        <section className="clients-style-two centred sec-pad">
            <div className="auto-container">
                <div className="sec-title">
                    <h6>[ Clients & Partners ]</h6>
                    <h2>Trusted by 1.5M+ Users</h2>
                    <p>Undertakes laborious physical exercise except tto obtain some advantage from it? </p>
                </div>
                <ul className="clients-list clearfix">
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-1.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-2.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-3.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-4.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-5.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-6.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-7.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-8.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-9.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-10.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-11.png" alt=""/></Link></li>
                    <li><Link href="/index-2"><img src="assets/images/clients/clients-12.png" alt=""/></Link></li>
                </ul>
                <div className="rating-box">
                    <ul className="rating clearfix">
                        <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                        <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                        <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                        <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                        <li><img src="assets/images/icons/icon-21.png" alt=""/></li>
                    </ul>
                    <h6>Average rating of <span>4.89/5</span> on Trustpilot<Link href="/index-2">Read Reviews</Link></h6>
                </div>
            </div>
        </section>

        </>
    )
}
