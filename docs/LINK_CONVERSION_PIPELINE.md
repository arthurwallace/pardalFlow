# 🔗 Pipeline de Conversão de Links de Afiliados

O `LinkConverterService` (`backend/app/services/link_converter.py`) é responsável por detectar, desencurtar e converter todas as URLs de produtos em links com as tags e subIDs do afiliado.

---

## 🛒 1. Shopee (GraphQL Affiliate API Oficial)

- **Endpoint**: `https://open-api.affiliate.shopee.com.br/graphql`
- **Autenticação**:
  - Cabeçalho `Authorization: SHA256 Credential={app_id}, Timestamp={timestamp}, Signature={signature}`
  - Assinatura calculada via `sha256(app_id + timestamp + payload + secret)`
- **Dynamic SubIds**:
  1. `pardaltelegram` (Identificador de origem)
  2. Timestamp no fuso de Brasília (`DDMMHHmm`), permitindo rastrear o exato minuto em que a oferta foi disparada
  3. Nome do produto higienizado (primeiras 3 palavras alfanuméricas sem acentos), obtido via query GraphQL `productOfferV2(itemId, shopId)`.

---

## 🛍️ 2. Mercado Livre

- **Webhook Endpoint**: `https://n8n.arthurwallace.com.br/webhook/conversor-afiliado-mercado-livre`
- **Query Params**: `url={url_original}&tag={tag_opcional}`
- **Tag de Cupom**: Se o canal monitorado estiver com a flag `is_coupon_group: true`, a tag enviada é automaticamente definida como `"cupom"`.

---

## 📦 3. Amazon Associates

- **Webhook Endpoint**: `https://n8n.arthurwallace.com.br/webhook/afiliados-amazon`
- **Payload**: `{"url": "https://amazon.com.br/..."}`
- Suporta resolução de links curtos como `amzn.to`, `amzlink.to` e links canônicos de produto.

---

## 💙 4. Magazine Luiza (Magalu)

- **Webhook Endpoint**: `https://n8n.arthurwallace.com.br/webhook/afiliados-magalu`
- **Ativação Condicional**: Controlada pela configuração `magalu_enabled` (toggle no painel).

---

## 🔍 5. Desencurtador Prévio

Antes de rodar as expressões regulares das lojas, o pipeline faz uma varredura para resolver encurtadores intermediários:
- `https://boaoferta.me/...`
- `https://ofertou.ai/...`
O serviço segue redirecionamentos HTTP 301/302 para obter a URL de destino real antes de converter os links para os programas de afiliados.
