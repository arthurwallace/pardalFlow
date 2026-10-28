# 🤖 Guia de Orientação para Agentes de IA — PardalFlow

Este documento foi criado para que agentes de IA e desenvolvedores possam manter, evoluir e depurar o código do **PardalFlow** com máxima eficiência, segurança e consistência de padrões.

---

## 🚨 Regras Invioláveis do Projeto

1. **Separação Frontend / Backend**:
   - O frontend está em `frontend/` (Angular 17+ standalone). Nunca misture templates com código de backend.
   - O backend está em `backend/` (FastAPI). Todos os endpoints devem validar entradas com Pydantic v2.

2. **Isolamento de Credenciais e Segurança**:
   - O arquivo `.env` deve conter **apenas** variáveis de arquitetura (PostgreSQL, portas, host, secret JWT de infraestrutura).
   - **NUNCA** adicione chaves de Telegram, Shopee, OpenRouter, Groq ou Google no `.env`. Essas credenciais pertencem à tabela `user_configs` de cada usuário.
   - **NUNCA** defina fallbacks estáticos para segredos JWT. Utilize `_get_or_generate_jwt_secret()` em `backend/app/core/config.py`.

3. **Multi-Tenancy e Filtro Obrigatório**:
   - Qualquer nova tabela ou modelo relacional **DEVE** incluir a coluna `user_id` e filtrá-la nas queries através de `current_user["id"]`.
   - Nenhuma query ou serviço pode retornar ou manipular registros de outro usuário.

4. **Tratamento de Links e Roteamento de Erros**:
   - Se uma conversão de link falhar, adicione o sufixo `(❌ Erro ao converter)` e defina `conversion_success = False`.
   - Mensagens com falha de conversão **NUNCA** devem ser publicadas em canais públicos do Telegram ou grupos WhatsApp de usuários finais. Devem ser roteadas exclusivamente para os destinos com `admin: true` ou `whatsapp_admin_dest`.

5. **Estilo e Design do Frontend**:
   - Não utilize Tailwind a menos que expressamente solicitado. O design system utiliza Vanilla CSS tokens e temas definidos em `frontend/src/styles.css`.
   - Mantenha responsividade completa (Mobile First) para smartphones e tablets.

---

## 💡 Como Adicionar um Novo Conversor de Afiliados

1. **Backend**:
   - Em `backend/app/services/link_converter.py`, defina o regex da nova plataforma e o método `convert_nomedaloja()`.
   - Integre o novo método dentro de `convert_all_links()`.
   - Adicione o regex nas configurações padrão em `backend/app/models/settings.py`.
2. **Frontend**:
   - Adicione o novo regex e toggle no menu de configurações em `frontend/src/app/pages/settings/settings.component.ts`.
