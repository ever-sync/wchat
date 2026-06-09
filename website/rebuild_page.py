#!/usr/bin/env python3
"""
Rebuild page.js from HTML template + apply all wChat translations in one pass.
"""
import re

TEMPLATE = "/Users/rapha/Downloads/aior-ai-startup-technology-html-template-2026-06-02-01-46-30-utc/download-version/home-ai-chatbot-tool-op.html"

with open(TEMPLATE, "r", encoding="utf-8") as f:
    html = f.read()

# Extract body content
body_match = re.search(r'<body[^>]*>(.*)</body>', html, re.DOTALL)
if not body_match:
    raise Exception("No body found")
body = body_match.group(1)

# Remove script tags (loaded in layout.js)
body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.DOTALL)
body = re.sub(r'<script[^>]*></script>', '', body)
body = re.sub(r'<script[^>]*\s*/>', '', body)

# HTML -> JSX conversions
# class -> className
body = re.sub(r'\bclass=', 'className=', body)
# for -> htmlFor
body = re.sub(r'\bfor=', 'htmlFor=', body)
# tabindex -> tabIndex
body = re.sub(r'\btabindex=', 'tabIndex=', body)

# Self-closing tags
for tag in ['img', 'input', 'br', 'hr', 'meta', 'link', 'source']:
    body = re.sub(rf'<({tag}\b[^>]*?)(?<!/)\s*>', rf'<\1 />', body)

# SVG attributes
body = body.replace('stroke-linecap', 'strokeLinecap')
body = body.replace('stroke-linejoin', 'strokeLinejoin')
body = body.replace('stroke-width', 'strokeWidth')
body = body.replace('stroke-dasharray', 'strokeDasharray')
body = body.replace('stroke-dashoffset', 'strokeDashoffset')
body = body.replace('fill-rule', 'fillRule')
body = body.replace('clip-rule', 'clipRule')
body = body.replace('clip-path', 'clipPath')
body = body.replace('stop-color', 'stopColor')
body = body.replace('stop-opacity', 'stopOpacity')
body = body.replace('font-family=', 'fontFamily=')
body = body.replace('font-size=', 'fontSize=')
body = body.replace('text-anchor=', 'textAnchor=')

# HTML comments -> JSX comments
body = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', body, flags=re.DOTALL)

# Fix inline style on progress circle SVG
body = re.sub(
    r'style="([^"]*?)transition:\s*stroke-dashoffset\s+10ms\s+linear\s+0s;\s*stroke-dasharray:\s*307\.919[^"]*stroke-dashoffset:\s*307\.919[^"]*"',
    "style={{ transition: 'stroke-dashoffset 10ms linear 0s', strokeDasharray: '307.919, 307.919', strokeDashoffset: '307.919' }}",
    body
)

# Fix remaining style="..." to style={{...}} for common patterns  
# Only handle the data-bg-src ones (leave them as is, they're handled by JS)

# Remove duplicate preloader/cursor sections that layout.js handles
# (Keep them - they're part of the template design)

print("HTML->JSX conversion done. Applying translations...")

# ==================== TRANSLATIONS ====================

# --- PRELOADER ---
body = body.replace(
    '<span className="loader-letter">A</span>\n            <span className="loader-letter">I</span>\n            <span className="loader-letter">O</span>\n            <span className="loader-letter">R</span>',
    '<span className="loader-letter">w</span>\n            <span className="loader-letter">C</span>\n            <span className="loader-letter">h</span>\n            <span className="loader-letter">a</span>\n            <span className="loader-letter">t</span>'
)

# --- SEARCH ---
body = body.replace('What are you looking for?', 'O que voce procura?')

# --- MOBILE MENU (simplify) ---
# Find and replace the mobile menu content
mobile_menu_items = [
    ('home-ai-startup.html">Home', '/">Inicio'),
    ('about.html">About Us', '#about-sec">Sobre'),
    ('features.html">Features', '#features-sec">Recursos'),
]
for old, new in mobile_menu_items:
    body = body.replace(old, new)

