import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WhatsAppGroup, WhatsAppSession, TelegramDestination } from '../../core/models';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="destinations-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div>
          <span class="category-tag">DESTINOS DE DISPARO</span>
          <h1 class="main-title">Gerenciar <span class="highlight-text">destinos</span></h1>
          <p class="subtitle">
            Configure grupos de WhatsApp, sessões/chips conectados para rotatividade e canais de Telegram para onde suas ofertas serão encaminhadas.
          </p>
        </div>
      </div>

      <!-- TABS NAVIGATION -->
      <div class="tabs-nav">
        <button class="tab-btn" [class.active]="activeTab === 'whatsapp-groups'" (click)="setTab('whatsapp-groups')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <span>Grupos WhatsApp ({{ waGroups.length | number }})</span>
        </button>

        <button class="tab-btn" [class.active]="activeTab === 'whatsapp-sessions'" (click)="setTab('whatsapp-sessions')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          <span>Sessões / Chips ({{ waSessions.length | number }})</span>
        </button>

        <button class="tab-btn" [class.active]="activeTab === 'telegram'" (click)="setTab('telegram')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <span>Canais Telegram ({{ tgDestinations.length | number }})</span>
        </button>
      </div>

      <!-- TAB 1: GRUPOS DO WHATSAPP -->
      <div *ngIf="activeTab === 'whatsapp-groups'" class="tab-content card">
        <div class="content-header">
          <div>
            <h2>Grupos de Destino (WhatsApp)</h2>
            <p class="content-sub">Grupos que recebem as promoções filtradas. Cada grupo pode ter um rodapé personalizado.</p>
          </div>
          <button class="btn btn-teal" (click)="openNewGroupModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Novo Grupo</span>
          </button>
        </div>

        <div class="cards-list">
          <div *ngFor="let g of waGroups" class="dest-item-card">
            <div class="dest-info">
              <div class="dest-badge-row">
                <span class="dest-name">{{ g.name }}</span>
                <span [class]="g.active !== false ? 'badge badge-success' : 'badge badge-warning'">
                  {{ g.active !== false ? 'Ativo' : 'Pausado' }}
                </span>
                <span class="badge badge-info">Sincronizado</span>
              </div>
              <span class="dest-id">{{ g.id }}</span>
              <div *ngIf="g.keywords && g.keywords.length > 0" class="keywords-wrap">
                <span class="keyword-pill" *ngFor="let kw of g.keywords">🏷️ {{ kw }}</span>
              </div>
              <div *ngIf="g.footer_text" class="custom-footer-box">
                <span class="footer-tag">RODAPÉ DO GRUPO:</span>
                <span class="footer-val">{{ g.footer_text }}</span>
              </div>
            </div>
            <div class="dest-actions">
              <button class="btn-edit" (click)="openEditGroup(g)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <span>Editar Grupo</span>
              </button>
              <button class="btn-delete" (click)="askDeleteGroup(g)" title="Remover grupo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: SESSÕES E CHIPS WHATSAPP -->
      <div *ngIf="activeTab === 'whatsapp-sessions'" class="tab-content card">
        <div class="content-header">
          <div>
            <h2>Sessões WhatsApp Conectadas</h2>
            <p class="content-sub">Chips utilizados para rotatividade de envio de mensagens com aquecimento anti-bloqueio.</p>
          </div>
          <button class="btn btn-teal" (click)="openNewSessionModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Nova Sessão</span>
          </button>
        </div>

        <div class="cards-list">
          <div *ngFor="let s of waSessions" class="dest-item-card">
            <div class="dest-info">
              <div class="dest-badge-row">
                <span class="dest-name">{{ s.name }}</span>
                <span [class]="s.active ? 'badge badge-success' : 'badge badge-warning'">
                  {{ s.active ? 'Conectado / Ativo' : 'Pausado' }}
                </span>
              </div>
              <span class="dest-id">Protocolo: Baileys Webhook / CasaOS n8n</span>
            </div>
            <div class="dest-actions">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="s.active" (change)="toggleSession(s)">
                <span class="slider round"></span>
              </label>
              <button class="btn-delete" (click)="askDeleteSession(s)" title="Remover sessão">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: CANAIS TELEGRAM -->
      <div *ngIf="activeTab === 'telegram'" class="tab-content card">
        <div class="content-header">
          <div>
            <h2>Canais de Entrega (Telegram)</h2>
            <p class="content-sub">Canais onde as ofertas finais são repassadas e canal exclusivo para relatórios de erro.</p>
          </div>
          <button class="btn btn-teal" (click)="openNewTgModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Novo Destino</span>
          </button>
        </div>

        <div class="cards-list">
          <div *ngFor="let t of tgDestinations" class="dest-item-card">
            <div class="dest-info">
              <div class="dest-badge-row">
                <span class="dest-name">{{ t.name }}</span>
                <span *ngIf="t.admin" class="badge badge-warning">ALERTAS ADMIN</span>
                <span *ngIf="!t.admin" class="badge badge-info">OFERTAS PÚBLICAS</span>
              </div>
              <span class="dest-id">{{ t.id }}</span>
            </div>
            <div class="dest-actions">
              <button class="btn-delete" (click)="askDeleteTelegram(t)" title="Remover destino">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: EDIT WHATSAPP GROUP (Name, ID, Keywords, Active, Custom Footer) -->
      <div *ngIf="editingGroup" class="modal-backdrop">
        <div class="modal-dialog card edit-modal-card">
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="group-icon-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </div>
              <div>
                <h3 class="modal-title">Editar Grupo WhatsApp</h3>
                <span class="modal-sub">{{ editingGroup.id }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="editingGroup = null">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Nome do Grupo</label>
              <input type="text" [(ngModel)]="editingGroup.name" placeholder="Ex: Noivas Promos">
            </div>

            <div class="form-group">
              <label>ID do Grupo (JID WhatsApp)</label>
              <input type="text" [(ngModel)]="editingGroup.id" placeholder="120363409255159200@g.us">
              <p class="field-hint">Identificador oficial do grupo no WhatsApp (ex: 120363409255159200&#64;g.us).</p>
            </div>

            <div class="form-group">
              <label>Palavras-Chave de Filtro (Separadas por vírgula)</label>
              <input type="text" [(ngModel)]="editingKeywordsInput" placeholder="Ex: vestido, noiva, casamento, maquiagem">
              <p class="field-hint">Se preenchido, apenas mensagens com esses termos serão encaminhadas a este grupo.</p>
            </div>

            <div class="form-group">
              <label class="custom-checkbox-row">
                <input type="checkbox" [(ngModel)]="editingGroup.active">
                <span>Grupo Ativo (recebendo ofertas)</span>
              </label>
            </div>

            <div class="form-group">
              <label>Rodapé Personalizado do Grupo</label>
              <p class="field-hint">
                Texto anexado ao final de cada mensagem enviada para este grupo (ex: link de convite, canal vip, etc.). Deixe em branco para usar o rodapé padrão geral.
              </p>
              <textarea 
                [(ngModel)]="editingGroup.footer_text" 
                rows="4" 
                placeholder="Ex: Compartilhe com os amigos nosso grupo: https://seusite.com.br/grupo"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="editingGroup = null">Cancelar</button>
            <button class="btn btn-teal" (click)="saveGroupEdit()" [disabled]="!editingGroup.name.trim() || !editingGroup.id.trim()">
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: NEW WHATSAPP GROUP -->
      <div *ngIf="showNewGroupModal" class="modal-backdrop">
        <div class="modal-dialog card small-modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Novo Grupo WhatsApp</h3>
            <button class="close-btn" (click)="showNewGroupModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nome do Grupo</label>
              <input type="text" [(ngModel)]="newGroup.name" placeholder="Ex: Maromba Descontos">
            </div>
            <div class="form-group">
              <label>ID do Grupo (JID WhatsApp)</label>
              <input type="text" [(ngModel)]="newGroup.id" placeholder="120363409255159200@g.us">
            </div>
            <div class="form-group">
              <label>Palavras-Chave de Filtro (Separadas por vírgula)</label>
              <input type="text" [(ngModel)]="newKeywordsInput" placeholder="Ex: creatina, whey, treino, academia">
            </div>
            <div class="form-group">
              <label>Rodapé Personalizado (Opcional)</label>
              <textarea [(ngModel)]="newGroup.footer_text" rows="3" placeholder="Texto de convite ou link do grupo..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showNewGroupModal = false">Cancelar</button>
            <button class="btn btn-teal" (click)="saveNewGroup()" [disabled]="!newGroup.name.trim() || !newGroup.id.trim()">
              <span>Salvar Grupo</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: NEW SESSION -->
      <div *ngIf="showNewSessionModal" class="modal-backdrop">
        <div class="modal-dialog card small-modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Nova Sessão WhatsApp</h3>
            <button class="close-btn" (click)="showNewSessionModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Identificador da Sessão</label>
              <input type="text" [(ngModel)]="newSessionName" placeholder="WHATS_BUSSINESS_02">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showNewSessionModal = false">Cancelar</button>
            <button class="btn btn-teal" (click)="saveNewSession()" [disabled]="!newSessionName.trim()">
              <span>Adicionar Sessão</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: NEW TELEGRAM DESTINATION -->
      <div *ngIf="showNewTgModal" class="modal-backdrop">
        <div class="modal-dialog card small-modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Novo Destino Telegram</h3>
            <button class="close-btn" (click)="showNewTgModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nome do Canal / Grupo</label>
              <input type="text" [(ngModel)]="newTg.name" placeholder="Ex: Canal Principal">
            </div>
            <div class="form-group">
              <label>Username (&#64;canal) ou Chat ID (-100...)</label>
              <input type="text" [(ngModel)]="newTg.id" placeholder="@meu_canal_promos">
            </div>
            <label class="custom-checkbox-row">
              <input type="checkbox" [(ngModel)]="newTg.admin">
              <span>Canal Exclusivo para Alertas e Erros Admin</span>
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showNewTgModal = false">Cancelar</button>
            <button class="btn btn-teal" (click)="saveNewTg()" [disabled]="!newTg.name.trim() || !newTg.id.trim()">
              <span>Adicionar Destino</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRM DELETE GROUP -->
      <div *ngIf="groupToDelete" class="modal-backdrop">
        <div class="modal-dialog card confirm-modal-card">
          <div class="modal-header">
            <div class="confirm-icon-box danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <h3 class="modal-title">Remover Grupo</h3>
            <button class="close-btn" (click)="groupToDelete = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">
              Deseja realmente remover o grupo WhatsApp <strong>{{ groupToDelete.name }}</strong>?
            </p>
            <p class="confirm-sub">O bot deixará de encaminhar ofertas para este grupo.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="groupToDelete = null">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDeleteGroup()">
              <span>Sim, Remover Grupo</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRM DELETE SESSION -->
      <div *ngIf="sessionToDelete" class="modal-backdrop">
        <div class="modal-dialog card confirm-modal-card">
          <div class="modal-header">
            <div class="confirm-icon-box danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <h3 class="modal-title">Remover Sessão</h3>
            <button class="close-btn" (click)="sessionToDelete = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">
              Deseja realmente desconectar a sessão <strong>{{ sessionToDelete.name }}</strong>?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="sessionToDelete = null">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDeleteSession()">
              <span>Sim, Remover Sessão</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CONFIRM DELETE TELEGRAM -->
      <div *ngIf="telegramToDelete" class="modal-backdrop">
        <div class="modal-dialog card confirm-modal-card">
          <div class="modal-header">
            <div class="confirm-icon-box danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <h3 class="modal-title">Remover Destino Telegram</h3>
            <button class="close-btn" (click)="telegramToDelete = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">
              Deseja realmente remover o canal <strong>{{ telegramToDelete.name }}</strong>?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="telegramToDelete = null">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDeleteTelegram()">
              <span>Sim, Remover</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .destinations-page {
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

    .tab-icon {
      width: 15px !important;
      height: 15px !important;
      min-width: 15px !important;
      max-width: 15px !important;
    }

    /* TAB CONTENT */
    .tab-content {
      padding: 1.5rem;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      gap: 1rem;
      flex-wrap: wrap;
    }

    .content-header h2 {
      font-size: 1.35rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .content-sub {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .btn-icon {
      width: 15px !important;
      height: 15px !important;
    }

    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .dest-item-card {
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all var(--transition-fast);
      gap: 1rem;
    }

    .dest-item-card:hover {
      border-color: var(--border-subtle);
      box-shadow: var(--shadow-sm);
    }

    .dest-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .dest-badge-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .dest-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .dest-id {
      font-size: 0.75rem;
      color: var(--accent-cyan);
      font-family: 'JetBrains Mono', monospace;
    }

    .keywords-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.25rem;
    }

    .keyword-pill {
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(20, 184, 166, 0.12);
      color: #14b8a6;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(20, 184, 166, 0.25);
    }

    .custom-footer-box {
      margin-top: 0.4rem;
      padding: 0.4rem 0.65rem;
      background: var(--bg-card);
      border-left: 3px solid #14b8a6;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-size: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .footer-tag {
      font-weight: 800;
      color: #14b8a6;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
    }

    .footer-val {
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .dest-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn-edit {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all var(--transition-fast);
    }

    .btn-edit:hover {
      border-color: #38bdf8;
      color: #38bdf8;
      background-color: rgba(56, 189, 248, 0.08);
    }

    .btn-delete {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color var(--transition-fast);
    }

    .btn-delete:hover {
      color: #f87171;
    }

    .action-icon {
      width: 14px;
      height: 14px;
    }

    /* MODALS */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(4px);
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
      max-width: 540px;
    }

    .small-modal-card {
      max-width: 460px;
    }

    .confirm-modal-card {
      max-width: 420px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .group-icon-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(20, 184, 166, 0.15);
      color: #14b8a6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .group-icon-avatar svg {
      width: 18px;
      height: 18px;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-sub {
      font-size: 0.75rem;
      color: var(--accent-cyan);
      font-family: 'JetBrains Mono', monospace;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.35;
    }

    .custom-checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .confirm-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
    }

    .confirm-icon-box.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .confirm-icon-box svg {
      width: 18px;
      height: 18px;
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
      .tabs-nav {
        overflow-x: auto;
        padding-bottom: 0.35rem;
        flex-wrap: nowrap;
      }
      .tab-btn {
        white-space: nowrap;
        flex-shrink: 0;
      }
      .content-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .content-header .btn {
        width: 100%;
        justify-content: center;
      }
      .dest-item-card {
        flex-direction: column;
        align-items: stretch;
        gap: 0.85rem;
      }
      .dest-actions {
        width: 100%;
        justify-content: flex-end;
      }
      .dest-actions .btn-edit {
        flex: 1;
        justify-content: center;
      }
      .modal-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 1rem auto;
      }
    }
  `]
})
export class DestinationsComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  activeTab: 'whatsapp-groups' | 'whatsapp-sessions' | 'telegram' = 'whatsapp-groups';

  waGroups: WhatsAppGroup[] = [];
  waSessions: WhatsAppSession[] = [];
  tgDestinations: TelegramDestination[] = [];

  // Edit Group Modal
  editingGroup: WhatsAppGroup | null = null;
  editingKeywordsInput = '';

  // New Item Modals
  showNewGroupModal = false;
  showNewSessionModal = false;
  showNewTgModal = false;

  newGroup = { name: '', id: '', footer_text: '' };
  newKeywordsInput = '';
  newSessionName = '';
  newTg = { name: '', id: '', admin: false };

  // Confirmation Modals (Replacing alerts/confirms)
  groupToDelete: WhatsAppGroup | null = null;
  sessionToDelete: WhatsAppSession | null = null;
  telegramToDelete: TelegramDestination | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'whatsapp-sessions' || tab === 'sessions' || tab === 'chips') {
        this.activeTab = 'whatsapp-sessions';
      } else if (tab === 'telegram' || tab === 'tg') {
        this.activeTab = 'telegram';
      } else if (tab === 'whatsapp-groups' || tab === 'groups') {
        this.activeTab = 'whatsapp-groups';
      }
    });
    this.loadAll();
  }

  setTab(tab: 'whatsapp-groups' | 'whatsapp-sessions' | 'telegram') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  loadAll() {
    this.api.getWhatsAppGroups().subscribe({
      next: (data) => this.waGroups = data,
      error: () => {}
    });
    this.api.getWhatsAppSessions().subscribe({
      next: (data) => this.waSessions = data,
      error: () => {}
    });
    this.api.getTelegramDestinations().subscribe({
      next: (data) => this.tgDestinations = data,
      error: () => {}
    });
  }

  toggleSession(s: WhatsAppSession) {
    this.api.updateWhatsAppSession(s.id_db || s.name, { active: s.active }).subscribe();
  }

  // --- EDIT GROUP MODAL ---
  openEditGroup(g: WhatsAppGroup) {
    this.editingGroup = { ...g, active: g.active !== false };
    this.editingKeywordsInput = (g.keywords || []).join(', ');
  }

  saveGroupEdit() {
    if (!this.editingGroup) return;
    const id = this.editingGroup.id_db || this.editingGroup.id;
    const keywords = this.editingKeywordsInput
      ? this.editingKeywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : [];

    this.api.updateWhatsAppGroup(id, {
      name: this.editingGroup.name.trim(),
      id: this.editingGroup.id.trim(),
      keywords: keywords,
      active: this.editingGroup.active !== false,
      footer_text: this.editingGroup.footer_text?.trim() || ''
    }).subscribe({
      next: () => {
        this.editingGroup = null;
        this.loadAll();
      }
    });
  }

  // --- NEW GROUP MODAL ---
  openNewGroupModal() {
    this.newGroup = { name: '', id: '', footer_text: '' };
    this.newKeywordsInput = '';
    this.showNewGroupModal = true;
  }

  saveNewGroup() {
    if (!this.newGroup.name.trim() || !this.newGroup.id.trim()) return;
    const keywords = this.newKeywordsInput
      ? this.newKeywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : [];

    this.api.createWhatsAppGroup({
      name: this.newGroup.name.trim(),
      id: this.newGroup.id.trim(),
      footer_text: this.newGroup.footer_text.trim(),
      keywords: keywords,
      active: true
    }).subscribe({
      next: () => {
        this.showNewGroupModal = false;
        this.loadAll();
      }
    });
  }

  // --- NEW SESSION MODAL ---
  openNewSessionModal() {
    this.newSessionName = '';
    this.showNewSessionModal = true;
  }

  saveNewSession() {
    if (!this.newSessionName.trim()) return;
    this.api.createWhatsAppSession({
      name: this.newSessionName.trim(),
      active: true
    }).subscribe({
      next: () => {
        this.showNewSessionModal = false;
        this.loadAll();
      }
    });
  }

  // --- NEW TELEGRAM DESTINATION MODAL ---
  openNewTgModal() {
    this.newTg = { name: '', id: '', admin: false };
    this.showNewTgModal = true;
  }

  saveNewTg() {
    if (!this.newTg.name.trim() || !this.newTg.id.trim()) return;
    this.api.createTelegramDestination({
      name: this.newTg.name.trim(),
      id: this.newTg.id.trim(),
      admin: this.newTg.admin
    }).subscribe({
      next: () => {
        this.showNewTgModal = false;
        this.loadAll();
      }
    });
  }

  // --- DELETE CONFIRMATION MODALS ---
  askDeleteGroup(g: WhatsAppGroup) {
    this.groupToDelete = g;
  }

  executeDeleteGroup() {
    if (!this.groupToDelete) return;
    const g = this.groupToDelete;
    this.groupToDelete = null;
    this.api.deleteWhatsAppGroup(g.id_db || g.id).subscribe({
      next: () => this.loadAll()
    });
  }

  askDeleteSession(s: WhatsAppSession) {
    this.sessionToDelete = s;
  }

  executeDeleteSession() {
    if (!this.sessionToDelete) return;
    const s = this.sessionToDelete;
    this.sessionToDelete = null;
    this.api.deleteWhatsAppSession(s.id_db || s.name).subscribe({
      next: () => this.loadAll()
    });
  }

  askDeleteTelegram(t: TelegramDestination) {
    this.telegramToDelete = t;
  }

  executeDeleteTelegram() {
    if (!this.telegramToDelete) return;
    const t = this.telegramToDelete;
    this.telegramToDelete = null;
    this.api.deleteTelegramDestination(t.id_db || t.id).subscribe({
      next: () => this.loadAll()
    });
  }
}
