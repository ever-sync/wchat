#!/usr/bin/env python3
"""Tradução final completa do page.js — todas as seções restantes."""
import re

with open("app/page.js", "r") as f:
    content = f.read()

# ==================== PRELOADER ====================
content = content.replace(
    '<span className="loader-letter">A</span>\n'
    '            <span className="loader-letter">I</span>\n'
    '            <span className="loader-letter">O</span>\n'
    '            <span className="loader-letter">R</span>',
    '<span className="loader-letter">w</span>\n'
    '            <span className="loader-letter">C</span>\n'
    '            <span className="loader-letter">h</span>\n'
    '            <span className="loader-letter">a</span>\n'
    '            <span className="loader-letter">t</span>'
)

# ==================== SEARCH POPUP ====================
content = content.replace('What are you looking for?', 'O que você procura?')

# ==================== MOBILE MENU (simplificar) ====================
old_mobile = '''            <div className="th-mobile-menu">
                <ul>
                    <li className="menu-item-has-children">
                        <a href="home-ai-startup.html">Home</a>
                        <ul className="sub-menu">
                            <li><a href="home-ai-startup.html">Home Ai Startup</a></li>
                            <li><a href="home-ai-chatbot.html">Home Ai Chatbot</a></li>
                            <li><a href="home-ai-image-generate.html">Home Ai Image Generate</a></li>
                            <li><a href="home-ai-writer-tool.html">Home AI Writer Tool</a></li>
                            <li><a href="home-business-intelligence.html">Home Business Intelligence</a></li>
                            <li><a href="home-ai-agent.html">home-ai-agent</a></li>
                            <li><a href="home-productivity-tools.html">Home productivity tools</a></li>
                            <li><a href="home-ai-chatbot-tool.html">Home AI chatbot tool</a></li>
                            <li><a href="home-cloud-based-saas.html">Home cloud Based Saas</a></li>
                            <li><a href="home-saas-product-showcase.html">Home Saas product Showcase</a></li>
                            <li><a href="home-finance-crypto-service.html">Home finance crypto service</a> </li>
                        </ul>
                    </li>
                    <li><a href="about.html">About Us</a></li>
                    <li><a href="features.html">Features</a></li>

                    <li className="menu-item-has-children">
                        <a href="#">Case Studies</a>
                        <ul className="sub-menu">
                            <li><a href="case-studies.html">Case Studies</a></li>
                            <li><a href="case-studies-2.html">Case Studies style 2</a></li>
                            <li><a href="case-studies-details.html">Case Studies Details</a></li>
                        </ul>
                    </li>
                    <li className="menu-item-has-children">
                        <a href="#">Pages</a>
                        <ul className="sub-menu">
                            <li><a href="cases.html">cases</a></li>
                            <li><a href="integrations.html">Integrations</a></li>
                            <li><a href="team.html">Team</a></li>
                            <li><a href="team-details.html">Team Details</a></li>
                            <li><a href="faq.html">FAQ</a></li>
                            <li><a href="testimonial.html">Testimonial</a></li>
                            <li><a href="pricing.html">Price Table</a></li>
                            <li><a href="contact.html">Contact Us</a></li>
                            <li><a href="error.html">Error Page</a></li>
                        </ul>
                    </li>


                    <li className="menu-item-has-children">
                        <a href="#">Blog</a>
                        <ul className="sub-menu">
                            <li><a href="blog.html">Blog</a></li>
                            <li><a href="blog-details.html">Blog Details</a></li>
                        </ul>
                    </li>
                </ul>
            </div>'''

new_mobile = '''            <div className="th-mobile-menu">
                <ul>
                    <li><a href="#hero">Início</a></li>
                    <li><a href="#about-sec">Sobre</a></li>
                    <li><a href="#features-sec">Recursos</a></li>
                    <li><a href="#case-studies-sec">Funcionalidades</a></li>
                    <li><a href="#faq-sec">FAQ</a></li>
                    <li><a href="#contact-sec">Contato</a></li>
                </ul>
            </div>'''