# --- MOBILE LOGO ---
body = body.replace('alt="Aior "', 'alt="wChat"')
body = body.replace('alt="Aior"', 'alt="wChat"')

# --- HEADER NAV ---
body = body.replace('>About Us<', '>Sobre<')
body = body.replace('>Features<', '>Recursos<')
body = body.replace('>Case Studies<', '>Funcionalidades<')
body = body.replace('>Blog<', '>Blog<')
body = body.replace('>Contact Us<', '>Contato<')
body = body.replace('Start Free Trial', 'Comecar gratis')

# --- HERO ---
body = body.replace('Smart <span className="title"> Conversations</span>. Seamless Customer Experiences',
                     'Venda mais pelo <span className="title"> WhatsApp</span>, sem perder o controle.')
body = body.replace('Boost engagement, automate support, and scale your business with our AI-powered chatbot tool.',
                     'CRM, inbox compartilhada, Agentes de IA e automacoes de marketing em uma unica plataforma.')
body = body.replace('>Build Your Chatbot<', '>Criar Conta Gratis<')
body = body.replace('>Book a Demo<', '>Falar com Consultor<')

# Hero image
body = body.replace('assets/img/hero/hero-img6.png', 'assets/img/wchat/image.png')

# --- ABOUT ---
body = body.replace('>About us<', '>Sobre nos<')
body = body.replace('We combine design, AI, and cybersecurity expertise\n                            to create secure digital environments.',
                     'Nascemos pra resolver o caos do atendimento comercial no WhatsApp')
body = body.replace('>Data Protection<', '>Gestao Comercial Integrada<')
body = body.replace('>Vulnerability Management<', '>Inbox Compartilhado<')
body = body.replace('>Threat Intelligence<', '>Automacoes e Campanhas<')
body = body.replace('>Risk Assessment<', '>Agente de IA<')
body = body.replace('>Incident Response<', '>Novos recursos toda semana<')
body = body.replace('>Compliance Audits<', '>99.9% de uptime<')
body = body.replace('Discover AIOR', 'Conheca o wChat')
body = body.replace('>Experience<', '>Recursos Integrados<')

# --- BRANDS ---
body = body.replace('Trusted by the best companies', 'Mais de 1.500 empresas vendem melhor com o wChat')

# --- FEATURES ---
body = body.replace('[ Key Features ]', '[ Recursos ]')
body = body.replace('An AI chatbot bot trained to answer questions about EmbedAI.', 'Tudo o que seu time precisa — em um so lugar')
body = body.replace('>AI Chatbot powered by ChatGPT<', '>CRM no WhatsApp<')
body = body.replace('>Customize look and feel<', '>Automacoes de Marketing<')
body = body.replace('>Share your AI chatbot<', '>Inbox Compartilhado<')
body = body.replace('>Multi-Channel Integration easily<', '>Relatorios em Tempo Real<')
body = body.replace('>Powered by ChatGPT &amp; Gemini AI<', '>Agente de IA Integrado<')
body = body.replace('>A Multilingual chatbot support<', '>API e Webhooks<')

# Feature card texts
feat_text_1 = "Brand owners can now create a powerful AI chatbot without any coding skills, streamlining your operations and focusing on what you do best. Use your own data seamlessly to make the chatbot unique to your brand."
feat_texts_new = [
    "Funis drag-and-drop, etapas personalizaveis e negociacoes sincronizadas em tempo real entre todo o time. Acompanhe cada deal do primeiro contato ao fechamento.",
    "Crie fluxos automaticos para nutrir leads, requalificar inativos e fechar vendas — sem esforco manual. Dispare campanhas segmentadas com poucos cliques.",
    "Toda a equipe atendendo no mesmo numero de WhatsApp, com filas de distribuicao, etiquetas, respostas rapidas e SLA de primeira resposta.",
    "Acompanhe conversao por etapa do funil, performance individual do time, SLA de atendimento e volume de mensagens — tudo em dashboards atualizados ao vivo.",
    "Automatize o primeiro atendimento com IA de verdade. A IA responde clientes, qualifica leads e escala para um humano quando necessario.",
    "Integre o wChat com qualquer sistema via API REST, webhooks em tempo real ou automacoes com N8N. Controle total da sua operacao.",
]

