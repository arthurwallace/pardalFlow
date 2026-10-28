# 📚 Documentação da API REST — Pardal PromoHub

A API REST do Pardal PromoHub é versionada (`/api/v1`) e documentada interativamente via OpenAPI / Swagger em `http://localhost:8000/docs`.

---

## 🔐 Autenticação

A maioria dos endpoints exige o cabeçalho HTTP:
```http
Authorization: Bearer <seu_token_jwt>
```

---

## 📌 Resumo dos Endpoints

| Método | Rota | Descrição |
|---|---|---|
| **POST** | `/api/v1/auth/register` | Cria novo usuário e inicializa ambiente padrão |
| **POST** | `/api/v1/auth/login` | Autentica e retorna token JWT |
| **GET** | `/api/v1/auth/me` | Retorna dados do usuário autenticado |
| **GET** | `/api/v1/channels` | Lista canais monitorados do usuário |
| **POST** | `/api/v1/channels` | Adiciona novo canal monitorado |
| **PUT** | `/api/v1/channels/{id}` | Atualiza canal monitorado (ativo, imagem, etc.) |
| **DELETE** | `/api/v1/channels/{id}` | Remove canal monitorado |
| **POST** | `/api/v1/channels/reorder` | Reordena lista de canais |
| **POST** | `/api/v1/channels/test-reachability` | Testa acessibilidade dos canais via Telegram |
| **GET** | `/api/v1/destinations/whatsapp-groups` | Lista grupos de destino WhatsApp |
| **POST** | `/api/v1/destinations/whatsapp-groups` | Cadastra novo grupo WhatsApp |
| **PUT** | `/api/v1/destinations/whatsapp-groups/{id}` | Edita regras e palavras-chave de grupo WA |
| **DELETE** | `/api/v1/destinations/whatsapp-groups/{id}` | Exclui grupo WhatsApp |
| **GET** | `/api/v1/destinations/telegram` | Lista destinos Telegram |
| **POST** | `/api/v1/destinations/telegram` | Adiciona destino Telegram |
| **PUT** | `/api/v1/destinations/telegram/{id}` | Alterna flag admin de destino Telegram |
| **DELETE** | `/api/v1/destinations/telegram/{id}` | Exclui destino Telegram |
| **GET** | `/api/v1/destinations/whatsapp-sessions` | Lista sessões WhatsApp para revezamento |
| **POST** | `/api/v1/destinations/whatsapp-sessions` | Cadastra nova sessão WhatsApp |
| **PUT** | `/api/v1/destinations/whatsapp-sessions/{id}` | Ativa/desativa sessão WhatsApp |
| **DELETE** | `/api/v1/destinations/whatsapp-sessions/{id}` | Exclui sessão WhatsApp |
| **GET** | `/api/v1/settings` | Obtém configurações de IA e credenciais |
| **PUT** | `/api/v1/settings` | Salva configurações de IA e credenciais |
| **GET** | `/api/v1/bot/status` | Retorna status de execução e métricas |
| **POST** | `/api/v1/bot/start` | Inicia thread de escuta do bot |
| **POST** | `/api/v1/bot/stop` | Finaliza thread do bot |
| **GET** | `/api/v1/bot/logs` | Obtém logs recentes de operação |
| **POST** | `/api/v1/tester/convert-links` | Simula apenas conversão de links |
| **POST** | `/api/v1/tester/format-ai` | Simula apenas formatação com IA |
| **POST** | `/api/v1/tester/test-pipeline` | Simula todo o fluxo passo a passo |
| **GET** | `/api/v1/metrics/dashboard` | Retorna totalizadores operacionais |
| **GET** | `/api/v1/analytics/whatsapp-groups` | Retorna dados de retenção e saídas |
