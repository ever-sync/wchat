import type { OpenAPIV3 } from "swagger-ui-react";

/** Spec da API REST pública (`wchat-api`). O `servers[0].url` é preenchido na página. */
export function buildWchatApiOpenApi(serverUrl: string): OpenAPIV3.Document {
  return {
    openapi: "3.0.3",
    info: {
      title: "wChat API REST",
      version: "1.0.0",
      description: [
        "API genérica para integrações (n8n, Zapier, Make, backends próprios).",
        "",
        "**Autenticação:** `Authorization: Bearer wchat_<segredo>` (chave criada em Configurações → Integrações).",
        "",
        "**Escopos:** `read`, `write` ou `*`.",
        "",
        "Esta API é **independente** da edge function `n8n-reply` (fluxo de IA com regras de negócio).",
      ].join("\n"),
    },
    servers: [{ url: serverUrl, description: "Edge function wchat-api" }],
    tags: [
      { name: "Sistema", description: "Health e metadados da chave" },
      { name: "Chats", description: "Conversas WhatsApp" },
      { name: "Mensagens", description: "Envio outbound" },
      { name: "Clientes", description: "Cadastro de clientes" },
      { name: "CRM", description: "Negociações" },
    ],
    components: {
      securitySchemes: {
        bearerApiKey: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "wchat_<secret>",
          description: "Chave de API do tenant (prefixo wchat_)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
        SendMessageRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", description: "Corpo da mensagem" },
            chat_id: { type: "string", format: "uuid" },
            phone: { type: "string", example: "5511999999999" },
            remote_jid: { type: "string", example: "5511999999999@s.whatsapp.net" },
            instance_id: { type: "string", format: "uuid", description: "Opcional; usa instância padrão" },
          },
        },
        SendMessageResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            chat_id: { type: "string", format: "uuid" },
            message_id: { type: "string", format: "uuid" },
            remote_jid: { type: "string" },
          },
        },
        CustomerCreate: {
          type: "object",
          required: ["nome"],
          properties: {
            nome: { type: "string" },
            telefone: { type: "string" },
            phone: { type: "string", description: "Alias de telefone" },
            email: { type: "string" },
            perfil: { type: "string" },
            rota: { type: "string" },
            cidade: { type: "string" },
            codigo: { type: "string" },
            origem: { type: "string", default: "api" },
          },
        },
        NegotiationCreate: {
          type: "object",
          required: ["title", "funnel_id", "stage_id"],
          properties: {
            title: { type: "string" },
            funnel_id: { type: "string" },
            stage_id: { type: "string" },
            customer_id: { type: "string", format: "uuid" },
            assignee_id: { type: "string", format: "uuid" },
            status: { type: "string", default: "em_andamento" },
            total_value: { type: "number" },
          },
        },
      },
    },
    security: [{ bearerApiKey: [] }],
    paths: {
      "/v1/health": {
        get: {
          tags: ["Sistema"],
          summary: "Health check",
          description: "Público sem chave; com Bearer retorna também o tenant autenticado.",
          security: [],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      service: { type: "string" },
                      version: { type: "string" },
                      authenticated: { type: "boolean" },
                      tenant_id: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/v1/me": {
        get: {
          tags: ["Sistema"],
          summary: "Tenant e chave atual",
          responses: { "200": { description: "OK" }, "401": { description: "Não autorizado" } },
        },
      },
      "/v1/chats": {
        get: {
          tags: ["Chats"],
          summary: "Listar conversas",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Lista em `data`" } },
        },
      },
      "/v1/chats/{chatId}": {
        get: {
          tags: ["Chats"],
          summary: "Detalhe da conversa",
          parameters: [{ name: "chatId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "OK" }, "404": { description: "Não encontrado" } },
        },
      },
      "/v1/messages/send": {
        post: {
          tags: ["Mensagens"],
          summary: "Enviar mensagem de texto",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SendMessageRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Enviada",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SendMessageResponse" },
                },
              },
            },
            "400": { description: "Payload inválido" },
            "404": { description: "Chat não encontrado" },
          },
        },
      },
      "/v1/customers": {
        get: {
          tags: ["Clientes"],
          summary: "Listar clientes",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "q", in: "query", schema: { type: "string" }, description: "Busca em nome, telefone, e-mail" },
          ],
          responses: { "200": { description: "Lista em `data`" } },
        },
        post: {
          tags: ["Clientes"],
          summary: "Criar cliente",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CustomerCreate" } },
            },
          },
          responses: { "201": { description: "Criado" } },
        },
      },
      "/v1/customers/{customerId}": {
        get: {
          tags: ["Clientes"],
          summary: "Obter cliente",
          parameters: [
            { name: "customerId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: { "200": { description: "OK" }, "404": { description: "Não encontrado" } },
        },
        patch: {
          tags: ["Clientes"],
          summary: "Atualizar cliente",
          parameters: [
            { name: "customerId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nome: { type: "string" },
                    telefone: { type: "string" },
                    email: { type: "string" },
                    perfil: { type: "string" },
                    ativo: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Atualizado" } },
        },
      },
      "/v1/crm/negotiations": {
        get: {
          tags: ["CRM"],
          summary: "Listar negociações",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "customer_id", in: "query", schema: { type: "string", format: "uuid" } },
          ],
          responses: { "200": { description: "Lista em `data`" } },
        },
        post: {
          tags: ["CRM"],
          summary: "Criar negociação",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/NegotiationCreate" } },
            },
          },
          responses: { "201": { description: "Criada" } },
        },
      },
    },
  };
}