feat_text_2 = "Whether you're an influencer, musician, or local business owner, Arsturn allows you to train chatbots on diverse types of information. Save time by having a chatbot handle FAQs, event details, and fan engagement."

# Safe sequential replacement: replace one occurrence at a time
def replace_nth(s, old, new, n):
    """Replace the nth (0-based) occurrence of old with new in s."""
    idx = -1
    for _ in range(n + 1):
        idx = s.find(old, idx + 1)
        if idx == -1:
            return s  # not enough occurrences, return unchanged
    return s[:idx] + new + s[idx + len(old):]

# Replace each feature card text occurrence individually (0-indexed)
body = replace_nth(body, feat_text_1, feat_texts_new[0], 0)
body = replace_nth(body, feat_text_2, feat_texts_new[1], 0)
body = replace_nth(body, feat_text_1, feat_texts_new[2], 0)  # after 1st was replaced, this is now the "new 1st"
body = replace_nth(body, feat_text_1, feat_texts_new[3], 0)
body = replace_nth(body, feat_text_1, feat_texts_new[4], 0)
body = replace_nth(body, feat_text_1, feat_texts_new[5], 0)

# --- PROCESS / HOW IT WORKS ---
body = body.replace('[ How it works ]', '[ Por que escolher ]')
body = body.replace('Your AI Assistant in 3 Easy Steps', 'Mais do que um chat — uma operacao comercial inteira no WhatsApp')
body = body.replace('>Integrate<', '>10x produtividade<')
body = body.replace('Connect with your website or app in minutes.', 'Respostas rapidas, templates HSM, automacoes e agente IA aceleram o atendimento do seu time.')
body = body.replace('>Automate<', '>Multiusuario de verdade<')
body = body.replace('Train your chatbot with FAQs or let AI learn instantly.', 'Todo o time atendendo no mesmo numero com filas inteligentes e carga balanceada.')
body = body.replace('>Engage<', '>Tempo real<')
body = body.replace('Start conversations and convert more visitors.', 'Mudancas no CRM e status refletem instantaneamente para toda a equipe.')

# --- CTA ---
body = body.replace('Generate AI Chatbots in a Few Clicks', 'Eleve o atendimento comercial do seu time')
body = body.replace('Get started free in minutes. No credit card required', 'Comece em minutos. Sem cartao de credito.')
body = body.replace('>Try it Free<', '>Comecar teste gratis<')

# --- INTEGRATIONS ---
body = body.replace('[ Integrations ]', '[ Integracoes ]')
body = body.replace('Connect Aiorbot to The Apps You Love', 'Conecte o wChat as ferramentas que voce ja usa')
body = body.replace('>Find Your Workflow<', '>Ver integracoes<')
body = body.replace('and 120+ tools to integrate', 'WhatsApp, N8N, Webhooks e mais')

# --- SERVICE/CASE STUDIES SLIDER ---
body = body.replace('[ Case Study ]', '[ Funcionalidades ]')
body = body.replace('Success Stories', 'Conheca o wChat em detalhes')

svc_text = "From converting up to 44% of chats into sales and cutting support costs, to gaining actionable insights for new strategies, brands in any industry can thrive with Aiorchat."
body = body.replace(svc_text + " ", "Automatize o primeiro atendimento com IA, gerencie vendas no CRM estilo Kanban e conecte toda a equipe no mesmo WhatsApp. ")
body = body.replace(svc_text + ".", "Automatize o atendimento com IA, gerencie vendas no CRM Kanban e conecte toda a equipe no mesmo WhatsApp.")