content = content.replace(old_mobile, new_mobile)

# ==================== MOBILE LOGO ====================
content = content.replace(
    '<a href="home-ai-startup.html"><img src="assets/img/logo.svg" alt="Aior " /></a>',
    '<a href="/"><img src="assets/img/logo9.svg" alt="wChat" /></a>'
)

# ==================== HEADER LOGO ====================
content = content.replace(
    '<a className="icon-masking" href="home-ai-startup.html"><img src="assets/img/logo8.svg" alt="Aior " /></a>',
    '<a className="icon-masking" href="/"><img src="assets/img/logo9.svg" alt="wChat" /></a>'
)

# ==================== DESKTOP NAV — replace the entire mega menu with simple links ====================
old_nav_start = '''                                    <li className="menu-item-has-children mega-menu-wrap">
                                        <a href="index.html">Home</a>
                                        <ul className="mega-menu mega-menu-content allow-natural-scroll">'''
# Find the end of the mega menu and the simple nav items
old_nav_end_marker = '''                                    <li><a href="#about-sec">About Us</a></li>
                                    <li><a href="#features-sec">Features</a></li>
                                    <li><a href="#case-studies-sec">Case Studies</a></li>
                                    <li><a href="#blog-sec">Blog</a></li>
                                    <li><a href="#contact-sec">Contact Us</a></li>'''

# Replace the nav items that are already simple
content = content.replace(old_nav_end_marker,
    '''                                    <li><a href="#about-sec">Sobre</a></li>
                                    <li><a href="#features-sec">Recursos</a></li>
                                    <li><a href="#case-studies-sec">Funcionalidades</a></li>
                                    <li><a href="#faq-sec">FAQ</a></li>
                                    <li><a href="#contact-sec">Contato</a></li>''')

# Remove the mega menu entirely
mega_start = content.find('<li className="menu-item-has-children mega-menu-wrap">')
if mega_start != -1:
    mega_end = content.find('</li>\n                                    <li><a href="#about-sec">Sobre</a></li>', mega_start)
    if mega_end != -1:
        content = content[:mega_start] + '<li><a href="#hero">Início</a></li>\n                                    ' + content[mega_end+len('</li>\n                                    '):]

# ==================== HEADER CTA BUTTON ====================
content = content.replace('Start R$ 99 Trial', 'Começar grátis')

# ==================== INTEGRATIONS SECTION ====================
content = content.replace('[ Integrations ]', '[ Integrações ]')
content = content.replace('Connect Aiorbot to The Apps You Love', 'Conecte o wChat às ferramentas que você já usa')
content = content.replace('Find Your Workflow', 'Ver integrações')
content = content.replace('and 120+ tools to integrate', 'WhatsApp, N8N, Webhooks e mais')

# ==================== SERVICE SLIDER CARDS ====================
content = content.replace('Dalfilo interior', 'CRM Kanban')
content = content.replace('Burger Motorsports', 'Inbox Compartilhado')
content = content.replace('All Conheça o wChat em detalhes', 'Ver todas as funcionalidades')

# Fix the 2nd card text
old_card2_text = 'Automatize o primeiro atendimento com inteligência artificial de verdade. A IA responde clientes, qualifica leads e escala para um humano quando necessário.'
# First occurrence is card 1 (Agente IA) - keep it. Change 2nd and 3rd
parts = content.split(old_card2_text)
if len(parts) >= 4:
    content = parts[0] + old_card2_text + \
              parts[1] + 'Organize negociações em funis visuais no estilo Kanban. Arraste deals entre etapas, acompanhe valores e histórico — tudo conectado ao WhatsApp.' + \
              parts[2] + 'Todas as conversas do seu time em um único painel. Filtre por atendente, status, etiqueta ou canal. Histórico completo sempre.' + \
              parts[3]

