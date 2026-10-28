# 👥 Guia de Multi-Tenancy e Isolamento de Ambientes

O Pardal PromoHub implementa isolamento lógico completo de inquilinos (*Logical Multi-Tenancy*), garantindo que múltiplos usuários possam utilizar a mesma plataforma com dados e configurações completamente separados.

---

## 🛡️ Mecanismo de Isolamento

1. **Autenticação JWT Scoped**:
   - Cada requisição carrega o `sub` contendo o `user_id` único no token JWT.
   - A dependência `get_current_user` valida o token e injeta o contexto do usuário em todas as rotas.

2. **Isolamento de Banco de Dados**:
   - Todas as coleções (`channels`, `whatsapp_groups`, `telegram_destinations`, `whatsapp_sessions`, `user_configs`, `logs`) possuem o índice obrigatório `user_id`.
   - Nenhuma query pode retornar ou alterar dados de outros usuários.

3. **Instâncias Isoladas do Bot**:
   - O `BotManager` instancia um `UserBotInstance` exclusivo por `user_id`.
   - Cada instância gerencia sua própria sessão do Telethon, fila de logs e histórico de latência.

4. **Credenciais Privadas Opcionais**:
   - Cada usuário pode optar por usar as credenciais padrão do sistema ou sobrescrever suas próprias chaves privadas no menu **Configurações & IA**:
     - Telegram API ID & Hash privados
     - Shopee App ID & Secret privados
     - Chave OpenRouter privada