body = body.replace('>All Success Stories<', '>Ver todas<')
body = body.replace('>Tropic feel<', '>Agente IA<')
body = body.replace('>Air focus<', '>CRM Kanban<')
body = body.replace('>SaaSup<', '>Inbox Compartilhado<')

# Service card descriptions
svc_card = "From converting up to 44% of chats into sales and cutting support costs, to gaining actionable insights for new strategies, brands in any industry can thrive with Aiorchat.."
body = body.replace(svc_card, "Automatize o primeiro atendimento com IA. A IA responde clientes, qualifica leads e escala para um humano quando necessario.")

svc_card2 = "Create beautiful, human-like voiceovers in seconds, ideal for podcasts, video narration, and audiobooks. Start chatting effortlessly with AI."
body = body.replace(svc_card2, "Organize negociacoes em funis visuais Kanban. Arraste deals entre etapas, acompanhe valores e historico — tudo conectado ao WhatsApp.")

svc_card3 = "Streamline your support with bots that handle routine queries 24/7, freeing your team for complex issues."
body = body.replace(svc_card3, "Todas as conversas do seu time em um unico painel. Filtre por atendente, status ou etiqueta. Historico completo sempre.")

# --- TESTIMONIALS ---
body = body.replace('[ Testimonials ]', '[ Depoimentos ]')
body = body.replace('What our Clients say About Aiorbot', 'O que nossos clientes dizem sobre o wChat')
body = body.replace('>Explore All<', '>Ver todos<')

testi_old = '''"Unrivaled brilliance surpassing all others. Highly recommended for novices and
                                experts
                                alike. We will hire them for sure anytime."'''
body = body.replace(testi_old, '"O wChat transformou completamente nossa operacao comercial. Antes perdiamos leads no WhatsApp pessoal, agora temos controle total do funil de vendas."')
body = body.replace('>John Peter<', '>Carlos Silva<')
body = body.replace('>CEO and Co-founder<', '>Diretor Comercial<')

# --- PRICING ---
body = body.replace('[ Flexible Pricing ]', '[ Planos ]')
body = body.replace('>Pricing Built for You<', '>Escolha o plano ideal pro seu time<')
body = body.replace('With a variety of features and options, we have a plan that will meet your needs and help you achieve your goals.', 'Comece em minutos. Sem cartao de credito. Cancele quando quiser.')
body = body.replace('>Monthly<', '>Mensal<')
body = body.replace('>Yearly<', '>Anual<')

# Price cards
body = body.replace('>Basic<', '>Starter<')
body = body.replace('>Free<', '>R$ 119<')
body = body.replace('>Billed Monthly<', '>por mes<')
body = body.replace("It's easy to create an AI chatbot", "Para times que estao comecando")

body = body.replace('>Standard<', '>Times<')
body = body.replace('>Best<', '>Mais popular<')
body = body.replace('>$45.00<', '>R$ 349<')
body = body.replace('>Advanced models and more tools<', '>Para times em crescimento<')

body = body.replace('>Pro<', '>Business<')
body = body.replace('>$89.00<', '>R$ 799<')
body = body.replace('>Best for production and teams<', '>Para operacoes robustas<')

# Feature lists in pricing
body = body.replace('50 Message credits/moth', 'Conversas ilimitadas')
body = body.replace('500,000 characters/chatbot', 'CRM completo com funis')
body = body.replace('1 Chatbot', 'Templates HSM')
body = body.replace('Embed on unlimited websites', 'Relatorios em tempo real')
body = body.replace('Upload multiple files', 'Respostas rapidas')
body = body.replace('24/7 Support', 'Suporte via WhatsApp')
body = body.replace('>Get Started<', '>Comecar agora<')

