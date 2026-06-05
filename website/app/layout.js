import "./globals.css"
import "app/favicon.ico"
import { barlow, firaSans } from '@/lib/font'

export const metadata = {
    title: 'Octadesk | Atendimento e Vendas',
    description: 'Resolva metade dos seus atendimentos automaticamente, 24h por dia.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" className={`${firaSans.variable} ${barlow.variable}`}>
            <body className="antialiased min-h-screen">
                {children}
            </body>
        </html>
    )
}
