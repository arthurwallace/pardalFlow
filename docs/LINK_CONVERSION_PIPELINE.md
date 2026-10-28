# 🔗 Pipeline de Conversão de Links de Afiliados — PardalFlow

O `LinkConverterService` (`backend/app/services/link_converter.py`) é responsável por detectar, desencurtar e converter todas as URLs de produtos em links oficiais com as tags e subIDs do afiliado configurados por usuário.

---

## 🛒 1. Shopee (GraphQL Affiliate API Oficial)

- **Endpoint Oficial**: `https://open-api.affiliate.shopee.com.br/graphql`
- **Credenciais**:
  - `shopee_app_id` e `shopee_app_secret` obtidos diretamente da configuração privada do usuário (`user_configs`).
- **Autenticação**:
  - Cabeçalho `Authorization: SHA256 Credential={app_id}, Timestamp={timestamp}, Signature={signature}`
  - Assinatura calculada via `sha256(app_id + timestamp + payload + secret)`
- **Dynamic SubIds Rastreáveis**:
  1. `sub_id_1`: Identificador de origem (`pardaltelegram`)
  2. `sub_id_2`: Timestamp no fuso de Brasília (`DDMMHHmm`), permitindo rastrear o exato minuto em que a oferta foi disparada
  3. `sub_id_3`: Nome do produto higienizado (primeiras 3 palavras alfanuméricas sem acentos), obtido via query GraphQL `productOfferV2(itemId, shopId)`.

---

## 🛍️ 2. Mercado Livre

- **Integração**: Webhook configurável via variável de ambiente `N8N_MERCADOLIVRE_WEBHOOK`
- **Exemplo**: `https://seu-n8n.com.br/webhook/conversor-afiliado-mercado-livre`
- **Query Params**: `url={url_original}&tag={tag_opcional}`
- **Tag Dinâmica de Cupom**: Se o canal monitorado estiver com a flag `is_coupon_group: true`, a tag enviada é automaticamente definida como `"cupom"`.

---

## 📦 3. Amazon Associates

- **Integração**: Webhook configurável via variável de ambiente `N8N_AMAZON_WEBHOOK`
- **Exemplo**: `https://seu-n8n.com.br/webhook/afiliados-amazon`
- **Payload**: `{"url": "https://amazon.com.br/..."}`
- Suporta resolução de links curtos como `amzn.to`, `amzlink.to` e links canônicos de produto.

---

## 💙 4. Magazine Luiza (Magalu)

- **Integração**: Webhook configurável via variável de ambiente `N8N_MAGALU_WEBHOOK`
- **Exemplo**: `https://seu-n8n.com.br/webhook/afiliados-magalu`
- **Ativação Condicional**: Controlada pela configuração `magalu_enabled` (toggle no painel de Configurações).

---

## 🔍 5. Desencurtador Prévio

Antes de rodar as expressões regulares das lojas, o pipeline faz uma varredura para resolver encurtadores intermediários:
- `https://boaoferta.me/...`
- `https://ofertou.ai/...`

O serviço segue redirecionamentos HTTP 301/302 para obter a URL canônica de destino antes de aplicar a conversão de afiliados.