# Yearly pricing
body = body.replace('>$35.00<', '>R$ 99<')
body = body.replace('>$75.00<', '>R$ 299<')
body = body.replace('>$69.00<', '>R$ 699<')
body = body.replace('>Billed Yearly<', '>por mes (anual)<')
body = body.replace(' Most Popular', ' Mais popular')

# --- FAQ ---
body = body.replace('[ Common Question ]', '[ Duvidas ]')
body = body.replace('>Frequently Asked Question<', '>Perguntas frequentes<')
body = body.replace('>View All<', '>Tirar mais duvidas<')

body = body.replace('Is AiorChat completely free?', 'O que e o wChat?')
body = body.replace('What kind of data can I train the bot on?', 'Como funciona a integracao com o WhatsApp?')
body = body.replace("Can I customize my chatbot's look &amp; feel?", 'Quantos atendentes podem usar ao mesmo tempo?')
body = body.replace('Can I update the trained data?', 'Posso testar antes de assinar?')
body = body.replace('How does the chatbot learn from the data?', 'Meus dados ficam seguros?')

# FAQ answers
faq_answers_map = {
    "Yes, our Chatbot tool is 100% free to use for anyone who registers on our platform. The platform does offer a paid, Pro tier that contains various premium features and higher usage limits. The free tier will forever be free and lacks no features compared to its premium counterparts.":
        "O wChat e uma plataforma completa de CRM, atendimento e automacoes no WhatsApp. Ele centraliza conversas, negociacoes, campanhas e IA em uma unica interface.",
    "Aiorchat works differently. It offers a no-code platform for building custom ChatGPTs. This means you have full control. Provide your own data, define the bot's tone and behavior, and customize its appearance. You get a personalized AI chatbot tailored exactly to your needs.":
        "O wChat se conecta ao seu WhatsApp atraves de uma API que permite multiplos atendentes no mesmo numero. Basta escanear o QR Code e pronto.",
    "We believe your chatbot should be an extension of your brand. Aiorchat allows you to customize the chatbot's color, chat icon, and the initial greeting message. Add a personal touch and ensure the chatbot aligns seamlessly with your brand identity.":
        "Depende do plano: o Starter inclui 2 usuarios, o Times ate 10 e o Business e ilimitado. Cada atendente tem login proprio com permissoes configuraveis.",
    "Yes, you can upload unlimited data and edit the uploaded data at any time. Your chatbot will learn from the newly updated data immediately. This ensures your chatbot is always equipped with the latest and most accurate information.":
        "Sim! Oferecemos 7 dias de teste gratis em todos os planos — sem pedir cartao de credito. Voce configura tudo, conecta seu WhatsApp e ja comeca a usar.",
    "Our AI engine processes the text you provide, understanding the context and extracting valuable insights. When a user asks a question, the chatbot analyzes it against the trained data and generates an accurate and relevant response.":
        "Sim. O wChat usa criptografia AES para credenciais, autenticacao segura, Row Level Security no banco de dados e isolamento completo por tenant.",
}
for old_a, new_a in faq_answers_map.items():
    body = body.replace(old_a, new_a)

# --- BLOG ---
body = body.replace('[ Technology Exploration ]', '[ Blog ]')
body = body.replace('>Research Insights &amp; Updates<', '>Conteudos sobre vendas e atendimento<')
body = body.replace('>Latest AR enhances customer engagement daily<', '>Como aumentar suas vendas pelo WhatsApp em 2026<')
body = body.replace('>Transforming legal document review by aI<', '>5 automacoes que todo time comercial precisa<')
body = body.replace('>Open-Source LLMs: The Future of AI technology<', '>IA no atendimento: como implementar sem complicacao<')
body = body.replace(' Jan 20, 2050', ' Jun 01, 2026')
body = body.replace(' Jan 22, 2050', ' Mai 28, 2026')
body = body.replace(' Jan 23, 2050', ' Mai 20, 2026')
body = body.replace(' Jan 50, 2050', ' Jun 01, 2026')