# ==================== TESTIMONIALS ====================
content = content.replace('[ Testimonials ]', '[ Depoimentos ]')
content = content.replace('What our Clients say About Aiorbot', 'O que nossos clientes dizem sobre o wChat')
content = content.replace('Explore All', 'Ver todos')

# Testimonial card texts
content = content.replace(
    '"Unrivaled brilliance surpassing all others. Highly recommended for novices and\n                                experts\n                                alike. We will hire them for sure anytime."',
    '"O wChat transformou completamente nossa operação comercial. Antes perdíamos leads no WhatsApp pessoal, agora temos controle total do funil de vendas."'
)
content = content.replace('John Peter', 'Carlos Silva')
content = content.replace('CEO and Co-founder', 'Diretor Comercial')

# ==================== PRICING — COMPLETE REWRITE ====================
content = content.replace('[ Pricing ]', '[ Planos ]')
content = content.replace('Pricing Plan', 'Escolha o plano ideal pro seu time')
content = content.replace('Monthly', 'Mensal')
content = content.replace('Yearly', 'Anual')
content = content.replace('Most Popular', 'Mais popular')

# === MONTHLY pricing cards ===
# Card 1 - Starter (monthly)
content = content.replace(
    '''                            <h3 className="box-title">R$ 99</h3>
                                <h4 className="box-price"><span className="dollar">$</span>0<span className="duration">/month</span></h4>
                                <p className="subtitle">150 credits</p>''',
    '''                            <h3 className="box-title">Starter</h3>
                                <h4 className="box-price"><span className="dollar">R$</span>119<span className="duration">/mês</span></h4>
                                <p className="subtitle">Para times começando</p>''',
    1  # only first occurrence
)

# Card 2 - Times (monthly)
content = content.replace(
    '''                            <h3 className="box-title">pro</h3>
                                <h4 className="box-price"><span className="dollar">$</span>199<span className="duration">/month</span></h4>
                                <p className="subtitle">50,000 credits</p>''',
    '''                            <h3 className="box-title">Times</h3>
                                <h4 className="box-price"><span className="dollar">R$</span>349<span className="duration">/mês</span></h4>
                                <p className="subtitle">Para times em crescimento</p>''',
    1
)

# Card 3 - Business (monthly)
content = content.replace(
    '''                            <h3 className="box-title">business</h3>
                                <h4 className="box-price"><span className="dollar">$</span>599<span className="duration">/month</span></h4>
                                <p className="subtitle">95,000 credits</p>''',
    '''                            <h3 className="box-title">Business</h3>
                                <h4 className="box-price"><span className="dollar">R$</span>799<span className="duration">/mês</span></h4>
                                <p className="subtitle">Para operações robustas</p>''',
    1
)

# === YEARLY pricing cards ===
content = content.replace(
    '''                            <h3 className="box-title">R$ 99</h3>
                                <h4 className="box-price"><span className="dollar">$</span>99<span className="duration">/month</span></h4>
                                <p className="subtitle">150 credits</p>''',
    '''                            <h3 className="box-title">Starter</h3>
                                <h4 className="box-price"><span className="dollar">R$</span>99<span className="duration">/mês</span></h4>
                                <p className="subtitle">Para times começando</p>'''
)

content = content.replace(
    '''                            <h3 className="box-title">pro</h3>
                                <h4 className="box-price"><span className="dollar">$</span>399<span className="duration">/month</span></h4>
                                <p className="subtitle">50,000 credits</p>''',
    '''                            <h3 className="box-title">Times</h3>
                                <h4 className="box-price"><span className="dollar">R$</span>299<span className="duration">/mês</span></h4>
                                <p className="subtitle">Para times em crescimento</p>'''
)

