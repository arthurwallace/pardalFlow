import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Settings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div>
          <span class="category-tag">TEXTOS E INTELIGÊNCIA ARTIFICIAL</span>
          <h1 class="main-title">Meus textos & <span class="highlight-text">Templates de IA</span></h1>
          <p class="subtitle">
            Configure os formatos das mensagens de ofertas e cupons, modelos de IA e palavras-chave bloqueadas.
          </p>
        </div>
        <button class="btn btn-teal" (click)="saveSettings()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span>{{ saveStatusText || 'Salvar Alterações' }}</span>
        </button>
      </div>

      <!-- TABS SWITCHER -->
      <div class="tabs-nav">
        <button class="tab-btn" [class.active]="activeTab === 'templates'" (click)="activeTab = 'templates'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
          <span>Templates de Mensagem</span>
        </button>

        <button class="tab-btn" [class.active]="activeTab === 'ai'" (click)="activeTab = 'ai'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>IA & Modelos</span>
        </button>

        <button class="tab-btn" [class.active]="activeTab === 'blacklist'" (click)="activeTab = 'blacklist'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          <span>Blacklist ({{ settings.forbidden_keywords.length }})</span>
        </button>

        <button class="tab-btn" [class.active]="activeTab === 'credentials'" (click)="selectTab('credentials')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>Credenciais Afiliados</span>
        </button>

        <button class="tab-btn" [class.active]="activeTab === 'telegram'" (click)="selectTab('telegram')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <span>Sessão Telegram</span>
          <span class="tab-dot" [class.online]="tgStatus.is_connected" [class.offline]="!tgStatus.is_connected"></span>
        </button>
      </div>

      <!-- TAB 1: TEMPLATES -->
      <div *ngIf="activeTab === 'templates'" class="tab-card card">
        <div class="form-section">
          <h2>Templates de Mensagem</h2>
          <p class="section-desc">Formato padrão para anúncios de promoções (Template 1) e avisos de cupons (Template 2).</p>

          <div class="field-block">
            <label>Template Completo</label>
            <textarea [(ngModel)]="settings.message_template" rows="12" class="code-textarea"></textarea>
          </div>

          <div class="field-block">
            <label>Rodapé Padrão (Compartilhe nosso grupo)</label>
            <input type="text" [(ngModel)]="settings.footer_text">
          </div>
        </div>
      </div>

      <!-- TAB 2: IA & MODELOS -->
      <div *ngIf="activeTab === 'ai'" class="tab-card card">
        <div class="form-section">
          <h2>Reformatador com Inteligência Artificial</h2>
          <p class="section-desc">Extrai os dados da promoção e remove menções de concorrentes sem alucinações.</p>

          <div class="toggle-row">
            <div>
              <span class="toggle-title">Ativar Reescrita com IA</span>
              <span class="toggle-desc">Se desativado, o bot realiza apenas a conversão dos links mantendo o texto original.</span>
            </div>
            <label class="switch">
              <input type="checkbox" [(ngModel)]="settings.ai_enabled">
              <span class="slider"></span>
            </label>
          </div>

          <div class="grid-2-cols">
            <div class="field-block">
              <label>Modelo OpenRouter Primário</label>
              <input type="text" [(ngModel)]="settings.openrouter_model_1">
            </div>
            <div class="field-block">
              <label>Modelo OpenRouter Fallback</label>
              <input type="text" [(ngModel)]="settings.openrouter_model_2">
            </div>
          </div>

          <div class="field-block">
            <label>System Prompt do Gemini / OpenRouter</label>
            <textarea [(ngModel)]="settings.gemini_prompt" rows="8" class="code-textarea"></textarea>
          </div>
        </div>
      </div>

      <!-- TAB 3: BLACKLIST -->
      <div *ngIf="activeTab === 'blacklist'" class="tab-card card">
        <div class="form-section">
          <h2>Palavras e Links Proibidos (Blacklist)</h2>
          <p class="section-desc">Qualquer linha ou termo contendo essas palavras é removido automaticamente das mensagens antes do envio.</p>

          <div class="add-term-bar">
            <input type="text" [(ngModel)]="newKeyword" placeholder="Digite uma nova palavra ou domínio para bloquear..." (keyup.enter)="addKeyword()">
            <button class="btn btn-teal" (click)="addKeyword()">Bloquear Termo</button>
          </div>

          <div class="keywords-wrap">
            <span *ngFor="let kw of settings.forbidden_keywords; let i = index" class="keyword-chip">
              <span>{{ kw }}</span>
              <button class="remove-chip-btn" (click)="removeKeyword(i)">×</button>
            </span>
          </div>
        </div>
      </div>

      <!-- TAB 4: CREDENCIAIS -->
      <div *ngIf="activeTab === 'credentials'" class="tab-card card">
        <div class="form-section">
          <h2>Credenciais e Chaves de API</h2>
          <p class="section-desc">Chaves seguras das plataformas para conversão instantânea de links.</p>

          <div class="grid-2-cols">
            <div class="field-block">
              <label>Shopee App ID</label>
              <input type="text" [(ngModel)]="settings.shopee_app_id">
            </div>
            <div class="field-block">
              <label>Shopee App Secret</label>
              <input type="password" [(ngModel)]="settings.shopee_app_secret">
            </div>
          </div>

          <div class="grid-2-cols">
            <div class="field-block">
              <label>OpenRouter API Key</label>
              <input type="password" [(ngModel)]="settings.openrouter_api_key">
            </div>
            <div class="field-block">
              <label>Groq API Key</label>
              <input type="password" [(ngModel)]="settings.groq_api_key">
            </div>
          </div>

          <div class="grid-2-cols">
            <div class="field-block">
              <label>Telegram API ID</label>
              <input type="number" [(ngModel)]="settings.telegram_api_id">
            </div>
            <div class="field-block">
              <label>Telegram API Hash</label>
              <input type="password" [(ngModel)]="settings.telegram_api_hash">
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: SESSÃO TELEGRAM -->
      <div *ngIf="activeTab === 'telegram'" class="tab-card card">
        <div class="form-section">
          <div class="session-header-row">
            <div>
              <h2>Gerenciamento da Sessão Telegram</h2>
              <p class="section-desc">Conecte e administre a conta do Telegram usada pelo PardalBot para capturar ofertas dos canais de origem.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="loadTelegramStatus()" [disabled]="tgLoading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" [class.spin]="tgLoading"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              <span>{{ tgLoading ? 'Verificando...' : 'Atualizar Status' }}</span>
            </button>
          </div>

          <!-- ALERT FEEDBACK -->
          <div *ngIf="tgAlertMessage" class="alert-banner" [class.alert-success]="tgAlertType === 'success'" [class.alert-danger]="tgAlertType === 'danger'" [class.alert-info]="tgAlertType === 'info'">
            <span class="alert-text">{{ tgAlertMessage }}</span>
            <button class="alert-close" (click)="tgAlertMessage = ''">×</button>
          </div>

          <!-- STATUS HERO CARD -->
          <div class="tg-status-card" [class.connected]="tgStatus.is_connected">
            <div class="tg-status-avatar" [class.active-avatar]="tgStatus.is_connected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </div>
            <div class="tg-status-info">
              <div class="tg-status-title-row">
                <h3>{{ tgStatus.is_connected ? (tgStatus.account_name || 'Conta Conectada') : 'Sessão Não Conectada' }}</h3>
                <span class="badge" [class.badge-success]="tgStatus.is_connected" [class.badge-warning]="!tgStatus.is_connected">
                  {{ tgStatus.is_connected ? '● CONECTADO & AUTORIZADO' : '○ DESCONECTADO' }}
                </span>
              </div>
              <div class="tg-meta-grid">
                <div class="tg-meta-item">
                  <span class="meta-label">Telefone:</span>
                  <span class="meta-val">{{ tgStatus.phone || 'Não informado' }}</span>
                </div>
                <div class="tg-meta-item" *ngIf="tgStatus.username">
                  <span class="meta-label">Username:</span>
                  <span class="meta-val text-cyan">{{ tgStatus.username }}</span>
                </div>
                <div class="tg-meta-item">
                  <span class="meta-label">Arquivo de Sessão:</span>
                  <span class="meta-val code-font">{{ tgStatus.session_file || 'telegram_user.session' }}</span>
                </div>
                <div class="tg-meta-item">
                  <span class="meta-label">API Hash:</span>
                  <span class="meta-val code-font">{{ tgStatus.api_hash_masked || 'Padrão MTProto' }}</span>
                </div>
              </div>
            </div>
            <div class="tg-status-actions" *ngIf="tgStatus.is_connected">
              <button class="btn btn-danger btn-sm" (click)="showDisconnectConfirm = true" [disabled]="tgLoading">
                <span>Desconectar Conta</span>
              </button>
            </div>
          </div>

          <!-- MÉTODOS DE CONEXÃO -->
          <div class="connection-methods-section">
            <div class="method-selector-tabs">
              <button class="method-tab-btn" [class.active]="tgAuthMode === 'phone'" (click)="tgAuthMode = 'phone'">
                <span>Opção 1: Conectar por Telefone (SMS/Telegram)</span>
              </button>
              <button class="method-tab-btn" [class.active]="tgAuthMode === 'string_session'" (click)="tgAuthMode = 'string_session'">
                <span>Opção 2: Importar StringSession</span>
              </button>
              <button class="method-tab-btn" [class.active]="tgAuthMode === 'custom_api'" (click)="tgAuthMode = 'custom_api'">
                <span>Opção 3: Credenciais da API (my.telegram.org)</span>
              </button>
            </div>

            <!-- OPÇÃO 1: POR TELEFONE -->
            <div *ngIf="tgAuthMode === 'phone'" class="method-box">
              <h4>Autenticação via Código de Acesso</h4>
              <p class="field-hint">Informe seu telefone internacional com DDI (ex: +55 11 99999-9999). O Telegram enviará o código de verificação diretamente para o seu aplicativo ou SMS.</p>

              <!-- ETAPA 1: ENVIAR NÚMERO -->
              <div *ngIf="!tgCodeSent" class="phone-row-form">
                <div class="field-block">
                  <label>Número de Telefone Internacional</label>
                  <div class="inline-input-group">
                    <input type="text" [(ngModel)]="tgPhoneInput" placeholder="+55 11 99999-9999" [disabled]="tgLoading">
                    <button class="btn btn-teal" (click)="sendTelegramCode()" [disabled]="!tgPhoneInput.trim() || tgLoading">
                      <span>{{ tgLoading ? 'Enviando...' : 'Enviar Código' }}</span>
                    </button>
                  </div>
                  <span class="field-subtext">Formato: +55 (DDD) 9XXXX-XXXX ou com código do país desejado.</span>
                </div>
              </div>

              <!-- ETAPA 2: DIGITAR CÓDIGO -->
              <div *ngIf="tgCodeSent" class="code-verify-form">
                <div class="sent-notice-box">
                  <span>Código enviado para <strong>{{ tgFormattedPhone || tgPhoneInput }}</strong></span>
                  <button class="btn-link" (click)="resetTelegramPhoneFlow()">Alterar telefone</button>
                </div>

                <div class="field-block">
                  <label>Código de Verificação Recebido</label>
                  <input type="text" [(ngModel)]="tgVerificationCode" placeholder="Ex: 58291" class="code-input" [disabled]="tgLoading">
                  <span class="field-subtext">Verifique o chat oficial de notificações do Telegram no seu celular.</span>
                </div>

                <div class="field-block" *ngIf="tgNeedsPassword">
                  <label>Senha de 2 Etapas (2FA Cloud Password)</label>
                  <input type="password" [(ngModel)]="tg2faPassword" placeholder="Digite sua senha de duas etapas..." [disabled]="tgLoading">
                  <span class="field-subtext">Sua conta do Telegram exige verificação em duas etapas.</span>
                </div>

                <div class="form-actions-row">
                  <button class="btn btn-secondary" (click)="resetTelegramPhoneFlow()" [disabled]="tgLoading">Cancelar</button>
                  <button class="btn btn-teal" (click)="verifyTelegramCode()" [disabled]="!tgVerificationCode.trim() || tgLoading">
                    <span>{{ tgLoading ? 'Autenticando...' : 'Confirmar e Conectar' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- OPÇÃO 2: IMPORTAR STRINGSESSION -->
            <div *ngIf="tgAuthMode === 'string_session'" class="method-box">
              <h4>Importar Telethon StringSession</h4>
              <p class="field-hint">Caso você já tenha uma sessão ativa gerada no Telethon, cole o token abaixo para ativá-la no PardalBot sem necessidade de código SMS.</p>

              <div class="field-block">
                <label>String de Sessão Telethon</label>
                <textarea [(ngModel)]="tgStringSessionInput" rows="5" class="code-textarea" placeholder="1BVtsOHQBu7... cole a chave de sessão aqui" [disabled]="tgLoading"></textarea>
              </div>

              <button class="btn btn-teal" (click)="importTelegramSession()" [disabled]="!tgStringSessionInput.trim() || tgLoading">
                <span>{{ tgLoading ? 'Importando...' : 'Validar e Ativar Sessão' }}</span>
              </button>
            </div>

            <!-- OPÇÃO 3: CREDENCIAIS API PERSONALIZADAS -->
            <div *ngIf="tgAuthMode === 'custom_api'" class="method-box">
              <h4>Chaves de API do Telegram (my.telegram.org)</h4>
              <p class="field-hint">Por padrão o sistema já utiliza credenciais válidas do Telegram. Preencha aqui apenas se você criou uma aplicação própria no portal oficial.</p>

              <div class="grid-2-cols">
                <div class="field-block">
                  <label>Telegram API ID</label>
                  <input type="text" [(ngModel)]="settings.telegram_api_id" placeholder="Ex: 12345678">
                </div>
                <div class="field-block">
                  <label>Telegram API Hash</label>
                  <input type="password" [(ngModel)]="settings.telegram_api_hash" placeholder="Ex: 0123456789abcdef0123456789abcdef">
                </div>
              </div>
              <button class="btn btn-teal" (click)="saveSettings()">
                <span>Salvar Credenciais da API</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRMAR DESCONEXÃO TELEGRAM -->
      <div *ngIf="showDisconnectConfirm" class="modal-backdrop">
        <div class="modal-dialog card confirm-modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Desconectar Conta do Telegram</h3>
            <button class="close-btn" (click)="showDisconnectConfirm = false">×</button>
          </div>
          <div class="modal-body">
            <p>Deseja realmente desconectar a sessão do Telegram <strong>{{ tgStatus.account_name || tgStatus.phone }}</strong>?</p>
            <p class="field-hint">O bot não conseguirá monitorar os canais de ofertas até que você realize um novo login.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDisconnectConfirm = false">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDisconnectTelegram()" [disabled]="tgLoading">
              <span>{{ tgLoading ? 'Desconectando...' : 'Sim, Desconectar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .category-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #14b8a6;
      letter-spacing: 0.08em;
      margin-bottom: 0.35rem;
      display: inline-block;
    }

    .main-title {
      font-size: 2rem;
      color: var(--text-primary);
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
    }

    .highlight-text {
      color: #14b8a6;
    }

    .subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      max-width: 780px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .btn-icon { width: 15px !important; height: 15px !important; min-width: 15px !important; max-width: 15px !important; 
      width: 16px;
      height: 16px;
     }

    /* TABS NAV */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      padding: 0.65rem 1.15rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tab-btn:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .tab-btn.active {
      background-color: rgba(20, 184, 166, 0.15);
      border-color: #14b8a6;
      color: #34d399;
    }

    .tab-icon { width: 15px !important; height: 15px !important; min-width: 15px !important; max-width: 15px !important; 
      width: 17px;
      height: 17px;
     }

    /* TAB CARD */
    .tab-card {
      padding: 1.75rem;
    }

    .form-section h2 {
      font-size: 1.35rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .section-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    .field-block {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.25rem;
    }

    .grid-2-cols {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .code-textarea {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.825rem;
      line-height: 1.5;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
    }

    .toggle-title {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .toggle-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* BLACKLIST WRAP */
    .add-term-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .keywords-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .keyword-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0.35rem 0.85rem;
      font-size: 0.825rem;
      color: var(--text-primary);
    }

    .remove-chip-btn {
      background: none;
      border: none;
      color: #f87171;
      font-weight: 700;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
    }

    /* TELEGRAM TAB STYLES */
    .tab-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-left: 0.25rem;
    }
    .tab-dot.online {
      background-color: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .tab-dot.offline {
      background-color: #ef4444;
    }

    .session-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .alert-banner {
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    .alert-success {
      background-color: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .alert-danger {
      background-color: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .alert-info {
      background-color: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }
    .alert-close {
      background: none;
      border: none;
      color: currentColor;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.75;
    }
    .alert-close:hover { opacity: 1; }

    .tg-status-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
      transition: all var(--transition-fast);
      flex-wrap: wrap;
    }
    .tg-status-card.connected {
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%);
    }

    .tg-status-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .tg-status-avatar.active-avatar {
      background-color: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
      color: #10b981;
    }
    .tg-status-avatar svg {
      width: 26px;
      height: 26px;
    }

    .tg-status-info {
      flex: 1;
      min-width: 250px;
    }
    .tg-status-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .tg-status-title-row h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .tg-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.5rem 1.5rem;
    }
    .tg-meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
    }
    .meta-label {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .meta-val {
      color: var(--text-primary);
      font-weight: 600;
    }
    .meta-val.text-cyan {
      color: var(--accent-cyan);
    }
    .code-font {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
    }

    .connection-methods-section {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .method-selector-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .method-tab-btn {
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      padding: 0.5rem 0.95rem;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .method-tab-btn:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.05);
    }
    .method-tab-btn.active {
      background-color: rgba(20, 184, 166, 0.15);
      border-color: #14b8a6;
      color: #34d399;
    }

    .method-box h4 {
      font-size: 1.05rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .inline-input-group {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.35rem;
    }
    .inline-input-group input {
      flex: 1;
    }

    .field-subtext {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.35rem;
      display: block;
    }

    .code-verify-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 450px;
    }
    .sent-notice-box {
      background-color: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: var(--radius-sm);
      padding: 0.65rem 0.95rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--text-primary);
    }
    .btn-link {
      background: none;
      border: none;
      color: #38bdf8;
      cursor: pointer;
      font-size: 0.75rem;
      text-decoration: underline;
    }
    .code-input {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.15rem;
      letter-spacing: 0.2em;
    }
    .form-actions-row {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    /* MODAL BACKDROP */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .confirm-modal-card {
      max-width: 440px;
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.35rem;
      cursor: pointer;
    }
    .modal-body {
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .page-header .btn {
        width: 100%;
        justify-content: center;
      }
      .tabs-nav {
        overflow-x: auto;
        padding-bottom: 0.35rem;
        flex-wrap: nowrap;
      }
      .tab-btn {
        white-space: nowrap;
        flex-shrink: 0;
      }
      .grid-2-cols {
        grid-template-columns: 1fr;
      }
      .tg-status-card {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .tg-meta-grid {
        grid-template-columns: 1fr;
      }
      .inline-input-group {
        flex-direction: column;
      }
      .inline-input-group .btn {
        width: 100%;
        justify-content: center;
      }
      .form-actions-row {
        flex-direction: column;
      }
      .form-actions-row button {
        width: 100%;
        justify-content: center;
      }
      .confirm-modal-card {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 1rem auto;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  api = inject(ApiService);

  activeTab: 'templates' | 'ai' | 'blacklist' | 'credentials' | 'telegram' = 'templates';

  settings: any = {
    message_template: '',
    gemini_prompt: '',
    ai_enabled: false,
    magalu_enabled: true,
    whatsapp_admin_dest: '',
    whatsapp_group_dest: '',
    footer_text: '',
    openrouter_model_1: 'openai/gpt-oss-20b:free',
    openrouter_model_2: 'google/gemma-4-26b-a4b-it:free',
    groq_model_1: 'groq/compound',
    groq_model_2: 'llama-3.1-8b-instant',
    forbidden_keywords: [],
    shopee_app_id: '',
    shopee_app_secret: '',
    openrouter_api_key: '',
    groq_api_key: '',
    google_api_key: '',
    telegram_api_id: '',
    telegram_api_hash: '',
    telegram_session_name: ''
  };

  newKeyword = '';
  saveStatusText = '';

  // Telegram Session State
  tgStatus = {
    is_connected: false,
    session_exists: false,
    account_name: '',
    phone: '',
    username: '',
    session_file: '',
    api_id: '',
    api_hash_masked: ''
  };

  tgLoading = false;
  tgAlertMessage = '';
  tgAlertType: 'success' | 'danger' | 'info' = 'info';

  tgAuthMode: 'phone' | 'string_session' | 'custom_api' = 'phone';
  tgPhoneInput = '';
  tgFormattedPhone = '';
  tgPhoneCodeHash = '';
  tgCodeSent = false;
  tgVerificationCode = '';
  tg2faPassword = '';
  tgNeedsPassword = false;
  tgStringSessionInput = '';
  showDisconnectConfirm = false;

  ngOnInit() {
    this.loadSettings();
    this.loadTelegramStatus();
  }

  selectTab(tab: 'templates' | 'ai' | 'blacklist' | 'credentials' | 'telegram') {
    this.activeTab = tab;
    if (tab === 'telegram') {
      this.loadTelegramStatus();
    }
  }

  loadSettings() {
    this.api.getSettings().subscribe({
      next: (data) => {
        this.settings = { ...this.settings, ...data };
      },
      error: () => {}
    });
  }

  saveSettings() {
    this.saveStatusText = 'Salvando...';
    this.api.updateSettings(this.settings).subscribe({
      next: () => {
        this.saveStatusText = 'Salvo com sucesso!';
        this.tgAlertMessage = 'Configurações salvas com sucesso!';
        this.tgAlertType = 'success';
        setTimeout(() => {
          this.saveStatusText = '';
          this.tgAlertMessage = '';
        }, 3000);
      },
      error: () => {
        this.saveStatusText = 'Erro ao salvar';
        this.tgAlertMessage = 'Erro ao salvar configurações';
        this.tgAlertType = 'danger';
        setTimeout(() => this.saveStatusText = '', 3000);
      }
    });
  }

  addKeyword() {
    if (this.newKeyword.trim()) {
      this.settings.forbidden_keywords.push(this.newKeyword.trim());
      this.newKeyword = '';
    }
  }

  removeKeyword(idx: number) {
    this.settings.forbidden_keywords.splice(idx, 1);
  }

  // --- TELEGRAM SESSION METHODS ---
  loadTelegramStatus() {
    this.tgLoading = true;
    this.api.getTelegramSessionStatus().subscribe({
      next: (data) => {
        this.tgLoading = false;
        this.tgStatus = data;
      },
      error: () => {
        this.tgLoading = false;
        this.tgStatus = {
          is_connected: false,
          session_exists: false,
          account_name: 'Erro ao conectar',
          phone: '',
          username: '',
          session_file: '',
          api_id: '',
          api_hash_masked: ''
        };
      }
    });
  }

  sendTelegramCode() {
    if (!this.tgPhoneInput.trim()) return;
    this.tgLoading = true;
    this.tgAlertMessage = '';

    this.api.sendTelegramCode({
      phone: this.tgPhoneInput.trim(),
      api_id: this.settings.telegram_api_id ? String(this.settings.telegram_api_id) : undefined,
      api_hash: this.settings.telegram_api_hash || undefined
    }).subscribe({
      next: (res) => {
        this.tgLoading = false;
        this.tgCodeSent = true;
        this.tgPhoneCodeHash = res.phone_code_hash;
        this.tgFormattedPhone = res.phone;
        this.tgAlertMessage = res.message;
        this.tgAlertType = 'info';
      },
      error: (err) => {
        this.tgLoading = false;
        this.tgAlertMessage = err.error?.detail || 'Erro ao enviar código de verificação para o Telegram.';
        this.tgAlertType = 'danger';
      }
    });
  }

  verifyTelegramCode() {
    if (!this.tgVerificationCode.trim()) return;
    this.tgLoading = true;
    this.tgAlertMessage = '';

    this.api.verifyTelegramCode({
      phone: this.tgPhoneInput.trim(),
      code: this.tgVerificationCode.trim(),
      phone_code_hash: this.tgPhoneCodeHash,
      password: this.tg2faPassword ? this.tg2faPassword.trim() : undefined,
      api_id: this.settings.telegram_api_id ? String(this.settings.telegram_api_id) : undefined,
      api_hash: this.settings.telegram_api_hash || undefined
    }).subscribe({
      next: (res) => {
        this.tgLoading = false;
        if (res.needs_password) {
          this.tgNeedsPassword = true;
          this.tgAlertMessage = res.message;
          this.tgAlertType = 'info';
          return;
        }

        this.tgAlertMessage = res.message || 'Sessão do Telegram autenticada e conectada com sucesso!';
        this.tgAlertType = 'success';
        this.resetTelegramPhoneFlow();
        this.loadTelegramStatus();
      },
      error: (err) => {
        this.tgLoading = false;
        this.tgAlertMessage = err.error?.detail || 'Erro ao validar código. Verifique e tente novamente.';
        this.tgAlertType = 'danger';
      }
    });
  }

  resetTelegramPhoneFlow() {
    this.tgCodeSent = false;
    this.tgVerificationCode = '';
    this.tg2faPassword = '';
    this.tgNeedsPassword = false;
    this.tgPhoneCodeHash = '';
  }

  importTelegramSession() {
    if (!this.tgStringSessionInput.trim()) return;
    this.tgLoading = true;
    this.tgAlertMessage = '';

    this.api.importTelegramSession({
      session_string: this.tgStringSessionInput.trim(),
      api_id: this.settings.telegram_api_id ? String(this.settings.telegram_api_id) : undefined,
      api_hash: this.settings.telegram_api_hash || undefined
    }).subscribe({
      next: (res) => {
        this.tgLoading = false;
        this.tgAlertMessage = res.message || 'StringSession importada e validada com sucesso!';
        this.tgAlertType = 'success';
        this.tgStringSessionInput = '';
        this.loadTelegramStatus();
      },
      error: (err) => {
        this.tgLoading = false;
        this.tgAlertMessage = err.error?.detail || 'Erro ao importar StringSession do Telegram.';
        this.tgAlertType = 'danger';
      }
    });
  }

  executeDisconnectTelegram() {
    this.tgLoading = true;
    this.showDisconnectConfirm = false;
    this.tgAlertMessage = '';

    this.api.disconnectTelegram().subscribe({
      next: (res) => {
        this.tgLoading = false;
        this.tgAlertMessage = res.message || 'Sessão do Telegram desconectada.';
        this.tgAlertType = 'info';
        this.loadTelegramStatus();
      },
      error: (err) => {
        this.tgLoading = false;
        this.tgAlertMessage = err.error?.detail || 'Erro ao desconectar sessão do Telegram.';
        this.tgAlertType = 'danger';
      }
    });
  }
}
