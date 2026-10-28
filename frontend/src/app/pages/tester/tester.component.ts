import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WhatsAppGroup } from '../../core/models';

@Component({
  selector: 'app-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tester-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div>
          <span class="category-tag">AUTOMAÇÃO E TESTES</span>
          <h1 class="main-title">Enviar / Simular <span class="highlight-text">mensagens</span></h1>
          <p class="subtitle">
            Cole o link de um produto ou o texto completo de um anúncio para simular a conversão e pré-visualizar o balão de WhatsApp.
          </p>
        </div>
      </div>

      <!-- ERROR ALERT BANNER -->
      <div *ngIf="hasError" class="error-banner">
        <div class="error-left">
          <div class="error-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-svg">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="error-texts">
            <h4 class="error-title">Erro ao processar simulação</h4>
            <p class="error-msg">{{ errorMessage }}</p>
            <div *ngIf="errorDetails" class="error-details-box">
              <span class="details-label">Detalhes técnicos:</span>
              <pre>{{ errorDetails }}</pre>
            </div>
          </div>
        </div>
        <button class="error-close-btn" (click)="clearError()" title="Fechar alerta">×</button>
      </div>

      <!-- SUCCESS BANNER -->
      <div *ngIf="successMessage" class="success-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="success-svg">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ successMessage }}</span>
        <button class="success-close-btn" (click)="successMessage = ''">×</button>
      </div>

      <div class="tester-layout">
        <!-- INPUT COLUMN -->
        <div class="card input-card">
          <h2>Mensagem de Entrada</h2>
          <p class="card-sub">Cole links (Shopee, Mercado Livre, Amazon, Magalu) ou o texto bruto de um grupo monitorado.</p>

          <textarea [(ngModel)]="rawText" rows="11" placeholder="Exemplo:
🔥 OFERTA IMPERDÍVEL!
Smartphone Xiaomi Redmi Note 13 256GB
De: R$ 1.699,00
Por: R$ 1.199,00
Cupom: NOTE13
Link: https://shopee.com.br/product/..."></textarea>

          <div class="action-buttons-row">
            <button class="btn btn-secondary" (click)="testConvertOnly()" [disabled]="loading">
              <svg *ngIf="loadingAction === 'convert'" class="btn-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
              <span>{{ loadingAction === 'convert' ? 'Convertendo...' : 'Converter Links' }}</span>
            </button>
            <button class="btn btn-teal" (click)="testFullPipeline()" [disabled]="loading">
              <svg *ngIf="loadingAction === 'pipeline'" class="btn-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
              <svg *ngIf="loadingAction !== 'pipeline'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              <span>{{ loadingAction === 'pipeline' ? 'Processando Pipeline...' : 'Executar Pipeline Completo (Links + IA)' }}</span>
            </button>
          </div>
        </div>

        <!-- PREVIEW COLUMN (Realistic WhatsApp Bubble) -->
        <div class="card preview-card">
          <div class="preview-head">
            <h2>Pré-visualização (WhatsApp)</h2>
            <span class="preview-badge">Balão de Envio</span>
          </div>

          <div class="whatsapp-chat-frame">
            <div class="chat-bubble">
              <div class="bubble-content" [innerHTML]="formattedHtml"></div>
              <div class="bubble-time">12:30 ✓✓</div>
            </div>
          </div>

          <div *ngIf="resultLinks" class="converted-links-box">
            <div class="links-title-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tag-svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <span class="links-title">Links Identificados & Convertidos</span>
            </div>
            <p class="links-sub">O link foi convertido para a sua conta de afiliado e o balão foi formatado no padrão oficial.</p>
          </div>

          <!-- SEÇÃO DE DISPARO REAL (Prévia -> Enviar de verdade e para quais grupos ou cancelar) -->
          <div class="dispatch-action-box">
            <div class="dispatch-box-header">
              <div class="dispatch-box-title">
                <span class="box-badge-tag">AÇÃO DE DISPARO REAL</span>
                <h4>Disparar para Grupos de WhatsApp</h4>
              </div>
              <span class="count-pill">{{ selectedGroupIds.length | number }} de {{ whatsappGroups.length | number }} grupos</span>
            </div>

            <p class="dispatch-box-sub">
              Após conferir a prévia do balão acima, selecione para quais grupos deseja enviar de verdade ou cancele:
            </p>

            <!-- SELEÇÃO DE GRUPOS -->
            <div class="groups-selector-wrap">
              <div class="selector-links-row">
                <span class="selector-heading">Grupos de Destino:</span>
                <div class="selector-quick-actions">
                  <button type="button" class="btn-text-action" (click)="selectAllGroups()">Marcar todos</button>
                  <span class="sep">•</span>
                  <button type="button" class="btn-text-action" (click)="clearAllGroups()">Desmarcar todos</button>
                </div>
              </div>

              <div class="groups-chips-list">
                <div 
                  *ngFor="let g of whatsappGroups" 
                  class="group-select-pill"
                  [class.selected]="isGroupSelected(g.id)"
                  (click)="toggleGroup(g.id)"
                >
                  <span class="pill-check">{{ isGroupSelected(g.id) ? '✓' : '' }}</span>
                  <span class="pill-label">{{ g.name }}</span>
                </div>
                <div *ngIf="whatsappGroups.length === 0" class="no-groups-text">
                  Nenhum grupo de WhatsApp encontrado.
                </div>
              </div>
            </div>

            <!-- BOTÕES: ENVIAR DE VERDADE OU CANCELAR -->
            <div class="dispatch-buttons-footer">
              <button 
                type="button" 
                class="btn btn-teal btn-dispatch-action" 
                (click)="sendRealDispatch()" 
                [disabled]="dispatching || selectedGroupIds.length === 0"
              >
                <svg *ngIf="dispatching" class="btn-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
                <svg *ngIf="!dispatching" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <span>{{ dispatching ? 'Disparando...' : 'Enviar de verdade' }}</span>
              </button>

              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="cancelDispatch()"
                [disabled]="dispatching"
              >
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tester-page {
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

    /* ERROR BANNER */
    .error-banner {
      background-color: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-left: 4px solid #ef4444;
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      animation: fadeIn 0.2s ease-in-out;
    }

    .error-left {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .error-icon-box {
      color: #ef4444;
      margin-top: 0.15rem;
    }

    .error-svg {
      width: 20px;
      height: 20px;
    }

    .error-texts {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .error-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ef4444;
      margin: 0;
    }

    .error-msg {
      font-size: 0.85rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
    }

    .error-details-box {
      margin-top: 0.5rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-sm);
      padding: 0.5rem 0.75rem;
    }

    .details-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.25rem;
    }

    .error-details-box pre {
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      color: #fca5a5;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .error-close-btn, .success-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.25rem;
      transition: color var(--transition-fast);
    }

    .error-close-btn:hover {
      color: #ef4444;
    }

    /* SUCCESS BANNER */
    .success-banner {
      background-color: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-left: 4px solid #10b981;
      border-radius: var(--radius-md);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #10b981;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .success-svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .success-banner span {
      flex: 1;
      color: var(--text-primary);
    }

    /* TESTER LAYOUT */
    .tester-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .card h2 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .card-sub {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    textarea {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
      width: 100%;
      resize: vertical;
    }

    .action-buttons-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-icon {
      width: 15px !important;
      height: 15px !important;
      min-width: 15px !important;
      max-width: 15px !important;
    }

    .btn-spinner {
      width: 15px;
      height: 15px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* PREVIEW CARD */
    .preview-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .preview-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #34d399;
      background-color: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.15rem 0.55rem;
      border-radius: var(--radius-full);
    }

    .whatsapp-chat-frame {
      background: #0b141a url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png') repeat;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .chat-bubble {
      background-color: #005c4b;
      color: #e9edef;
      padding: 0.75rem 1rem;
      border-radius: 8px 0px 8px 8px;
      max-width: 90%;
      margin-left: auto;
      box-shadow: 0 1px 0.5px rgba(11, 20, 26, 0.13);
      font-size: 0.875rem;
      line-height: 1.45;
      position: relative;
    }

    .bubble-content {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .bubble-time {
      font-size: 0.65rem;
      color: rgba(233, 237, 239, 0.6);
      text-align: right;
      margin-top: 0.35rem;
    }

    .converted-links-box {
      margin-top: 1rem;
      padding: 0.85rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .links-title-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.35rem;
    }

    .tag-svg {
      width: 14px;
      height: 14px;
      color: #14b8a6;
    }

    .links-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dispatch-action-box {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(20, 184, 166, 0.3);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .dispatch-box-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .box-badge-tag {
      font-size: 0.65rem;
      font-weight: 800;
      color: #14b8a6;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.2rem;
    }

    .dispatch-box-title h4 {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 700;
      margin: 0;
    }

    .count-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      background: rgba(20, 184, 166, 0.15);
      color: #2dd4bf;
      border: 1px solid rgba(20, 184, 166, 0.3);
      white-space: nowrap;
    }

    .dispatch-box-sub {
      font-size: 0.825rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    .groups-selector-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .selector-links-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .selector-heading {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .selector-quick-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-text-action {
      background: none;
      border: none;
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }

    .btn-text-action:hover {
      color: #7dd3fc;
      text-decoration: underline;
    }

    .sep {
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    .groups-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      max-height: 140px;
      overflow-y: auto;
      padding: 0.2rem 0;
    }

    .group-select-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      font-size: 0.78rem;
      background: #1e293b;
      color: var(--text-secondary);
      border: 1px solid #334155;
      cursor: pointer;
      user-select: none;
      transition: all 0.15s;
    }

    .group-select-pill:hover {
      border-color: #64748b;
      color: var(--text-primary);
    }

    .group-select-pill.selected {
      background: rgba(20, 184, 166, 0.18);
      border-color: #14b8a6;
      color: #5eead4;
      font-weight: 600;
    }

    .pill-check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid #64748b;
      font-size: 0.65rem;
      line-height: 1;
    }

    .group-select-pill.selected .pill-check {
      background: #14b8a6;
      border-color: #14b8a6;
      color: #042f2e;
      font-weight: 900;
    }

    .no-groups-text {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .dispatch-buttons-footer {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .btn-dispatch-action {
      flex: 1;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(20, 184, 166, 0.25);
    }

    @media (max-width: 768px) {
      .tester-layout {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      .action-buttons-row {
        flex-direction: column;
      }
      .action-buttons-row .btn {
        width: 100%;
        justify-content: center;
      }
      .dispatch-buttons-footer {
        flex-direction: column;
      }
      .dispatch-buttons-footer button {
        width: 100%;
        justify-content: center;
      }
      .chat-bubble {
        max-width: 96%;
      }
    }
  `]
})
export class TesterComponent implements OnInit {
  api = inject(ApiService);

  rawText = `🔥 OFERTA IMPERDÍVEL!
Smartphone Xiaomi Redmi Note 13 256GB
❌ De: ~R$ 1.699,00~
✅ Por: *R$ 1.199,00*
🎟️ Cupom: *NOTE13*
🛒 Compre Aqui: https://shopee.com.br/product/329735208/8871089270
🚚 Frete Grátis com cupom

💛 Compartilhe com os amigos nosso grupo: https://t.me/seucanal`;

  formattedHtml = '';
  resultLinks = false;
  loading = false;
  loadingAction: 'convert' | 'pipeline' | null = null;

  whatsappGroups: WhatsAppGroup[] = [];
  selectedGroupIds: string[] = [];
  dispatching = false;

  hasError = false;
  errorMessage = '';
  errorDetails = '';
  successMessage = '';

  constructor() {
    this.updatePreview(this.rawText);
  }

  ngOnInit() {
    this.loadWhatsAppGroups();
  }

  loadWhatsAppGroups() {
    this.api.getWhatsAppGroups().subscribe({
      next: (groups) => {
        this.whatsappGroups = groups || [];
        this.selectedGroupIds = this.whatsappGroups
          .filter(g => g.active !== false)
          .map(g => g.id);
      },
      error: () => {}
    });
  }

  isGroupSelected(id: string): boolean {
    return this.selectedGroupIds.includes(id);
  }

  toggleGroup(id: string) {
    const idx = this.selectedGroupIds.indexOf(id);
    if (idx > -1) {
      this.selectedGroupIds.splice(idx, 1);
    } else {
      this.selectedGroupIds.push(id);
    }
  }

  selectAllGroups() {
    this.selectedGroupIds = this.whatsappGroups.map(g => g.id);
  }

  clearAllGroups() {
    this.selectedGroupIds = [];
  }

  sendRealDispatch() {
    if (!this.rawText.trim()) {
      this.hasError = true;
      this.errorMessage = 'Não há texto de mensagem para enviar.';
      return;
    }
    if (this.selectedGroupIds.length === 0) {
      this.hasError = true;
      this.errorMessage = 'Selecione pelo menos um grupo de WhatsApp para onde enviar a mensagem de verdade.';
      return;
    }

    this.dispatching = true;
    this.clearError();
    this.successMessage = '';

    const targetNames = this.whatsappGroups
      .filter(g => this.selectedGroupIds.includes(g.id))
      .map(g => g.name);

    this.api.dispatchNow({
      text: this.rawText,
      channel_name: 'Simulador / Disparo Manual',
      custom_target_groups: targetNames
    }).subscribe({
      next: () => {
        this.dispatching = false;
        this.successMessage = `Mensagem enviada de verdade para ${targetNames.length} grupo(s) com sucesso e registrada no histórico do Dashboard!`;
      },
      error: (err) => {
        this.dispatching = false;
        this.hasError = true;
        this.errorMessage = err.error?.detail || err.message || 'Erro ao realizar envio para os grupos de WhatsApp.';
        if (err.error && typeof err.error === 'object') {
          this.errorDetails = JSON.stringify(err.error, null, 2);
        }
      }
    });
  }

  cancelDispatch() {
    this.clearAllGroups();
    this.successMessage = 'Disparo cancelado pelo usuário. Nenhum grupo foi acionado.';
    setTimeout(() => {
      if (this.successMessage.includes('cancelado')) {
        this.successMessage = '';
      }
    }, 4000);
  }

  updatePreview(text: string) {
    if (!text) {
      this.formattedHtml = '';
      return;
    }
    this.formattedHtml = text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br>');
  }

  clearError() {
    this.hasError = false;
    this.errorMessage = '';
    this.errorDetails = '';
  }

  testConvertOnly() {
    this.clearError();
    this.successMessage = '';
    this.loading = true;
    this.loadingAction = 'convert';

    this.api.testConvertLinks(this.rawText).subscribe({
      next: (res) => {
        this.loading = false;
        this.loadingAction = null;
        if (res && res.converted_text) {
          this.rawText = res.converted_text;
          this.resultLinks = true;
          this.updatePreview(res.converted_text);
          this.successMessage = 'Links convertidos com sucesso!';
        } else {
          this.hasError = true;
          this.errorMessage = 'A API retornou uma resposta sem texto convertido.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadingAction = null;
        this.hasError = true;
        this.errorMessage = err.error?.detail || err.message || 'Erro interno no servidor ao converter links (500).';
        if (err.error && typeof err.error === 'object') {
          this.errorDetails = JSON.stringify(err.error, null, 2);
        } else if (err.status) {
          this.errorDetails = `HTTP Status: ${err.status} - ${err.statusText || ''}`;
        }
      }
    });
  }

  testFullPipeline() {
    this.clearError();
    this.successMessage = '';
    this.loading = true;
    this.loadingAction = 'pipeline';

    this.api.testPipeline(this.rawText).subscribe({
      next: (res) => {
        this.loading = false;
        this.loadingAction = null;
        const finalText = res.final_text || res.step4_ai_formatted || res.step3_converted_links || '';
        if (finalText) {
          this.rawText = finalText;
          this.resultLinks = true;
          this.updatePreview(finalText);
          this.successMessage = 'Pipeline executado com sucesso (Limpeza + Links + IA + Rodapé)!';
        } else {
          this.hasError = true;
          this.errorMessage = 'O pipeline não retornou texto formatado.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadingAction = null;
        this.hasError = true;
        this.errorMessage = err.error?.detail || err.message || 'Erro interno no servidor ao processar pipeline (500).';
        if (err.error && typeof err.error === 'object') {
          this.errorDetails = JSON.stringify(err.error, null, 2);
        } else if (err.status) {
          this.errorDetails = `HTTP Status: ${err.status} - ${err.statusText || ''}`;
        }
      }
    });
  }
}