content = content.replace(
    '''                            <h3 className="box-title">business</h3>
                                <h4 className="box-price"><span className="dollar">$</span>699<span className="duration">/month</span></h4>
                                <p className="subtitle">95,000 credits</p>''',
    '''                            <h3 className="box-title">Business</h3>
                                <h4 className="box-price"><span className="dollar">R$</span>699<span className="duration">/mês</span></h4>
                                <p className="subtitle">Para operações robustas</p>'''
)

# Pricing feature lists — replace ALL occurrences
content = content.replace('50 Message credits/moth', 'Conversas ilimitadas')
content = content.replace('500,000 characters/chatbot', 'CRM completo com funis')
content = content.replace('1 Chatbot', 'Templates HSM')
content = content.replace('Embed on unlimited websites', 'Relatórios em tempo real')
content = content.replace('Upload multiple files', 'Respostas rápidas')
content = content.replace('24/7 Support', 'Suporte via WhatsApp')

# Fix all CTA buttons in pricing
content = content.replace('Assinar Starter', 'Começar agora')

# ==================== FAQ ====================
content = content.replace('[ FAQ ]', '[ Dúvidas ]')
content = content.replace('Frequently Ask Questions', 'Perguntas frequentes')
content = content.replace('View All', 'Tirar mais dúvidas')

# FAQ questions
content = content.replace('1. How long does it take to set up Zipchat?', '1. O que é o wChat?')
content = content.replace('2. How does it work?', '2. Como funciona a integração com o WhatsApp?')
content = content.replace('3. does it work on any site/CMS?', '3. Quantos atendentes podem usar ao mesmo tempo?')
content = content.replace('4. What languages does it speak?', '4. Posso testar antes de assinar?')
content = content.replace('5. can you integrate with CRM and support platform?', '5. Meus dados ficam seguros?')

# FAQ answers — the template has the same answer repeated 5 times
faq_old_answer = '''Aior is a task management platform designed for startups and
                                        growing teams. It helps you organize projects.. They are devoted to delivering
                                        customized support and can provide you with an extensive estimate tailored to
                                        your unique'''

faq_answers = [
    'O wChat é uma plataforma completa de CRM, atendimento e automações no WhatsApp. Ele centraliza conversas, negociações, campanhas e inteligência artificial em uma única interface — com permissões por papel, isolamento por tenant e painel em tempo real para gestores.',
    'O wChat se conecta ao seu WhatsApp através de uma API que permite múltiplos atendentes no mesmo número. Basta escanear o QR Code e pronto — toda a equipe passa a atender pela plataforma, sem precisar instalar nada no celular.',
    'Depende do plano: o Starter inclui 2 usuários, o Times até 10 e o Business é ilimitado. Cada atendente tem login próprio com permissões configuráveis (admin, gerente, operação).',
    'Sim! Oferecemos 7 dias de teste grátis em todos os planos — sem pedir cartão de crédito. Você configura tudo, conecta seu WhatsApp e já começa a usar.',
    'Sim. O wChat usa criptografia AES para credenciais, autenticação segura, Row Level Security no banco de dados e isolamento completo por tenant. Cada empresa vê apenas seus próprios dados.',
]

parts = content.split(faq_old_answer)
if len(parts) >= 6:
    new_content = parts[0]
    for i in range(5):
        new_content += faq_answers[i] + parts[i + 1]
    if len(parts) > 6:
        for j in range(6, len(parts)):
            new_content += faq_old_answer + parts[j]
    content = new_content

# ==================== BLOG ====================
content = content.replace('[ Technology Exploration ]', '[ Blog ]')
content = content.replace('Research Insights & Updates', 'Conteúdos sobre vendas e atendimento')
content = content.replace('Latest AR enhances customer engagement daily', 'Como aumentar suas vendas pelo WhatsApp em 2026')
content = content.replace('Transforming legal document review by aI', '5 automações que todo time comercial precisa')
content = content.replace('Open-Source LLMs: The Future of AI technology', 'IA no atendimento: como implementar sem complicação')
content = content.replace(' Jan 20, 2050', ' Jun 01, 2026')
content = content.replace(' Jan 22, 2050', ' Mai 28, 2026')
content = content.replace(' Jan 23, 2050', ' Mai 20, 2026')
content = content.replace(' Jan 50, 2050', ' Jun 01, 2026')

