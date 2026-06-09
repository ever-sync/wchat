import re

with open("app/page.js", "r") as f:
    content = f.read()

replacements = {
    # About Area
    "[ About us ]": "[ Sobre nós ]",
    "We combine design, AI, and cybersecurity expertise\n                            to create secure digital environments.": "Nascemos pra resolver o caos do atendimento comercial no WhatsApp",
    "Data Protection": "Gestão Comercial Integrada",
    "Vulnerability Management": "Atendimento e Inbox Compartilhado",
    "Threat Intelligence": "Automações e Campanhas de Vendas",
    "Risk Assessment": "Agente de Inteligência Artificial",
    "Incident Response": "Novos recursos toda semana",
    "Compliance Audits": "Uptime garantido para o seu negócio",
    "Discover AIOR": "Conheça nossa história",
    "Experience": "Recursos Integrados",
    "25": "50",
    
    # Brands Area
    "Trusted by the best companies": "Mais de 1.500 empresas vendem melhor com o wChat",
    
    # CTA Top
    "Generate AI Chatbots in a Few Clicks": "Eleve o atendimento comercial do seu time",
    "Get started free in minutes. No credit card required": "Comece em minutos. Sem cartão de crédito.",
    "Try it Free": "Começar teste grátis"
}

for old_str, new_str in replacements.items():
    content = content.replace(old_str, new_str)

with open("app/page.js", "w") as f:
    f.write(content)

print("About and Brand text replaced successfully!")
