import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Channel, WhatsAppGroup } from '../../core/models';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="espelhar-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div class="header-left">
          <span class="category-tag">AUTOMAÇÃO E DISPAROS</span>
          <h1 class="main-title">Espelhar <span class="highlight-text">canais</span></h1>
          <p class="subtitle">
            Monitore canais e grupos de ofertas em tempo real e replique automaticamente para seus grupos de WhatsApp com regras personalizadas de cupom, imagem e rodapé.
          </p>
        </div>
        <div class="header-right">
          <button class="btn btn-how-it-works" (click)="showHowItWorks = !showHowItWorks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>Como funciona</span>
          </button>
        </div>
      </div>

      <!-- HOW IT WORKS COLLAPSIBLE PANEL -->
      <div *ngIf="showHowItWorks" class="how-it-works-panel card">
        <div class="panel-header">
          <h3>Fluxo do Espelhamento de Canais</h3>
          <button class="close-btn" (click)="showHowItWorks = false">×</button>
        </div>
        <div class="steps-grid">
          <div class="step-card">
            <span class="step-num">1</span>
            <h4>Monitoramento MTProto</h4>
            <p>O bot monitora os 30 canais em tempo real sem delay via sessão Telethon.</p>
          </div>
          <div class="step-card">
            <span class="step-num">2</span>
            <h4>Conversor de Links</h4>
            <p>Converte links de Shopee, Mercado Livre, Amazon e Magalu com suas tags de afiliado.</p>
          </div>
          <div class="step-card">
            <span class="step-num">3</span>
            <h4>Reescrita com IA & Filtros</h4>
            <p>Remove links concorrentes, marcas d'água e aplica templates inteligentes.</p>
          </div>
          <div class="step-card">
            <span class="step-num">4</span>
            <h4>Disparo nos Grupos Vinculados</h4>
            <p>Envia exclusivamente para os grupos de WhatsApp marcados em cada canal.</p>
          </div>
        </div>
      </div>

      <!-- ACTION BAR -->
      <div class="action-pills-bar">
        <button class="pill-btn" (click)="fixReceipt()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pill-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
          <span>{{ fixStatusText || 'Corrigir recebimento' }}</span>
        </button>

        <button class="pill-btn pill-danger" (click)="showConfirmPauseModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pill-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          <span>Pausar espelhamento</span>
        </button>

        <button class="btn btn-teal ml-auto" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Adicionar Canal</span>
        </button>
      </div>

      <!-- INFO TIP BANNER -->
      <div class="info-tip-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tip-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>O bot manda mensagem mas parou de receber (grupos monitorados)? Use <strong>"Corrigir recebimento"</strong> antes de reconectar do zero.</span>
      </div>

      <!-- MONITORED GROUPS SECTION -->
      <div class="monitored-groups-panel card">
        <div class="section-top">
          <div class="title-with-count">
            <h2>Canais Monitorados <span class="count-badge">{{ activeChannelsCount | number }}/{{ channels.length | number }}</span></h2>
            <p class="section-explanation">
              Canais de ORIGEM — de onde as ofertas são capturadas, limpas e encaminhadas para seus grupos de destino.
            </p>
          </div>

          <!-- CONTROLS ROW: STATUS FILTER PILLS & SEARCH -->
          <div class="filter-controls-row">
            <!-- STATUS FILTER PILLS -->
            <div class="status-tabs-pills">
              <button 
                class="status-tab" 
                [class.active]="statusFilter === 'all'" 
                (click)="statusFilter = 'all'"
              >
                Todos <span class="tab-count">{{ channels.length }}</span>
              </button>
              <button 
                class="status-tab" 
                [class.active]="statusFilter === 'active'" 
                (click)="statusFilter = 'active'"
              >
                Ativos <span class="tab-count">{{ activeChannelsCount }}</span>
              </button>
              <button 
                class="status-tab" 
                [class.active]="statusFilter === 'inactive'" 
                (click)="statusFilter = 'inactive'"
              >
                Pausados <span class="tab-count">{{ inactiveChannelsCount }}</span>
              </button>
            </div>

            <!-- SEARCH INPUT -->
            <div class="search-filter-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" [(ngModel)]="searchFilter" placeholder="Filtrar canal ou ID...">
            </div>
          </div>
        </div>

        <!-- CHANNELS GRID -->
        <div class="channels-grid">
          <div *ngFor="let ch of filteredChannels" class="channel-card" [class.inactive-card]="!ch.active">
            <!-- CARD HEAD -->
            <div class="card-head">
              <div class="channel-identity">
                <div class="channel-avatar">
                  {{ ch.name.replace('@', '').charAt(0).toUpperCase() }}
                </div>
                <div class="channel-info">
                  <div class="name-row">
                    <span class="channel-title" [title]="ch.description || ch.name">{{ ch.description || ch.name }}</span>
                    <span *ngIf="ch.is_coupon_group" class="badge badge-warning">CUPOM</span>
                    <span *ngIf="ch.replace_image" class="badge badge-info" title="og:image scraper">SEM MARCA</span>
                  </div>
                  <span class="channel-handle">{{ ch.name }}</span>
                </div>
              </div>

              <!-- TOGGLE ACTIVE -->
              <div class="switch-box">
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="ch.active" (change)="toggleChannel(ch)">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>

            <!-- LINKED WHATSAPP GROUPS BADGES -->
            <div class="destinations-section">
              <span class="destinations-header-label">Destinos WhatsApp:</span>
              <div class="group-badges-list" *ngIf="ch.whatsapp_destinations && ch.whatsapp_destinations.length > 0; else noDestinations">
                <span 
                  *ngFor="let jid of ch.whatsapp_destinations" 
                  class="group-badge"
                  [title]="jid"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  <span>{{ getGroupName(jid) }}</span>
                </span>
              </div>
              <ng-template #noDestinations>
                <div class="group-badges-list">
                  <span class="group-badge badge-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-svg"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>Nenhum grupo vinculado</span>
                  </span>
                </div>
              </ng-template>
            </div>

            <!-- CARD FOOTER -->
            <div class="card-footer">
              <button class="btn-rules" (click)="openRulesModal(ch)" title="Editar regras e grupos de destino">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="footer-icon"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>Editar Canal & Destinos</span>
              </button>

              <button class="btn-delete" (click)="askDeleteChannel(ch)" title="Remover canal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="footer-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: EDIT RULES & WHATSAPP DESTINATIONS (Redesigned & Beautiful) -->
      <div *ngIf="selectedChannel" class="modal-backdrop">
        <div class="modal-dialog card edit-modal-card">
          <!-- MODAL HEADER -->
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="channel-avatar modal-avatar">
                {{ selectedChannel.name.replace('@', '').charAt(0).toUpperCase() }}
              </div>
              <div class="modal-title-box">
                <h3 class="modal-title">Configurar Canal</h3>
                <span class="modal-channel-sub">Origem das mensagens e regras de disparo</span>
              </div>
            </div>
            <button class="close-btn" (click)="selectedChannel = null">×</button>
          </div>

          <div class="modal-body">
            <!-- SECTION 1: IDENTIFICAÇÃO E ID DO CANAL (Permite alterar o ID) -->
            <div class="modal-section-card">
              <span class="section-label">Identificação do Canal de Origem</span>
              <div class="inputs-grid-two">
                <div class="form-group">
                  <label class="custom-label">ID / Username Telegram (Origem)</label>
                  <div class="channel-input-group">
                    <span class="input-addon-at" *ngIf="!selectedChannel.name.startsWith('-')">&#64;</span>
                    <input 
                      type="text" 
                      [(ngModel)]="selectedChannel.name" 
                      placeholder="canal_ofertas ou ID (-100...)"
                      class="clean-input"
                      [class.input-with-addon]="!selectedChannel.name.startsWith('-')"
                    >
                  </div>
                  <span class="field-hint">Altere o username ou ID numérico do canal monitorado.</span>
                </div>

                <div class="form-group">
                  <label class="custom-label">Nome Amigável / Descrição</label>
                  <input 
                    type="text" 
                    [(ngModel)]="selectedChannel.description" 
                    placeholder="Ex: Gerador Noivas, Ofertas VIP"
                    class="clean-input"
                  >
                  <span class="field-hint">Nome de exibição amigável dentro do painel.</span>
                </div>
              </div>
            </div>

            <!-- SECTION 2: REGRAS DE AUTOMAÇÃO COM SWITCHES MODERNOS -->
            <div class="modal-section-card">
              <span class="section-label">Regras de Automação & Filtros</span>
              <div class="switches-list">
                <!-- CUPONS SWITCH CARD -->
                <div class="rule-switch-card">
                  <div class="rule-text-content">
                    <span class="rule-title">Grupo focado em Cupons</span>
                    <p class="rule-description">Aplica regras prioritárias e tags específicas para ofertas que possuem cupons de desconto.</p>
                  </div>
                  <label class="switch">
                    <input type="checkbox" [(ngModel)]="selectedChannel.is_coupon_group">
                    <span class="slider round"></span>
                  </label>
                </div>

                <!-- IMAGEM SWITCH CARD -->
                <div class="rule-switch-card">
                  <div class="rule-text-content">
                    <span class="rule-title">Trocar Imagem (Remover marca d'água)</span>
                    <p class="rule-description">Baixa a foto limpa em alta resolução direto da página do produto (og:image scraper).</p>
                  </div>
                  <label class="switch">
                    <input type="checkbox" [(ngModel)]="selectedChannel.replace_image">
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            <!-- SECTION 3: GRUPOS DE DESTINO WHATSAPP (Grid bem desenhada) -->
            <div class="modal-section-card">
              <div class="section-header-row">
                <span class="section-label">Grupos de Destino (WhatsApp)</span>
                <div class="quick-links">
                  <button type="button" class="btn-text-action" (click)="selectAllGroups()">Marcar todos</button>
                  <span class="separator">•</span>
                  <button type="button" class="btn-text-action" (click)="clearAllGroups()">Desmarcar todos</button>
                </div>
              </div>
              <p class="section-explanation-small">
                Selecione os grupos do WhatsApp para onde as ofertas capturadas deste canal serão enviadas:
              </p>

              <div class="groups-selection-grid">
                <div 
                  *ngFor="let g of whatsappGroups" 
                  class="group-select-card" 
                  [class.selected]="isGroupSelected(g.id)"
                  (click)="toggleGroupSelection(g.id)"
                >
                  <input 
                    type="checkbox" 
                    [checked]="isGroupSelected(g.id)" 
                    (click)="$event.stopPropagation()"
                    (change)="toggleGroupSelection(g.id)"
                    class="group-checkbox-element"
                  >
                  <div class="group-card-content">
                    <div class="group-card-title-row">
                      <span class="group-card-name">{{ g.name }}</span>
                      <span class="group-card-badge" *ngIf="isGroupSelected(g.id)">Ativo</span>
                    </div>
                    <span class="group-card-id">{{ g.id }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedChannel = null">Cancelar</button>
            <button class="btn btn-teal" (click)="updateChannelRules()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: ADD CHANNEL -->
      <div *ngIf="showAddModal" class="modal-backdrop">
        <div class="modal-dialog card add-modal-card">
          <div class="modal-header">
            <h3>Adicionar Canal para Monitorar</h3>
            <button class="close-btn" (click)="showAddModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="custom-label">Nome de Usuário (&#64;canal) ou ID (-100...)</label>
              <input type="text" [(ngModel)]="newChannel.name" placeholder="&#64;canal_ofertas" class="clean-input">
            </div>
            <div class="form-group">
              <label class="custom-label">Descrição / Nome Amigável</label>
              <input type="text" [(ngModel)]="newChannel.description" placeholder="Ex: Achadinhos da Internet" class="clean-input">
            </div>
            <div class="switches-list">
              <div class="rule-switch-card">
                <div class="rule-text-content">
                  <span class="rule-title">Grupo focado em Cupons</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="newChannel.is_coupon_group">
                  <span class="slider round"></span>
                </label>
              </div>
              <div class="rule-switch-card">
                <div class="rule-text-content">
                  <span class="rule-title">Trocar imagem (Remover marca d'água)</span>
                </div>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="newChannel.replace_image">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddModal = false">Cancelar</button>
            <button class="btn btn-teal" (click)="saveNewChannel()" [disabled]="!newChannel.name.trim()">
              <span>Adicionar Canal</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRM PAUSE ALL -->
      <div *ngIf="showConfirmPauseModal" class="modal-backdrop">
        <div class="modal-dialog card confirm-modal-card">
          <div class="modal-header">
            <div class="confirm-icon-box warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3>Pausar Todos os Canais</h3>
            <button class="close-btn" (click)="showConfirmPauseModal = false">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">
              Tem certeza que deseja pausar o espelhamento de todos os <strong>{{ channels.length }} canais</strong> monitorados?
            </p>
            <p class="confirm-sub">O envio automático para os grupos de WhatsApp será suspenso até que você os reative.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showConfirmPauseModal = false">Voltar</button>
            <button class="btn btn-danger" (click)="executePauseAll()">
              <span>Sim, Pausar Todos</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRM DELETE CHANNEL -->
      <div *ngIf="channelToDelete" class="modal-backdrop">
        <div class="modal-dialog card confirm-modal-card">
          <div class="modal-header">
            <div class="confirm-icon-box danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <h3>Remover Canal</h3>
            <button class="close-btn" (click)="channelToDelete = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">
              Deseja realmente remover o canal <strong>{{ channelToDelete.description || channelToDelete.name }}</strong>?
            </p>
            <p class="confirm-sub">Ele não será mais monitorado nem enviará mensagens aos seus grupos de destino.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="channelToDelete = null">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDeleteChannel()">
              <span>Sim, Remover Canal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .espelhar-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
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

    .btn-how-it-works {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 0.9rem;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--transition-fast);
    }

    .btn-how-it-works:hover {
      border-color: var(--border-focus);
      color: var(--accent-cyan);
    }

    .btn-icon {
      width: 15px !important;
      height: 15px !important;
      min-width: 15px !important;
      max-width: 15px !important;
    }

    /* HOW IT WORKS */
    .how-it-works-panel {
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-focus);
      border-radius: var(--radius-md);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .panel-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      transition: color var(--transition-fast);
    }

    .close-btn:hover {
      color: #ef4444;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .step-card {
      background: var(--bg-subtle);
      padding: 1rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .step-num {
      width: 24px;
      height: 24px;
      background: #14b8a6;
      color: #0b1120;
      font-weight: 800;
      font-size: 0.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .step-card h4 {
      font-size: 0.875rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .step-card p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
      margin: 0;
    }

    /* ACTION PILLS BAR */
    .action-pills-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pill-btn {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 0.9rem;
      border-radius: var(--radius-full);
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--transition-fast);
    }

    .pill-btn:hover {
      border-color: var(--border-focus);
      color: var(--accent-cyan);
    }

    .pill-danger {
      color: #f87171;
      border-color: rgba(248, 113, 113, 0.3);
    }

    .pill-danger:hover {
      background-color: rgba(248, 113, 113, 0.1);
      border-color: #f87171;
      color: #f87171;
    }

    .pill-icon {
      width: 14px;
      height: 14px;
    }

    .ml-auto {
      margin-left: auto;
    }

    /* INFO BANNER */
    .info-tip-banner {
      background-color: rgba(20, 184, 166, 0.08);
      border: 1px solid rgba(20, 184, 166, 0.25);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .tip-icon {
      width: 16px;
      height: 16px;
      color: #14b8a6;
      flex-shrink: 0;
    }

    /* MONITORED GROUPS PANEL */
    .monitored-groups-panel {
      padding: 1.5rem;
    }

    .section-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .title-with-count h2 {
      font-size: 1.35rem;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 0.25rem;
    }

    .count-badge {
      font-size: 0.8rem;
      font-weight: 700;
      color: #14b8a6;
      background-color: rgba(20, 184, 166, 0.15);
      border: 1px solid rgba(20, 184, 166, 0.3);
      padding: 0.15rem 0.6rem;
      border-radius: var(--radius-full);
    }

    .section-explanation {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .filter-controls-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    /* STATUS TABS PILLS */
    .status-tabs-pills {
      display: flex;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.2rem;
      gap: 0.2rem;
    }

    .status-tab {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all var(--transition-fast);
    }

    .status-tab.active {
      background: var(--bg-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }

    .tab-count {
      font-size: 0.7rem;
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
    }

    .status-tab.active .tab-count {
      background: #14b8a6;
      color: #0b1120;
      font-weight: 700;
    }

    .search-filter-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.75rem;
      width: 240px;
    }

    .search-icon {
      width: 14px;
      height: 14px;
      color: var(--text-muted);
    }

    .search-filter-box input {
      border: none;
      background: transparent;
      padding: 0;
      color: var(--text-primary);
      font-size: 0.825rem;
      width: 100%;
      outline: none;
    }

    /* CHANNELS GRID */
    .channels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1rem;
    }

    .channel-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }

    .channel-card:hover {
      border-color: var(--border-subtle);
      box-shadow: var(--shadow-md);
    }

    .channel-card.inactive-card {
      opacity: 0.65;
      background-color: rgba(255, 255, 255, 0.01);
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .channel-identity {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .channel-avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      max-width: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .channel-info {
      min-width: 0;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .channel-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }

    .channel-handle {
      font-size: 0.75rem;
      color: var(--accent-cyan);
      font-family: 'JetBrains Mono', monospace;
      display: block;
      margin-top: 0.15rem;
    }

    /* DESTINATIONS BADGES */
    .destinations-section {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .destinations-header-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .group-badges-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .group-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.725rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      background-color: rgba(37, 99, 235, 0.12);
      border: 1px solid rgba(37, 99, 235, 0.25);
      color: #60a5fa;
    }

    .group-badge.badge-empty {
      background-color: rgba(255, 255, 255, 0.04);
      border-color: var(--border-color);
      color: var(--text-muted);
    }

    .group-svg {
      width: 11px;
      height: 11px;
      flex-shrink: 0;
    }

    /* CARD FOOTER */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.65rem;
      border-top: 1px solid var(--border-color);
    }

    .btn-rules {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--transition-fast);
    }

    .btn-rules:hover {
      background-color: var(--bg-card-hover);
      border-color: var(--border-focus);
      color: var(--accent-cyan);
    }

    .btn-delete {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      transition: color var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-delete:hover {
      color: #f87171;
    }

    .footer-icon {
      width: 14px;
      height: 14px;
    }

    /* MODAL BASE */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-focus);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
      max-height: 90vh;
      overflow-y: auto;
    }

    .edit-modal-card {
      max-width: 640px;
      background: #0d1527;
      border: 1px solid #1e293b;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(20, 184, 166, 0.25);
    }

    .add-modal-card {
      max-width: 480px;
    }

    .confirm-modal-card {
      max-width: 440px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header-info {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .modal-avatar {
      width: 44px;
      height: 44px;
      min-width: 44px;
      font-size: 1.1rem;
      box-shadow: 0 0 12px rgba(20, 184, 166, 0.3);
    }

    .modal-title-box {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-channel-sub {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* SECTIONS */
    .modal-section-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.7);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #14b8a6;
      display: block;
    }

    .inputs-grid-two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .custom-label {
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: none !important;
      letter-spacing: normal;
      margin: 0;
    }

    .channel-input-group {
      display: flex;
      align-items: stretch;
      width: 100%;
    }

    .input-addon-at {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(6, 182, 212, 0.12);
      color: #06b6d4;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0 0.85rem;
      border: 1px solid #334155;
      border-right: none;
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
      user-select: none;
      flex-shrink: 0;
    }

    .clean-input.input-with-addon {
      border-top-left-radius: 0 !important;
      border-bottom-left-radius: 0 !important;
      flex: 1;
      padding-left: 0.85rem !important;
    }

    .clean-input {
      background: #090e1a !important;
      border: 1px solid #334155 !important;
      border-radius: var(--radius-sm) !important;
      color: var(--text-primary) !important;
      font-size: 0.875rem !important;
      padding: 0.55rem 0.85rem !important;
      transition: all var(--transition-fast);
      width: 100% !important;
    }

    .clean-input:focus {
      border-color: #14b8a6 !important;
      box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.25) !important;
    }

    .field-hint {
      font-size: 0.7rem;
      color: var(--text-muted);
      line-height: 1.3;
    }

    /* RULE SWITCHES */
    .switches-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .rule-switch-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      transition: border-color var(--transition-fast);
    }

    .rule-switch-card:hover {
      border-color: #334155;
    }

    .rule-text-content {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .rule-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: none;
    }

    .rule-description {
      font-size: 0.775rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.35;
    }

    /* GROUPS SELECTION GRID */
    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .quick-links {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-text-action {
      background: transparent;
      border: none;
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .btn-text-action:hover {
      text-decoration: underline;
    }

    .separator {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .section-explanation-small {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .groups-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.65rem;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .group-select-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: var(--radius-sm);
      padding: 0.75rem 0.9rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;
    }

    .group-select-card:hover {
      border-color: #334155;
    }

    .group-select-card.selected {
      background-color: rgba(20, 184, 166, 0.1);
      border-color: #14b8a6;
    }

    .group-checkbox-element {
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
      min-height: 18px !important;
      max-width: 18px !important;
      max-height: 18px !important;
      accent-color: #14b8a6;
      cursor: pointer;
      margin: 0 !important;
      padding: 0 !important;
      flex-shrink: 0;
    }

    .group-card-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
      gap: 0.15rem;
    }

    .group-card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .group-card-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .group-card-badge {
      font-size: 0.65rem;
      font-weight: 700;
      color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.05rem 0.4rem;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .group-card-id {
      font-size: 0.675rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* CONFIRM MODAL SPECIFIC */
    .confirm-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-right: 0.5rem;
    }

    .confirm-icon-box.warning {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    .confirm-icon-box.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .confirm-icon-box svg {
      width: 20px;
      height: 20px;
    }

    .confirm-message {
      font-size: 0.95rem;
      color: var(--text-primary);
      line-height: 1.45;
      margin-bottom: 0.5rem;
    }

    .confirm-sub {
      font-size: 0.825rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .action-pills-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }
      .action-pills-bar .pill-btn,
      .action-pills-bar .btn-teal {
        width: 100%;
        justify-content: center;
        margin-left: 0 !important;
      }
      .section-top {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .filter-controls-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .status-tabs-pills {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }
      .search-filter-box {
        width: 100%;
      }
      .channels-grid {
        grid-template-columns: 1fr;
      }
      .channel-title {
        max-width: none;
      }
      .modal-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 1rem auto;
      }
      .inputs-grid-two {
        grid-template-columns: 1fr;
      }
      .groups-selection-grid {
        grid-template-columns: 1fr;
      }
      .steps-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChannelsComponent implements OnInit {
  api = inject(ApiService);

  channels: Channel[] = [];
  whatsappGroups: WhatsAppGroup[] = [];
  groupsMap: { [id: string]: string } = {};

  searchFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  showHowItWorks = false;
  showAddModal = false;
  showConfirmPauseModal = false;
  channelToDelete: Channel | null = null;
  fixStatusText = '';

  newChannel = {
    name: '',
    description: '',
    is_coupon_group: false,
    replace_image: false
  };

  selectedChannel: Channel | null = null;

  ngOnInit() {
    this.loadChannels();
    this.loadWhatsAppGroups();
  }

  loadChannels() {
    this.api.getChannels().subscribe({
      next: (data) => {
        this.channels = data;
      },
      error: () => {}
    });
  }

  loadWhatsAppGroups() {
    this.api.getWhatsAppGroups().subscribe({
      next: (groups) => {
        this.whatsappGroups = groups;
        this.groupsMap = {};
        for (const g of groups) {
          this.groupsMap[g.id] = g.name;
        }
      },
      error: () => {}
    });
  }

  getGroupName(jid: string): string {
    if (this.groupsMap[jid]) {
      return this.groupsMap[jid];
    }
    const found = this.whatsappGroups.find(g => g.id === jid);
    if (found) return found.name;
    const shortId = jid.split('@')[0];
    return shortId.length > 8 ? `...${shortId.slice(-4)}` : shortId;
  }

  get activeChannelsCount(): number {
    return this.channels.filter(c => c.active).length;
  }

  get inactiveChannelsCount(): number {
    return this.channels.filter(c => !c.active).length;
  }

  get filteredChannels(): Channel[] {
    let list = [...this.channels];

    if (this.statusFilter === 'active') {
      list = list.filter(c => c.active);
    } else if (this.statusFilter === 'inactive') {
      list = list.filter(c => !c.active);
    }

    if (this.searchFilter.trim()) {
      const term = this.searchFilter.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(term) || 
        (c.description && c.description.toLowerCase().includes(term))
      );
    }

    // Trazer os ativos na frente, e secundariamente por ordem e nome
    return list.sort((a, b) => {
      const aAct = a.active ? 1 : 0;
      const bAct = b.active ? 1 : 0;
      if (bAct !== aAct) return bAct - aAct;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  toggleChannel(ch: Channel) {
    const id = ch.id || ch.id_db || ch.name;
    this.api.updateChannel(id, { active: ch.active }).subscribe({
      error: () => {
        ch.active = !ch.active;
      }
    });
  }

  fixReceipt() {
    this.fixStatusText = 'Reconectando...';
    setTimeout(() => {
      this.fixStatusText = 'Recebimento corrigido!';
      setTimeout(() => this.fixStatusText = '', 3000);
    }, 1500);
  }

  executePauseAll() {
    this.showConfirmPauseModal = false;
    for (const ch of this.channels) {
      if (ch.active) {
        ch.active = false;
        this.toggleChannel(ch);
      }
    }
  }

  openAddModal() {
    this.newChannel = { name: '', description: '', is_coupon_group: false, replace_image: false };
    this.showAddModal = true;
  }

  saveNewChannel() {
    if (!this.newChannel.name.trim()) return;
    this.api.createChannel({
      name: this.newChannel.name.trim(),
      description: this.newChannel.description.trim(),
      active: true,
      replace_image: this.newChannel.replace_image,
      is_coupon_group: this.newChannel.is_coupon_group,
      whatsapp_destinations: []
    }).subscribe({
      next: () => {
        this.showAddModal = false;
        this.loadChannels();
      }
    });
  }

  openRulesModal(ch: Channel) {
    const raw = ch.name || '';
    const cleanName = raw.startsWith('@') ? raw.substring(1) : raw;
    this.selectedChannel = {
      ...ch,
      name: cleanName,
      whatsapp_destinations: ch.whatsapp_destinations ? [...ch.whatsapp_destinations] : []
    };
  }

  isGroupSelected(jid: string): boolean {
    return this.selectedChannel?.whatsapp_destinations?.includes(jid) || false;
  }

  toggleGroupSelection(jid: string) {
    if (!this.selectedChannel) return;
    if (!this.selectedChannel.whatsapp_destinations) {
      this.selectedChannel.whatsapp_destinations = [];
    }
    const idx = this.selectedChannel.whatsapp_destinations.indexOf(jid);
    if (idx > -1) {
      this.selectedChannel.whatsapp_destinations.splice(idx, 1);
    } else {
      this.selectedChannel.whatsapp_destinations.push(jid);
    }
  }

  selectAllGroups() {
    if (!this.selectedChannel) return;
    this.selectedChannel.whatsapp_destinations = this.whatsappGroups.map(g => g.id);
  }

  clearAllGroups() {
    if (!this.selectedChannel) return;
    this.selectedChannel.whatsapp_destinations = [];
  }

  updateChannelRules() {
    if (!this.selectedChannel) return;
    const id = this.selectedChannel.id || this.selectedChannel.id_db;
    if (!id) return;

    let finalName = (this.selectedChannel.name || '').trim();
    if (finalName && !finalName.startsWith('-') && !finalName.startsWith('@')) {
      finalName = `@${finalName}`;
    }

    this.api.updateChannel(id, {
      name: finalName,
      description: this.selectedChannel.description?.trim(),
      is_coupon_group: this.selectedChannel.is_coupon_group,
      replace_image: this.selectedChannel.replace_image,
      whatsapp_destinations: this.selectedChannel.whatsapp_destinations
    }).subscribe({
      next: () => {
        this.selectedChannel = null;
        this.loadChannels();
      }
    });
  }

  askDeleteChannel(ch: Channel) {
    this.channelToDelete = ch;
  }

  executeDeleteChannel() {
    if (!this.channelToDelete) return;
    const ch = this.channelToDelete;
    const id = ch.id || ch.id_db || ch.name;
    this.channelToDelete = null;
    this.api.deleteChannel(id).subscribe({
      next: () => {
        this.loadChannels();
      }
    });
  }
}
