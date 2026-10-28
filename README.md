# 🦅 PardalFlow — Sistema Profissional de Gestão & Automação de Afiliados

Plataforma completa, moderna e robusta para automação e gestão profissional de canais de afiliados e bots de Telegram/WhatsApp. Construída com arquitetura desacoplada e escalável em **Angular 17+** (Frontend SPA) e **Python FastAPI** (Backend Assíncrono com Telethon & PostgreSQL).

---

## 🌟 Principais Funcionalidades

1. **Monitoramento Contínuo do Telegram**:
   - Escuta mensagens de canais de ofertas em tempo real via Telethon (MTProto).
   - Suporte a filtros de canais autorizados e ativos por usuário.

2. **Pipeline de Conversão de Links Inteligente**:
   - **Shopee**: Conversão oficial via GraphQL API com assinatura SHA256 e geração dinâmica de `subIds` (`pardaltelegram`, timestamp `DDMMHHmm` de Brasília e `subId` nominal do produto via `productOfferV2`).
   - **Mercado Livre**: Integração com conversor de tags e suporte a grupos exclusivos de cupons.
   - **Amazon Associates**: Resolução e conversão automática com tratamento de links curtos (`amzn.to`).
   - **Magazine Luiza (Magalu)**: Conversão condicional via webhook.
   - **Desencurtamento prévio**: Resolução de shorteners como `boaoferta.me` e `ofertou.ai`.

3. **Reformatador com Inteligência Artificial**:
   - Integração com OpenRouter (Modelos Gemma, Llama 3, etc.) com **fallback automático** caso o modelo principal sofra rate-limit.
   - Limpeza estrita de palavras-chave proibidas (`nerdofertas.com`, etc.).
   - Modelos de mensagem flexíveis (Template 1 Promoção com emojis e destaque de preços, Template 2 Cupom).

4. **Processamento de Mídia & Vídeos**:
   - Captura de imagem do produto via `og:image` direto da página web para canais com marcas d'água no Telegram.
   - Conversão de formatos de imagem (PNG/WebP/GIF) para JPG de alta compatibilidade.
   - Remoção de metadados de vídeo e upscaling automático para 720p via FFmpeg.

5. **Distribuição Multicanal**:
   - **Telegram**: Publicação com formatação Markdown e link direto para compartilhamento no WhatsApp.
   - **WhatsApp**: Roteamento por palavras-chave em grupos específicos, rodapés personalizados e **revezamento round-robin entre múltiplas sessões WhatsApp**.
   - **Roteamento de Erros**: Falhas de conversão de links são enviadas exclusivamente para os canais administrativos do Telegram e WhatsApp.

6. **Ambiente Multi-Usuário / Multi-Tenancy**:
   - Autenticação JWT com isolamento total de dados: cada usuário possui seus próprios canais, destinos, regras, modelos de IA e credenciais privadas de API.

7. **Monitor de Retenção de Grupos**:
   - Analytics de tempo de permanência, entradas, saídas e taxa de abandono rápido (&lt; 15 min).

8. **Design Moderno & Minimalista**:
   - Tema escuro padrão em tons de azul escuro e slate com alternador para modo claro (Light/Dark mode persistente).

---

## 📁 Estrutura do Projeto

```
pardalBot/
├── frontend/               # Aplicação Angular 17+ (SPA Standalone)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Modelos, Guards, Serviços (Auth, API, Theme)
│   │   │   ├── layout/     # Sidebar responsiva, Topbar, Status do Bot
│   │   │   └── pages/      # Dashboard, Canais, Destinos, Configurações, Tester, Analytics, Logs
│   │   ├── styles.css      # Sistema de design (Dark/Light mode tokens)
│   │   └── index.html
│   └── package.json
├── backend/                # API REST FastAPI + Telethon Worker
│   ├── app/
│   │   ├── api/            # Routers (Auth, Canais, Destinos, Configurações, Bot, Tester, Analytics)
│   │   ├── core/           # Config, Segurança (JWT Dinâmico/Bcrypt), PostgreSQL / Database
│   │   ├── models/         # Pydantic Schemas
│   │   ├── services/       # Link Converter, AI Formatter, Media Processor, Dispatcher, Bot Manager
│   │   └── main.py         # Entrypoint FastAPI
│   ├── run_server.py       # Runner do servidor Uvicorn
│   └── requirements.txt
├── docs/                   # Documentação detalhada para desenvolvedores e agentes
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── CASAOS_DEPLOYMENT.md
│   ├── CLOUDFLARE_DEPLOYMENT.md
│   ├── LINK_CONVERSION_PIPELINE.md
│   ├── MULTI_TENANCY_GUIDE.md
│   └── AGENTS.md
├── Dockerfile
├── docker-compose.yml
└── wrangler.toml
```

---

## 🚀 Como Executar Localmente

### 1. Backend (Python 3.11+)

```bash
cd backend
python -m venv venv
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python run_server.py
```
A API estará disponível em `http://localhost:8000` (ou `8085` via Docker) e a documentação Swagger em `http://localhost:8000/docs`.

### 2. Frontend (Angular 17+)

```bash
cd frontend
npm install
npm start
```
Acesse o painel web em `http://localhost:4200`.

---

## 🏠 Deploy no CasaOS & Docker (PostgreSQL)

O sistema conta com orquestração completa em **Docker Compose** com banco de dados **PostgreSQL 16 dedicado**:

```bash
docker compose up -d --build
```
- **Painel Web SPA & REST API**: `http://<ip-do-casaos>:8085` (ou `http://localhost:8085`)
- **Documentação Interativa Swagger**: `http://<ip-do-casaos>:8085/docs`
- **Banco PostgreSQL**: Porta `5438` (host) e `5432` (container)
- **Auto-migração**: Executa automaticamente na inicialização do container.

Consulte o guia completo em [docs/CASAOS_DEPLOYMENT.md](docs/CASAOS_DEPLOYMENT.md).

---

## ☁️ Deploy no Cloudflare

- **Frontend**: Hospedado no **Cloudflare Pages** com build `npm run build` apontando para o diretório `dist/frontend/browser`. Arquivo `_redirects` pré-configurado para suportar rotas HTML5.
- **Backend API**: Pronto para deploy via **Cloudflare Workers** ou via container Docker (CasaOS, VPS, Railway, Render) para manter a sessão MTProto do Telethon aberta continuamente.

Consulte o guia completo em [docs/CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md).
