import "./globals.css"
import "app/favicon.ico"
import { barlow, firaSans } from '@/lib/font'
import Script from 'next/script'
export const metadata = {
    title: 'wChat | Venda mais pelo WhatsApp',
    description: 'CRM, inbox compartilhada, Agente IA e automações de marketing em uma só plataforma — para o seu time vender e atender melhor.',
    openGraph: {
        title: 'wChat | Venda mais pelo WhatsApp',
        description: 'CRM, inbox compartilhada, Agente IA e automações de marketing em uma só plataforma.',
        url: 'https://wchat.com.br',
        siteName: 'wChat',
        locale: 'pt_BR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'wChat | Venda mais pelo WhatsApp',
        description: 'CRM, inbox compartilhada, Agente IA e automações de marketing em uma só plataforma.',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" className={`${firaSans.variable} ${barlow.variable}`}>
            <head>
                {/* Google Fonts (Aior template) */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&family=Urbanist:ital,wght@0,100..900;1,100..900&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />

                {/* All CSS Files */}
                <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
                <link rel="stylesheet" href="/assets/css/fontawesome.min.css" />
                <link rel="stylesheet" href="/assets/css/magnific-popup.min.css" />
                <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
                <link rel="stylesheet" href="/assets/css/style.css" />
            </head>
            <body className="antialiased min-h-screen theme7">
                {/* Custom Cursor */}
                <div className="mouseCursor cursor-outer"></div>
                <div className="mouseCursor cursor-inner"></div>

                {children}

                {/* All Scripts */}
                <Script src="/assets/js/vendor/jquery-3.7.1.min.js" strategy="beforeInteractive" />
                <Script src="/assets/js/swiper-bundle.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/bootstrap.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/jquery.magnific-popup.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/jquery.counterup.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/circle-progress.js" strategy="lazyOnload" />
                <Script src="/assets/js/jquery-ui.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/imagesloaded.pkgd.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/isotope.pkgd.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/nice-select.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/wow.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/gsap.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/ScrollTrigger.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/SplitText.js" strategy="lazyOnload" />
                <Script src="/assets/js/DrawSVGPlugin3.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/lenis.min.js" strategy="lazyOnload" />
                <Script src="/assets/js/main.js" strategy="lazyOnload" />
            </body>
        </html>
    )
}
