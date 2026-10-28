# 📚 Documentação da API REST — PardalFlow (Pardal PromoHub)

A API REST do **PardalFlow** é versionada sob o prefixo `/api/v1` e documentada interativamente via OpenAPI / Swagger UI:
- **Swagger UI**: `http://<ip-do-servidor>:8085/docs` (ou `http://localhost:8085/docs`)
- **Redoc**: `http://<ip-do-servidor>:8085/redoc`
- **OpenAPI JSON**: `http://<ip-do-servidor>:8085/openapi.json`

---

## 🔐 Autenticação

Todos os endpoints privados exigem autenticação via Bearer Token JWT no cabeçalho HTTP:
```http
Authorization: Bearer <seu_token_jwt>
```

---

## 📌 Catálogo Completo de Endpoints

### 1. Autenticação & Perfil (`/api/v1/auth`)
| Método | Rota | Descrição |
|---|---|---|
| **POST** | `/api/v1/auth/register` | Cria novo usuário e inicializa ambiente limpo |
| **POST** | `/api/v1/auth/login` | Autentica com e-mail/senha e emite token JWT |
| **GET** | `/api/v1/auth/me` | Retorna os dados do usuário autenticado |

### 2. Canais Monitorados (`/api/v1/channels`)
| Método | Rota | Descrição |
|---|---|---|
| **GET** | `/api/v1/channels` | Lista canais monitorados do usuário autenticado |
| **POST** | `/api/v1/channels` | Cadastra novo canal Telegram para monitoramento |
| **PUT** | `/api/v1/channels/{id}` | Atualiza configurações do canal (ativo, imagem, grupos) |
| **DELETE** | `/api/v1/channels/{id}` | Exclui canal monitorado |
| **POST** | `/api/v1/channels/reorder` | Salva ordenação personalizada de exibição dos canais |
| **POST** | `/api/v1/channels/test-reachability` | Testa acessibilidade de cada canal via MTProto |

### 3. Destinos das Ofertas (`/api/v1/destinations`)
| Método | Rota | Descrição |
|---|---|---|
| **GET** | `/api/v1/destinations/whatsapp-groups` | Lista grupos de WhatsApp de destino |
| **POST** | `/api/v1/destinations/whatsapp-groups` | Cadastra novo grupo WhatsApp |
| **PUT** | `/api/v1/destinations/whatsapp-groups/{id}` | Edita nome, ID, palavras-chave e rodapé exclusivo |
| **DELETE** | `/api/v1/destinations/whatsapp-groups/{id}` | Remove grupo WhatsApp |
| **GET** | `/api/v1/destinations/telegram` | Lista canais e grupos de destino Telegram |
| **POST** | `/api/v1/destinations/telegram` | Adiciona destino Telegram |
| **PUT** | `/api/v1/destinations/telegram/{id}` | Alterna flag de canal administrativo (erros/alertas) |
| **DELETE** | `/api/v1/destinations/telegram/{id}` | Exclui destino Telegram |
| **GET** | `/api/v1/destinations/whatsapp-sessions` | Lista sessões de chip WhatsApp (Round-Robin) |
| **POST** | `/api/v1/destinations/whatsapp-sessions` | Cadastra nova sessão WhatsApp com status de aquecimento |
| **PUT** | `/api/v1/destinations/whatsapp-sessions/{id}` | Ativa/desativa sessão WhatsApp |
| **DELETE** | `/api/v1/destinations/whatsapp-sessions/{id}` | Exclui sessão WhatsApp |

### 4. Gestão do Bot & Telegram (`/api/v1/bot`)
| Método | Rota | Descrição |
|---|---|---|
| **GET** | `/api/v1/bot/status` | Retorna se o bot está rodando e métricas de latência |
| **POST** | `/api/v1/bot/start` | Inicia o worker assíncrono de escuta do usuário |
| **POST** | `/api/v1/bot/stop` | Para a escuta do bot |
| **GET** | `/api/v1/bot/logs` | Retorna histórico recente de logs operacionais |
| **GET** | `/api/v1/bot/telegram/session-status` | Verifica conexão e autorização da sessão MTProto |
| **POST** | `/api/v1/bot/telegram/login-phone` | Envia código de acesso via Telegram/SMS |
| **POST** | `/api/v1/bot/telegram/verify-code` | Valida código de acesso e senha 2FA |
| **POST** | `/api/v1/bot/telegram/import-string-session` | Importa StringSession diretamente |
| **POST** | `/api/v1/bot/telegram/disconnect` | Desconecta e limpa sessão do Telegram |

### 5. Configurações & IA (`/api/v1/settings`)
| Método | Rota | Descrição |
|---|---|---|
| **GET** | `/api/v1/settings` | Obtém todas as configurações, modelos e credenciais privadas |
| **PUT** | `/api/v1/settings` | Atualiza chaves de API, templates, prompt e blacklist |

### 6. Simulador & Testes (`/api/v1/tester`)
| Método | Rota | Descrição |
|---|---|---|
| **POST** | `/api/v1/tester/convert-links` | Testa apenas conversão de links |
| **POST** | `/api/v1/tester/format-ai` | Testa apenas reescrita com IA |
| **POST** | `/api/v1/tester/test-pipeline` | Executa o pipeline completo em modo simulação |
| **POST** | `/api/v1/tester/dispatch-now` | Realiza o envio real aos grupos selecionados com confirmação |

### 7. Métricas & Analytics (`/api/v1/metrics` e `/api/v1/analytics`)
| Método | Rota | Descrição |
|---|---|---|
| **GET** | `/api/v1/metrics/dashboard` | Retorna contadores do painel (canais, grupos, chips, latência) |
| **GET** | `/api/v1/metrics/dispatched-offers` | Histórico paginado de produtos reais enviados |
| **GET** | `/api/v1/analytics/whatsapp-groups` | Métricas de retenção, entradas e saídas de participantes |
