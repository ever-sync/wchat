import React from 'react'
import Link from "next/link"

const FEATURES = [
    "CRM no WhatsApp",
    "Inbox compartilhado",
    "Funis de venda",
    "Automações",
    "Campanhas",
    "Templates HSM",
    "Respostas rápidas",
    "Etiquetas",
    "Tarefas",
    "Filas de atendimento",
    "Relatórios em tempo real",
    "Formulários",
    "Pop-ups",
    "Botões de WhatsApp",
    "Web Push",
    "Link na Bio",
    "Multiusuário",
    "Permissões por papel",
    "Notas internas",
    "API e webhooks",
]

function Row() {
    return (
        <ul className="article-list clearfix">
            {Array.from({ length: 4 }).flatMap((_, repIdx) =>
                FEATURES.map((label, i) => (
                    <li key={`${repIdx}-${i}`}><Link href="/pricing">{label}</Link></li>
                ))
            )}
        </ul>
    )
}

export default function Article() {
    return (
        <>
            <section className="article-section">
                <div className="outer-container">
                    <Row />
                    <Row />
                </div>
            </section>
        </>
    )
}
