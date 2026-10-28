# ☁️ Guia de Deploy no Cloudflare (Pages & Workers)

Este guia detalha como realizar o deploy completo da aplicação no ecossistema da Cloudflare.

---

## 1. Frontend no Cloudflare Pages

O frontend Angular foi projetado para rodar nativamente como um SPA no Cloudflare Pages:

1. Acesse o painel da Cloudflare e vá em **Compute (Workers) > Workers & Pages > Create application > Pages**.
2. Conecte seu repositório Git ou utilize o CLI `wrangler`:
   ```bash
   cd frontend
   npm install
   npm run build
   npx wrangler pages deploy dist/frontend/browser --project-name=pardal-frontend
   ```
3. **Configuração de Build no Painel**:
   - **Framework preset**: `None` ou `Angular`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/frontend/browser`
4. **Regras de Roteamento SPA**:
   - O arquivo `frontend/src/_redirects` contém a regra `/* /index.html 200`, garantindo que rotas como `/dashboard`, `/channels` e `/settings` carreguem perfeitamente sem erros 404 em recarregamentos.

---

## 2. Backend API no Cloudflare Workers

A Cloudflare suporta execução de Python em Workers:
1. O arquivo `wrangler.toml` na raiz está pré-configurado:
   ```toml
   name = "pardal-api"
   compatibility_date = "2026-04-01"
   compatibility_flags = ["python_workers"]
   ```
2. Para publicar:
   ```bash
   npx wrangler deploy
   ```

---

## 3. Worker Persistente do Telegram (Telethon MTProto)

> [!IMPORTANT]
> O protocolo MTProto do Telegram necessita de uma **conexão TCP contínua com estado** e sockets persistentes que trocam heartbeats a cada poucos segundos. Ambientes Serverless HTTP com tempo limite de 30s fecham conexões TCP após cada requisição.

Para a escuta ininterrupta dos canais do Telegram, o projeto inclui:
- `Dockerfile` com FFmpeg e Python 3.11 pré-instalados.
- `docker-compose.yml` pronto para deploy em qualquer VPS (Hetzner, DigitalOcean, AWS EC2) ou plataformas de container como:
  - **Render** (Web Service ou Background Worker)
  - **Fly.io** (`fly launch` usando o `Dockerfile`)
  - **Railway** / **Coolify**

Dessa forma, o **Frontend fica na CDN global de borda do Cloudflare Pages**, a **API pública roda em Cloudflare Workers / Container**, e o **Bot Worker opera 24/7 sem interrupções**.