# --- CONTACT ---
body = body.replace('Ready to Discuss your Project with us?', 'Pronto para vender mais pelo WhatsApp?')
body = body.replace('placeholder="Full Name"', 'placeholder="Nome completo"')
body = body.replace('placeholder="Email"', 'placeholder="E-mail"')
body = body.replace('placeholder="Phone Number"', 'placeholder="Telefone"')
body = body.replace('>Select Service<', '>Qual plano te interessa?<')
body = body.replace('>Bridal Makeup<', '>Starter — R$ 99/mes<')
body = body.replace('>Beard Treatments<', '>Times — R$ 299/mes<')
body = body.replace('>Hair Coloring<', '>Business — R$ 699/mes<')
body = body.replace('>Aromatherapy <', '>Ainda nao sei<')
body = body.replace('placeholder="Your Message"', 'placeholder="Sua mensagem"')
body = body.replace('By sending this form I confirm that I have read and accept the Privacy Policy', 'Ao enviar, confirmo que li e aceito a Politica de Privacidade')
body = body.replace('>Send Message <', '>Enviar mensagem <')

body = body.replace('The collaborative approach they took was refreshing and effective', 'O wChat mudou a forma como nossa equipe vende pelo WhatsApp. Recomendo demais!')
body = body.replace('>Jems Colin<', '>Marina Oliveira<')
body = body.replace('>CTO, Ailitic<', '>Gerente Comercial<')

# --- FOOTER ---
body = body.replace('Try Aior Today Free', 'Comece a vender mais hoje')
body = body.replace('>Start Free Trial<', '>Comecar gratis<')
body = body.replace('>Book a Demo<', '>Falar com consultor<')

body = body.replace('[ About Us ]', '[ Sobre nos ]')
body = body.replace('Aior is a digital production studio that brings your ideas to life through visually captivating designs and interactive experiences. ',
                     'O wChat e a plataforma completa de CRM, inbox compartilhado e IA para times que vendem pelo WhatsApp. Teste 7 dias gratis.')

body = body.replace('[ Use Cases ]', '[ Produto ]')
body = body.replace('>Aiorchat AI<', '>CRM no WhatsApp<')
body = body.replace('>Aiorchat vs Chatty AI<', '>Inbox Compartilhado<')
body = body.replace('>Convert Store visitors<', '>Automacoes de Marketing<')
body = body.replace('>Automate Support<', '>Agente IA<')
body = body.replace('>Actionable Insights<', '>Relatorios<')

body = body.replace('[ Products ]', '[ Empresa ]')
body = body.replace('>Tech &amp; Agency<', '>Sobre nos<')
body = body.replace('>Affiliate Program<', '>Blog<')
body = body.replace('>Become a Partner<', '>Contato<')
body = body.replace('>How it Works<', '>Como funciona<')
body = body.replace('>Testimonials<', '>Depoimentos<')

body = body.replace('[ Features ]', '[ Recursos ]')
body = body.replace('>Real Time Analytics<', '>Painel em tempo real<')
body = body.replace('>Seamless Integration<', '>Integracoes e API<')
body = body.replace('>Automated Reporting<', '>Relatorios automaticos<')
body = body.replace('>Direct Support<', '>Suporte dedicado<')
body = body.replace('>Data Import/Export<', '>Webhooks e N8N<')

# Copyright
body = re.sub(
    r'Copyright.*?Aior.*?All Rights Reserved\.',
    'Copyright wChat 2026. Todos os direitos reservados.',
    body
)

# Wrap in React component
output = '''
export default function Page() {
  return (
    <>
''' + body + '''
    </>
  );
}
'''

with open("app/page.js", "w", encoding="utf-8") as f:
    f.write(output)

line_count = output.count('\n')
print(f"page.js rebuilt with {line_count} lines. All translations applied.")
