# 🤖 Guia de Orientação para Agentes de IA

Este documento foi criado para que futuros agentes de IA e desenvolvedores possam manter, evoluir e depurar o código do **Pardal PromoHub** com máxima eficiência e consistência.

---

## 🚨 Regras Invioláveis do Projeto

1. **Separação Frontend / Backend**:
   - O frontend está em `frontend/` (Angular 17+ standalone). Nunca misture templates com código de backend.
   - O backend está em `backend/` (FastAPI). Todos os endpoints devem validar entradas com Pydantic v2.

2. **Preservação de Multi-Tenancy**:
   - Qualquer nova tabela ou coleção **DEVE** incluir o campo `user_id` e filtrá-lo nas queries através de `current_user["id"]`.
   - Nunca compartilhe dados de canais ou destinos entre usuários sem autorização explícita.

3. **Tratamento de Links e Erros**:
   - Se uma conversão de link falhar, adicione o sufixo `(❌ Erro ao converter)` e defina `conversion_success = False`.
   - Mensagens com falha de conversão **NUNCA** devem ser publicadas em canais públicos do Telegram ou grupos WhatsApp de usuários finais. Devem ser roteadas exclusivamente para os canais com `admin: true`.

4. **Estilo e Design do Frontend**:
   - O padrão do sistema é Dark Mode em tons escuros e azul escuro (`#060911`, `#111827`, `#1e293b`, `#3b82f6`).
   - Mantenha a compatibilidade com Light Mode usando as variáveis CSS globais definidas em `frontend/src/styles.css`.
   - Não utilize Tailwind a menos que solicitado expressamente. Use as classes utilitárias já prontas (`.card`, `.btn-primary`, `.badge`, `.form-input`).

---

## 💡 Como Adicionar um Novo Conversor de Afiliados

1. **Backend**:
   - Em `backend/app/services/link_converter.py`, defina o regex da nova plataforma e o método `convert_nomedaloja()`.
   - Integre o novo método dentro de `convert_all_links()`.
   - Adicione o regex nas configurações padrão em `backend/app/models/settings.py`.
2. **Frontend**:
   - Adicione o novo regex e toggle no menu de configurações `frontend/src/app/pages/settings/settings.component.ts`.
