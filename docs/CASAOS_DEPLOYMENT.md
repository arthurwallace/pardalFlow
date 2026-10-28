# 🏠 Guia de Deploy no CasaOS — Pardal PromoHub com PostgreSQL

Este guia detalha o processo passo a passo para implantar o **Pardal PromoHub** com banco de dados **PostgreSQL dedicado** em seu servidor **CasaOS** via Docker Compose.

---

## 🏗️ Arquitetura no CasaOS

```
CasaOS (Docker Host)
 ├── 🐘 pardal_postgres (PostgreSQL 16 Alpine)
 │    ├── Porta interna: 5432
 │    ├── Porta host: 5438 (evita conflito com a 5432 padrão)
 │    └── Volume: pardal_postgres_data (persiste todos os dados relacionais)
 └── 🦅 pardal_backend (FastAPI + Angular SPA Integrado + Telethon Worker)
      ├── Porta interna: 8000
      ├── Porta host: 8085 (evita conflito com a 8000 padrão)
      ├── Volume: ./backend/sessions (persiste arquivos .session do Telegram)
      └── Auto-migração: Executa migrate_to_postgres.py automaticamente na subida
```

---

## 📦 Onde Publicar a Imagem Docker (Registries Recomendados)

Para instalar no CasaOS sem precisar copiar o código-fonte nem compilar o Angular/Python dentro do servidor, você pode publicar a imagem Docker em um registro público ou privado gratuito:

### Opção 1: GitHub Container Registry (GHCR) — Automático e Gratuito (Recomendado)
Já deixamos configurado no projeto o workflow do GitHub Actions em [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml).
1. Ao fazer `git push` para o seu repositório no GitHub, o GitHub compila o frontend e o backend automaticamente.
2. A imagem fica disponível publicamente em:
   ```text
   ghcr.io/seu_usuario_github/pardalbot:latest
   ```
3. No GitHub: vá na aba **Packages** do seu perfil e garanta que o pacote `pardalbot` esteja como **Public** para o CasaOS poder baixá-lo livremente sem login.

### Opção 2: Docker Hub (`hub.docker.com`) — Manual
Caso prefira enviar para o Docker Hub:
1. Faça login no terminal do seu computador:
   ```bash
   docker login
   ```
2. Compile a imagem multi-stage com sua tag:
   ```bash
   docker build -t seu_usuario_dockerhub/pardal-promohub:latest .
   ```
3. Envie a imagem para o Docker Hub:
   ```bash
   docker push seu_usuario_dockerhub/pardal-promohub:latest
   ```
4. A imagem estará disponível no compose como:
   ```yaml
   image: seu_usuario_dockerhub/pardal-promohub:latest
   ```

---

## 🚀 Método 1: Instalação via Interface Web do CasaOS (Recomendado)

1. **Acesse o seu CasaOS**:
   Abra seu navegador e acesse `http://<ip-do-seu-casaos>` (ex: `http://192.168.1.100`).

2. **Adicionar App Personalizado**:
   - No painel inicial do CasaOS, clique no botão **`+`** (canto superior direito) e selecione **"Install a customized app"** (Instalar app personalizado).

3. **Importar o docker-compose.yml**:
   - No canto superior direito da janela que se abrir, clique no ícone **Import** (seta para dentro ou texto "Import").
   - Cole o conteúdo do arquivo [`docker-compose.yml`](../docker-compose.yml).
   - O CasaOS preencherá automaticamente todos os campos com os metadados oficiais (`x-casaos`), ícone, portas (8085 e 5438) e volumes.
   - Ajuste o campo `image:` do backend para apontar para sua imagem (ex: `ghcr.io/seu_usuario/pardalbot:latest` ou `seu_usuario/pardal-promohub:latest`).

4. **Configurar Variáveis de Ambiente**:
   - No formulário do CasaOS, preencha as variáveis de ambiente necessárias (como `POSTGRES_PASSWORD`, `SECRET_KEY`, etc.).

5. **Clique em "Install"**:
   - O CasaOS baixará automaticamente as imagens prontas e iniciará os containers com verificação de saúde (*healthcheck* ativo).

---

## 🖥️ Método 2: Instalação via Terminal SSH (Linha de Comando)

Se preferir subir via terminal no seu servidor CasaOS:

1. **Conecte via SSH no CasaOS**:
   ```bash
   ssh seu_usuario@ip-do-casaos
   ```

2. **Clone ou envie a pasta `pardalBot` para o seu CasaOS**:
   ```bash
   mkdir -p /DATA/AppData/pardalBot
   cd /DATA/AppData/pardalBot
   # Copie os arquivos do projeto para este diretório
   ```

3. **Inicie os containers com Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

4. **Verifique os logs de inicialização e migração**:
   ```bash
   docker compose logs -f backend
   ```
   Você verá a mensagem:
   ```text
   🔄 Sincronizando banco de dados PostgreSQL...
   RESUMO DO BANCO RELACIONAL APOS MIGRACAO:
   Usuarios: 2
   Configuracoes: 2
   Canais Monitorados: 34
   Grupos WhatsApp: 6
   Destinos Telegram: 3
   Sessoes WhatsApp: 3
   Ofertas Disparadas: 0
   Migracao concluida com sucesso!
   🚀 Iniciando servidor FastAPI na porta 8000 (Mapeado no host para 8085)...
   ```

---

## 🌐 Acessando a Aplicação

- **Painel Web & Dashboard**: `http://<ip-do-casaos>:8085`
- **Documentação Interativa Swagger API**: `http://<ip-do-casaos>:8085/docs`
- **PostgreSQL Direto (DBeaver / DataGrip / pgAdmin)**:
  - **Host**: `<ip-do-casaos>`
  - **Porta**: `5438`
  - **Banco**: `pardal_promohub`
  - **Usuário**: `pardal_user`
  - **Senha**: Definida na variável `POSTGRES_PASSWORD` do seu `.env`

---

## 💾 Persistência e Volumes

Os dados estão 100% isolados e seguros contra reinicializações ou atualizações de imagem:

| Dado | Tipo de Volume | Localização / Descrição |
| :--- | :--- | :--- |
| **Banco PostgreSQL** | Docker Named Volume | `pardal_postgres_data` (`/var/lib/postgresql/data`) |
| **Sessão Telethon MTProto** | Bind Mount | `./backend/sessions` (guarda `*.session` autenticados) |
| **Configuração de Ambiente** | Bind Mount / Env File | `./backend/.env` |

---

## 🔄 Backup do Banco de Dados no CasaOS

Para fazer backup do PostgreSQL a qualquer momento:

```bash
docker exec -t pardal_postgres pg_dump -U pardal_user -d pardal_promohub > backup_pardal_$(date +%Y%m%d).sql
```

Para restaurar um backup:

```bash
cat backup_pardal.sql | docker exec -i pardal_postgres psql -U pardal_user -d pardal_promohub
```
