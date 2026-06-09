import re

with open("app/page.js", "r") as f:
    content = f.read()

replacements = {
    # 4. FUNCIONALIDADES DETALHADAS (Service Area - Slider)
    "[ Case Study ]": "[ Funcionalidades ]",
    "Success Stories": "Conheça o wChat em detalhes",
    "From converting up to 44% of chats into sales and cutting support\n                            costs, to gaining actionable insights for new strategies, brands in any industry can thrive with\n                            Aiorchat.": "Automatize o primeiro atendimento com IA, gerencie vendas no CRM estilo Kanban e conecte toda a equipe no mesmo WhatsApp.",
    "All Success Stories": "Ver todas as funcionalidades",
    
    # We have 3 cards in the slider:
    "Tropic feel": "Agente IA",
    "From converting up to 44% of chats into sales and cutting support costs, to gaining actionable insights for new strategies, brands in any industry can thrive with Aiorchat..": "Automatize o primeiro atendimento com inteligência artificial de verdade. A IA responde clientes, qualifica leads e escala para um humano quando necessário.",
    
    "Air focus": "CRM Kanban",
    "Create beautiful, human-like voiceovers in seconds, ideal for podcasts, video narration, and audiobooks. Start chatting effortlessly with AI.": "Organize negociações em funis visuais. Arraste deals entre etapas, acompanhe valores, histórico de conversas e tarefas — tudo conectado ao WhatsApp.",
    
    "SaaSup": "Inbox Compartilhado",
    "Streamline your support with bots that handle routine queries 24/7, freeing your team for complex issues.": "Todas as conversas de WhatsApp do seu time em um único painel. Filtre por atendente, status, etiqueta ou canal. Histórico completo sempre.",
    
    # 5. PLANOS E PREÇOS
    "[ Flexible Pricing ]": "Planos",
    "Pricing Built for You": "Escolha o plano ideal pro seu time",
    "With a variety of features and options, we have a plan that will meet your needs and help you achieve your goals.": "Comece em minutos. Sem cartão de crédito. Cancele quando quiser.",
    
    "Basic": "Starter",
    "Free": "R$ 99",
    "Billed Monthly": "Mensal",
    "It's easy to create an AI chatbot": "Para times que estão começando",
    "Get Started": "Assinar Starter",
    
    "Standard": "Times",
    "Best": "Mais popular",
    "$45.00": "R$ 299",
    "Advanced models and more tools": "Para times comerciais em crescimento",
    
    "Pro": "Business",
    "$89.00": "R$ 699",
    "Best for production and teams": "Para operações robustas",
    
    # 6. FAQ
    "[ Common Question ]": "[ Dúvidas ]",
    "Frequently Asked Question": "Perguntas frequentes",
    
    "Is AiorChat completely free?": "O que é o wChat?",
    "Yes, our Chatbot tool is 100% free to use for anyone who registers on our platform. The platform does offer a paid, Pro tier that contains various premium features and higher usage limits. The free tier will forever be free and lacks no features compared to its premium counterparts.": "O wChat é uma plataforma completa de CRM, atendimento e automações no WhatsApp. Ele centraliza conversas, negociações, campanhas e IA em uma única interface.",
    
    "What kind of data can I train the bot on?": "Como funciona a integração com o WhatsApp?",
    "Aiorchat works differently. It offers a no-code platform for building custom ChatGPTs. This means you have full control. Provide your own data, define the bot's tone and behavior, and customize its appearance. You get a personalized AI chatbot tailored exactly to your needs.": "O wChat se conecta ao seu WhatsApp através de uma API que permite múltiplos atendentes no mesmo número. Basta escanear o QR Code e pronto.",
    
    "Can I customize my chatbot’s look & feel?": "Quantos atendentes podem usar ao mesmo tempo?",
    "We believe your chatbot should be an extension of your brand. Aiorchat allows you to customize the chatbot's color, chat icon, and the initial greeting message. Add a personal touch and ensure the chatbot aligns seamlessly with your brand identity.": "Depende do plano: o Starter inclui 2 usuários, o Times até 10 e o Business é ilimitado. Cada atendente tem login próprio com permissões.",
    
    "Can I update the trained data?": "Posso testar antes de assinar?",
    "Yes, you can upload unlimited data and edit the uploaded data at any time. Your chatbot will learn from the newly updated data immediately. This ensures your chatbot is always equipped with the latest and most accurate information.": "Sim! Oferecemos 7 dias de teste grátis em todos os planos — sem pedir cartão de crédito. Você configura tudo, conecta seu WhatsApp e já começa a usar.",
    
    "How does the chatbot learn from the data?": "O que é o Agente IA?",
    "Our AI engine processes the text you provide, understanding the context and extracting valuable insights. When a user asks a question, the chatbot analyzes it against the trained data and generates an accurate and relevant response.": "É um assistente de inteligência artificial integrado ao wChat que pode responder clientes automaticamente, qualificar leads e criar resumos de conversas.",

    # 7. CTA
    "Generate AI Chatbots in a Few Clicks": "Eleve o atendimento comercial do seu time",
    "Get started free in minutes. No credit card required": "Comece em minutos. Sem cartão de crédito.",
    "Try it Free": "Começar teste grátis",
}

for old_str, new_str in replacements.items():
    content = content.replace(old_str, new_str)

with open("app/page.js", "w") as f:
    f.write(content)

print("Text replaced successfully!")
