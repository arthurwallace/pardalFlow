import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Settings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
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

    .backup-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 1.25rem;
    }
    .backup-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .backup-box-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .backup-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .export-icon {
      background: rgba(20, 184, 166, 0.15);
      color: #14b8a6;
    }
    .import-icon {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }
    .backup-icon {
      width: 24px;
      height: 24px;
    }
    .backup-box-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }
    .backup-box-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }
    .backup-included-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .included-item {
      display: flex;
      align-items: center;
      color: #cbd5e1;
    }
    .btn-full {
      width: 100%;
      justify-content: center;
    }
    .import-dropzone {
      border: 2px dashed rgba(56, 189, 248, 0.4);
      background: rgba(56, 189, 248, 0.03);
      border-radius: var(--radius-md);
      padding: 1.75rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .import-dropzone:hover {
      border-color: #38bdf8;
      background: rgba(56, 189, 248, 0.08);
    }
    .dropzone-icon {
      width: 36px;
      height: 36px;
      color: #38bdf8;
    }
    .dropzone-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: var(--text-primary);
      text-align: center;
    }
    .dropzone-text span {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .backup-alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .backup-alert.success {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
    }
    .backup-alert.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    /* CREDENTIALS MATRIX STYLES */
    .credentials-status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .status-summary-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .status-summary-card.is-ok {
      border-color: rgba(34, 197, 94, 0.35);
      background: rgba(34, 197, 94, 0.03);
    }

    .status-summary-card.is-pending {
      border-color: rgba(245, 158, 11, 0.35);
      background: rgba(245, 158, 11, 0.03);
    }

    .status-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--text-secondary);
    }

    .status-indicator-pill {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      letter-spacing: 0.04em;
    }

    .status-indicator-pill.ok {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
    }

    .status-indicator-pill.pending {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .status-value {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .credential-box-section {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .box-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .box-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .info-callout {
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: var(--text-primary);
    }

    .info-callout code {
      background: rgba(0, 0, 0, 0.3);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-family: monospace;
      color: #38bdf8;
      align-self: flex-start;
    }

    .info-callout small {
      color: var(--text-secondary);
    }
  `]
})
export class SettingsComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  activeTab: 'templates' | 'ai' | 'blacklist' | 'credentials' | 'telegram' | 'backup' = 'templates';

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
    shopee_subid: '',
    amazon_tag: '',
    magalu_store: '',
    waha_base_url: 'http://192.168.1.25:3000',
    waha_api_key: '6f1186b6522246c1b0015b9117d56d05',
    telegram_bot_token: '',
    telegram_admin_chat_id: '',
    openrouter_api_key: '',
    groq_api_key: '',
    google_api_key: '',
    telegram_api_id: '',
    telegram_api_hash: '',
    telegram_session_name: ''
  };

  newKeyword = '';
  saveStatusText = '';
  wahaTesting = false;
  wahaTestResult = '';
  wahaTestOk = false;

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
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && ['templates', 'ai', 'blacklist', 'credentials', 'telegram', 'backup'].includes(tab)) {
        this.selectTab(tab as any);
      }
    });
    this.loadSettings();
    this.loadTelegramStatus();
  }

  selectTab(tab: 'templates' | 'ai' | 'blacklist' | 'credentials' | 'telegram' | 'backup') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    if (tab === 'telegram') {
      this.loadTelegramStatus();
    }
  }

  loadSettings() {
    this.api.getSettings().subscribe({
      next: (data) => {
        this.settings = { ...this.settings, ...data };
        if (!this.settings.waha_base_url || this.settings.waha_base_url.includes('localhost') || this.settings.waha_base_url.includes('127.0.0.1')) {
          this.settings.waha_base_url = 'http://192.168.1.25:3000';
        }
        if (!this.settings.waha_api_key) {
          this.settings.waha_api_key = '6f1186b6522246c1b0015b9117d56d05';
        }
      },
      error: () => { }
    });
  }

  testWahaConnection() {
    this.wahaTesting = true;
    this.wahaTestResult = '';
    // Salva URL e Key antes de testar
    this.api.updateSettings({
      waha_base_url: this.settings.waha_base_url,
      waha_api_key: this.settings.waha_api_key
    }).subscribe({
      next: () => {
        this.api.getWahaSessions().subscribe({
          next: (res: any) => {
            this.wahaTesting = false;
            const sessions = Array.isArray(res) ? res : (Array.isArray(res?.sessions) ? res.sessions : []);
            if (sessions.length > 0) {
              const details = sessions.map((s: any) => `${s.name} (${s.status || 'ativo'})`).join(', ');
              this.wahaTestResult = `✅ Conexão bem-sucedida! ${sessions.length} sessão(ões) encontrada(s): ${details}`;
              this.wahaTestOk = true;
            } else {
              this.wahaTestResult = `⚠️ Conectou ao WAHA em ${this.settings.waha_base_url}, mas a lista de sessões retornou vazia. Verifique se as sessões estão criadas neste servidor.`;
              this.wahaTestOk = true;
            }
          },
          error: (err) => {
            this.wahaTesting = false;
            this.wahaTestResult = `❌ Falha ao consultar sessões no WAHA: ${err?.error?.detail || err.message || 'Erro de rede'}`;
            this.wahaTestOk = false;
          }
        });
      },
      error: (err) => {
        this.wahaTesting = false;
        this.wahaTestResult = `❌ Erro ao salvar configurações: ${err.message}`;
        this.wahaTestOk = false;
      }
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

  // Account Backup & Migration State
  backupExporting = false;
  backupImporting = false;
  selectedBackupFile: File | null = null;
  backupSuccessMessage = '';
  backupErrorMessage = '';

  downloadAccountBackup() {
    this.backupExporting = true;
    this.backupSuccessMessage = '';
    this.backupErrorMessage = '';

    this.api.exportAccountBackup().subscribe({
      next: (blob) => {
        this.backupExporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `pardalflow_backup_${now}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.backupSuccessMessage = 'Arquivo de backup exportado e baixado com sucesso!';
      },
      error: (err) => {
        this.backupExporting = false;
        this.backupErrorMessage = 'Erro ao exportar backup: ' + (err.error?.detail || err.message || 'Falha na conexão');
      }
    });
  }

  onBackupFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.selectedBackupFile = file;
      this.backupSuccessMessage = '';
      this.backupErrorMessage = '';
    }
  }

  uploadAccountBackup() {
    if (!this.selectedBackupFile) return;

    this.backupImporting = true;
    this.backupSuccessMessage = '';
    this.backupErrorMessage = '';

    this.api.importAccountBackup(this.selectedBackupFile).subscribe({
      next: (res) => {
        this.backupImporting = false;
        const details = res.restored || {};
        const tgMsg = details.telegram_session_restored ? ' e Sessão do Telegram ativa conectada' : '';
        this.backupSuccessMessage = `✅ Sucesso! ${details.channels_count || 0} canais, ${details.whatsapp_groups_count || 0} grupos, ${details.telegram_destinations_count || 0} destinos${tgMsg} restaurados com sucesso!`;
        this.selectedBackupFile = null;
        this.loadSettings();
        this.loadTelegramStatus();
      },
      error: (err) => {
        this.backupImporting = false;
        this.backupErrorMessage = 'Erro ao restaurar backup: ' + (err.error?.detail || err.message || 'Arquivo inválido');
      }
    });
  }
}
