# 👥 Guia de Multi-Tenancy e Isolamento de Ambientes — PardalFlow

O **PardalFlow** implementa um modelo estrito de isolamento lógico de inquilinos (*Logical Multi-Tenancy*), garantindo que múltiplos usuários utilizem a mesma infraestrutura compartilhada sem qualquer risco de vazamento de credenciais, histórico, canais ou sessões.

---

## 🛡️ Pilares do Isolamento

### 1. Autenticação e Contexto Scoped (JWT)
- Cada requisição à API REST requer um token JWT no cabeçalho `Authorization: Bearer <token>`.
- O payload do token carrega o `sub` contendo o `user_id` único gerado no cadastro.
- A dependência de injeção `get_current_user` valida a assinatura e extrai o ID do usuário ativo, impossibilitando qualquer acesso cruzado.

### 2. Isolamento de Credenciais e Configurações
- **Zero Credenciais Globais**: O arquivo `.env` gerencia apenas a infraestrutura (PostgreSQL, portas e JWT).
- **Tabela `user_configs` Dedicada**: Cada usuário possui seu próprio documento/registro de configurações:
  - `telegram_api_id` e `telegram_api_hash`
  - `shopee_app_id` e `shopee_app_secret`
  - `openrouter_api_key`, `groq_api_key` e `google_api_key`
  - Templates customizados de mensagem (`message_template`) e prompts de IA (`gemini_prompt`)
  - Rodapés de mensagens (`footer_text`) e destinos de erros (`whatsapp_admin_dest`)
  - Lista de palavras proibidas (`forbidden_keywords`)

### 3. Sessões MTProto do Telegram 100% Individuais
- Ao invés de uma sessão única do Telegram compartilhada por toda a aplicação:
  - Cada usuário possui seu próprio arquivo `.session` isolado: `backend/sessions/telegram_user_<user_id>.session`.
  - A conta pessoal do usuário Arthur (`arthur.wallace.silva@gmail.com`) permanece vinculada exclusivamente à sua sessão individual (`pardaldaspromos_session_local` / `telegram_user_6ae0df757ec0ae10ea42e1a5`).
  - Novos usuários que se cadastram iniciam com **status desconectado** e conectam sua própria conta via SMS, código do Telegram ou StringSession.

### 4. Isolamento em Todas as Entidades do Banco de Dados
Todas as tabelas do PostgreSQL possuem índice e filtro obrigatório por `user_id`:
- `channels`: Canais monitorados no Telegram.
- `whatsapp_groups`: Grupos de destino no WhatsApp.
- `telegram_destinations`: Destinos no Telegram.
- `whatsapp_sessions`: Sessões de chip no WhatsApp para o round-robin.
- `sent_offers`: Histórico de ofertas reais disparadas.
- `logs`: Logs de execução do bot.

### 5. Novos Cadastros 100% Limpos
Quando um novo usuário se cadastra via `/api/v1/auth/register`:
- Sua conta é criada com contadores zerados (0 canais, 0 grupos, 0 sessões).
- Não recebe sugestões ou placeholders contendo dados de outros usuários.
- Os modelos padrão carregam textos genéricos sem links de convite ou números de telefone pessoais.