# ==================== CONTACT FORM ====================
content = content.replace('Ready to Discuss your Businessject with us?', 'Pronto para vender mais pelo WhatsApp?')
content = content.replace('Full Name', 'Nome completo')
content = content.replace('placeholder="Email"', 'placeholder="E-mail"')
content = content.replace('Phone Number', 'Telefone')

# Replace select options
content = content.replace('Select Service', 'Qual plano te interessa?')
content = content.replace('Bridal Makeup', 'Starter — R$ 99/mês')
content = content.replace('Beard Treatments', 'Times — R$ 299/mês')
content = content.replace('Hair Coloring', 'Business — R$ 699/mês')
content = content.replace('Aromatherapy', 'Ainda não sei')
content = content.replace('Your Message', 'Sua mensagem')
content = content.replace('By sending this form I confirm that I have read and accept the Privacy Policy', 'Ao enviar, confirmo que li e aceito a Política de Privacidade')
content = content.replace('Send Message', 'Enviar mensagem')

# Contact testimonial
content = content.replace('The collaborative approach they took was refreshing and effective', 'O wChat mudou a forma como nossa equipe vende pelo WhatsApp. Recomendo demais!')
content = content.replace('Jems Colin', 'Marina Oliveira')
content = content.replace('CTO, Ailitic', 'Gerente Comercial')

# ==================== FOOTER ====================
content = content.replace('Try Aior Today R$ 99', 'Comece a vender mais hoje')
content = content.replace('Começar grátis', 'Começar grátis')
content = content.replace('Book a Demo', 'Falar com consultor')

content = content.replace(
    'Aior is a digital production studio that brings your ideas to life through visually captivating designs and interactive experiences.',
    'O wChat é a plataforma completa de CRM, inbox compartilhado e IA para times que vendem pelo WhatsApp. Teste 7 dias grátis.'
)

content = content.replace('[ Use Cases ]', '[ Produto ]')
content = content.replace('Aiorchat AI', 'CRM no WhatsApp')
content = content.replace('Aiorchat vs Chatty AI', 'Inbox Compartilhado')
content = content.replace('Convert Store visitors', 'Automações de Marketing')
content = content.replace('Automate Support', 'Agente IA')
content = content.replace('Actionable Insights', 'Relatórios')

content = content.replace('[ Businessducts ]', '[ Empresa ]')
content = content.replace('Tech & Agency', 'Sobre nós')
content = content.replace('Affiliate Businessgram', 'Blog')
content = content.replace('Beacome a Partner', 'Contato')
content = content.replace('How it Works', 'Como funciona')

content = content.replace('[ Features ]', '[ Recursos ]')
content = content.replace('Real Time Analytics', 'Painel em tempo real')
content = content.replace('Seamless Integration', 'Integrações e API')
content = content.replace('Automated Reporting', 'Relatórios automáticos')
content = content.replace('Direct Support', 'Suporte dedicado')
content = content.replace('Data Import/Export', 'Webhooks e N8N')

# Copyright
content = content.replace(
    '<i className="fal fa-copyright"></i> Copyright <a href="https://themeforest.net/user/themehour">Aior </a> 2026 . All Rights Reserved.',
    '<i className="fal fa-copyright"></i> Copyright <a href="/">wChat</a> 2026. Todos os direitos reservados.'
)

# ==================== REMAINING AIOR REFERENCES ====================
content = content.replace('alt="Aior "', 'alt="wChat"')
content = content.replace('alt="Aior"', 'alt="wChat"')

with open("app/page.js", "w") as f:
    f.write(content)

print("✅ Tradução final completa! Todas as seções foram atualizadas.")
