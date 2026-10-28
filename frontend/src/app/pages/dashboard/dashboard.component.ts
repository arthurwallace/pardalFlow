import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardMetrics, AnalyticsSummary, DispatchedOffer, WhatsAppSession } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="dash-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div>
          <span class="category-tag">VISÃO GERAL DO AMBIENTE</span>
          <h1 class="main-title">Dashboard & <span class="highlight-text">Status Operacional</span></h1>
          <p class="subtitle">
            Acompanhe em tempo real o status do bot Telethon, canais mapeados, produtos enviados para os grupos de destino e membros monitorados.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="loadAllData()" [disabled]="loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" [class.spin]="loading"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <!-- BOT STATUS HERO CARD -->
      <div class="bot-status-hero card">
        <div class="hero-left">
          <div class="status-indicator-box" [class.online]="metrics.bot_running">
            <span class="status-pulse-dot"></span>
          </div>
          <div class="hero-text">
            <div class="hero-status-row">
              <h2>Motor PardalBot: {{ metrics.bot_running ? 'Online & Operacional' : 'Pausado' }}</h2>
              <span class="badge" [class.badge-success]="metrics.bot_running" [class.badge-warning]="!metrics.bot_running">
                {{ metrics.bot_running ? 'Ativo' : 'Pausado' }}
              </span>
            </div>
            <p class="hero-sub">
              Sessão MTProto: <strong>{{ sessionName }}</strong> • MongoDB: <strong>Conectado</strong> • n8n Webhook: <strong>Ativo</strong>
            </p>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn" [class.btn-primary]="!metrics.bot_running" [class.btn-secondary]="metrics.bot_running" (click)="toggleBot()">
            <span>{{ metrics.bot_running ? 'Pausar Motor' : 'Iniciar Motor' }}</span>
          </button>
        </div>
      </div>

      <!-- REAL METRICS GRID (With 5th Dispatched Offers Card) -->
      <div class="metrics-grid">
        <!-- 1. CANAIS TELEGRAM -->
        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-label">CANAIS TELEGRAM</span>
            <div class="metric-icon-box blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </div>
          </div>
          <div class="metric-val">{{ metrics.total_channels | number }}</div>
          <div class="metric-meta">
            <span class="meta-tag">{{ metrics.active_channels | number }} ativos transmitindo</span>
            <a routerLink="/channels" class="meta-link">Gerenciar →</a>
          </div>
        </div>

        <!-- 2. PRODUTOS ENVIADOS AOS DESTINOS (Arthur's request) -->
        <div class="card metric-card clickable-card" (click)="openDispatchedModal()" title="Clique para ver os itens enviados e seus grupos de destino">
          <div class="metric-top">
            <span class="metric-label">PRODUTOS DISPARADOS</span>
            <div class="metric-icon-box orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
          </div>
          <div class="metric-val text-orange">{{ totalDispatchedCount | number }}</div>
          <div class="metric-meta">
            <span class="meta-tag">Itens repassados aos grupos</span>
            <span class="meta-link highlight-link">Ver itens enviados →</span>
          </div>
        </div>

        <!-- 3. GRUPOS WHATSAPP -->
        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-label">GRUPOS DE WHATSAPP</span>
            <div class="metric-icon-box green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
          </div>
          <div class="metric-val">{{ metrics.whatsapp_groups | number }}</div>
          <div class="metric-meta">
            <span class="meta-tag">Pardal, Noivas, Baby, etc.</span>
            <a [routerLink]="['/destinations']" [queryParams]="{ tab: 'whatsapp-groups' }" class="meta-link">Ver destinos →</a>
          </div>
        </div>

        <!-- 4. SESSÕES DE CHIPS -->
        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-label">SESSÕES DE CHIPS</span>
            <div class="metric-icon-box teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </div>
          </div>
          <div class="metric-val">{{ whatsappSessionsCount | number }}</div>
          <div class="metric-meta">
            <span class="meta-tag">Round-Robin com aquecimento</span>
            <a [routerLink]="['/destinations']" [queryParams]="{ tab: 'whatsapp-sessions' }" class="meta-link">Ver sessões →</a>
          </div>
        </div>

        <!-- 5. MEMBROS RASTREADOS (NOIVAS) -->
        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-label">MEMBROS RASTREADOS</span>
            <div class="metric-icon-box purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <div class="metric-val">{{ noivasSummary.total_records | number }}</div>
          <div class="metric-meta">
            <span class="meta-tag text-green">{{ noivasSummary.total_active | number }} ativos</span>
            <a routerLink="/analytics" class="meta-link">Monitor de grupos →</a>
          </div>
        </div>
      </div>

      <!-- QUICK SHORTCUTS GRID -->
      <div class="shortcuts-grid">
        <a routerLink="/channels" class="shortcut-card card">
          <div class="shortcut-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82l-.06-.06a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <div class="shortcut-body">
            <h3>Gerenciar Canais</h3>
            <p>Ative, pause e configure quais canais de ofertas serão replicados.</p>
          </div>
        </a>

        <a [routerLink]="['/destinations']" [queryParams]="{ tab: 'whatsapp-groups' }" class="shortcut-card card">
          <div class="shortcut-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <div class="shortcut-body">
            <h3>Grupos de Destino</h3>
            <p>Vincule seus grupos de WhatsApp e ajuste rodapés personalizados.</p>
          </div>
        </a>

        <a routerLink="/tester" class="shortcut-card card">
          <div class="shortcut-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </div>
          <div class="shortcut-body">
            <h3>Simular Envio</h3>
            <p>Cole qualquer texto para testar links de afiliados e IA antes de postar.</p>
          </div>
        </a>

        <a routerLink="/analytics" class="shortcut-card card">
          <div class="shortcut-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="shortcut-body">
            <h3>Retenção de Membros</h3>
            <p>Monitore quem entrou, saiu ou deu churn nos seus grupos do WhatsApp.</p>
          </div>
        </a>
      </div>

      <!-- SEÇÃO: PRODUTOS DISPARADOS REAIS (Dashboard Feed) -->
      <div class="card dispatched-feed-card">
        <div class="feed-header">
          <div class="feed-header-left">
            <div class="feed-icon-box orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </div>
            <div>
              <div class="feed-title-row">
                <h2>Últimos Produtos Disparados</h2>
                <span class="badge badge-info">{{ totalDispatchedCount }} enviados</span>
              </div>
              <p class="feed-subtitle">Registro real das ofertas encaminhadas pelo motor Telethon aos grupos de destino.</p>
            </div>
          </div>
          <div class="feed-header-actions">
            <button *ngIf="dispatchedOffers.length > 0" class="btn btn-secondary btn-sm" (click)="openDispatchedModal()">
              <span>Ver Histórico Completo ({{ totalDispatchedCount }}) →</span>
            </button>
            <a routerLink="/tester" class="btn btn-teal btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <span>Simular Envio</span>
            </a>
          </div>
        </div>

        <!-- EMPTY STATE: Quando não há nenhum produto enviado ainda -->
        <div *ngIf="dispatchedOffers.length === 0" class="empty-dispatched-box">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <h3>Nenhum produto disparado ainda</h3>
          <p>
            Os produtos e cupons encaminhados pelo PardalBot ou disparados via simulador aparecerão aqui em tempo real com seus respectivos grupos de destino.
          </p>
          <a routerLink="/tester" class="btn btn-teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span>Testar Envio no Simulador</span>
          </a>
        </div>

        <!-- TABELA DE PRODUTOS REAIS DISPARADOS -->
        <div *ngIf="dispatchedOffers.length > 0" class="dispatched-items-table-wrap">
          <table class="dash-dispatched-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Origem</th>
                <th>Grupos de Destino</th>
                <th>Data / Hora</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of dispatchedOffers.slice(0, 6)">
                <td class="product-name-td">
                  <span class="product-strong-title">{{ item.product_name }}</span>
                </td>
                <td>
                  <span class="price-badge" *ngIf="item.price">{{ formatPrice(item.price) }}</span>
                  <span class="no-price" *ngIf="!item.price">-</span>
                </td>
                <td>
                  <span class="channel-pill">{{ item.channel_name }}</span>
                </td>
                <td>
                  <div class="group-tags-inline">
                    <span class="group-tag-pill" *ngFor="let g of item.target_groups">{{ g }}</span>
                    <span *ngIf="!item.target_groups || item.target_groups.length === 0" class="no-groups">Padrão</span>
                  </div>
                </td>
                <td class="time-td">
                  {{ item.sent_at | date:'dd/MM HH:mm' }}
                </td>
                <td>
                  <button class="btn-preview-tag" (click)="viewOfferPreview(item)">
                    Ver Mensagem
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RECENT LOGS SUMMARY -->
      <div class="card recent-logs-card">
        <div class="logs-card-head">
          <div class="head-title-row">
            <h2>Últimos Eventos do Sistema</h2>
            <span class="badge badge-info">Tempo Real</span>
          </div>
          <a routerLink="/logs" class="btn btn-secondary btn-sm">Ver Terminal Completo →</a>
        </div>
        <div class="logs-list">
          <div *ngIf="recentLogs.length === 0" class="log-empty">
            Nenhum evento registrado recentemente.
          </div>
          <div *ngFor="let log of recentLogs" class="log-entry">
            <span class="log-time">[{{ log.timestamp | date:'HH:mm:ss' }}]</span>
            <span class="log-msg">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- MODAL: HISTÓRICO DE PRODUTOS ENVIADOS AOS GRUPOS (Arthur's request) -->
      <div *ngIf="showDispatchedModal" class="modal-backdrop">
        <div class="modal-dialog card dispatched-modal-card">
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-icon-box orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
              <div>
                <h3 class="modal-title">Produtos Enviados para os Grupos</h3>
                <span class="modal-sub">{{ totalDispatchedCount }} ofertas distribuídas</span>
              </div>
            </div>
            <button class="close-btn" (click)="showDispatchedModal = false">×</button>
          </div>

          <div class="modal-search-row">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" [(ngModel)]="offersSearch" placeholder="Buscar por produto, grupo ou canal de origem...">
            </div>
          </div>

          <div class="modal-body dispatched-list">
            <div *ngIf="filteredDispatchedOffers.length === 0" class="empty-state-box">
              <p>Nenhuma oferta enviada encontrada com esse filtro.</p>
            </div>

            <div *ngFor="let item of filteredDispatchedOffers" class="dispatched-card">
              <div class="dispatched-card-head">
                <div class="dispatched-title-row">
                  <h4 class="product-title">{{ item.product_name }}</h4>
                  <span class="price-pill" *ngIf="item.price">{{ formatPrice(item.price) }}</span>
                  <span class="badge badge-info">{{ item.platform }}</span>
                </div>
                <span class="dispatched-time">{{ item.sent_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>

              <div class="dispatched-details-row">
                <span class="channel-origin">Origem: <strong>{{ item.channel_name }}</strong></span>
                <span class="status-success-badge">✓ {{ item.status }}</span>
              </div>

              <!-- TARGET GROUPS BADGES -->
              <div class="target-groups-section">
                <span class="target-label">Grupos de Destino:</span>
                <div class="target-badges-wrap">
                  <span *ngFor="let g of item.target_groups" class="target-group-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="target-svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>{{ g }}</span>
                  </span>
                </div>
              </div>

              <!-- EXPANDABLE MESSAGE PREVIEW -->
              <div class="msg-preview-toggle">
                <button type="button" class="btn-toggle-msg" (click)="toggleItemPreview(item.id)">
                  <span>{{ expandedItems[item.id] ? '▲ Ocultar texto enviado' : '▼ Ver texto enviado para o grupo' }}</span>
                </button>
                <div *ngIf="expandedItems[item.id]" class="expanded-msg-box">
                  <pre>{{ item.converted_text || item.original_text }}</pre>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button *ngIf="dispatchedOffers.length > 0" type="button" class="btn btn-secondary mr-auto btn-clean-offers" (click)="clearAllDispatchedOffers()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Limpar Histórico</span>
            </button>
            <button class="btn btn-secondary" (click)="showDispatchedModal = false">Fechar</button>
          </div>
        </div>
      </div>

      <!-- MODAL: PREVIEW DA MENSAGEM DO PRODUTO -->
      <div *ngIf="previewOffer" class="modal-backdrop">
        <div class="modal-dialog card preview-modal-card">
          <div class="modal-header">
            <div class="preview-title-box">
              <h3 class="modal-title">{{ previewOffer.product_name }}</h3>
              <span class="preview-channel-tag">{{ previewOffer.channel_name }} • {{ previewOffer.sent_at | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <button class="close-btn" (click)="previewOffer = null">×</button>
          </div>
          <div class="modal-body">
            <div class="preview-pill-row">
              <span class="badge badge-success" *ngIf="previewOffer.price">{{ formatPrice(previewOffer.price) }}</span>
              <span class="badge badge-info">{{ previewOffer.platform }}</span>
              <span class="badge badge-success">✓ {{ previewOffer.status }}</span>
            </div>

            <div class="target-groups-section">
              <span class="target-label">Enviado para:</span>
              <div class="target-badges-wrap">
                <span *ngFor="let g of previewOffer.target_groups" class="target-group-tag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="target-svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  <span>{{ g }}</span>
                </span>
              </div>
            </div>

            <div class="preview-text-block">
              <label>Texto Convertido Enviado:</label>
              <pre class="preview-code-box">{{ previewOffer.converted_text || previewOffer.original_text }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="previewOffer = null">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-page {
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

    .btn-icon {
      width: 15px !important;
      height: 15px !important;
    }

    .btn-icon.spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* BOT STATUS HERO CARD */
    .bot-status-hero {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(20, 184, 166, 0.08) 100%);
      border: 1px solid var(--border-subtle);
    }

    .hero-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .status-indicator-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .status-indicator-box.online {
      background-color: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
    }

    .status-pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ef4444;
    }

    .status-indicator-box.online .status-pulse-dot {
      background-color: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
    }

    .hero-status-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .hero-status-row h2 {
      font-size: 1.25rem;
      color: var(--text-primary);
    }

    .hero-sub {
      font-size: 0.825rem;
      color: var(--text-secondary);
    }

    /* METRICS GRID */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      transition: all var(--transition-fast);
    }

    .clickable-card {
      cursor: pointer;
      border-color: rgba(245, 158, 11, 0.3);
    }

    .clickable-card:hover {
      border-color: #f59e0b;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-label);
      letter-spacing: 0.05em;
    }

    .metric-icon-box {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon-box svg {
      width: 16px !important;
      height: 16px !important;
    }

    .metric-icon-box.teal { background: rgba(20, 184, 166, 0.15); color: #14b8a6; }
    .metric-icon-box.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .metric-icon-box.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .metric-icon-box.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .metric-icon-box.orange { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    .metric-val {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }

    .text-orange {
      color: #f59e0b !important;
    }

    .metric-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      margin-top: 0.25rem;
    }

    .meta-tag {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .meta-link {
      color: var(--accent-cyan);
      font-weight: 600;
      text-decoration: none;
    }

    .highlight-link {
      color: #f59e0b;
    }

    .meta-link:hover {
      text-decoration: underline;
    }

    /* SHORTCUTS GRID */
    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }

    .shortcut-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .shortcut-card:hover {
      border-color: var(--border-focus);
      transform: translateY(-2px);
    }

    .shortcut-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .shortcut-icon svg {
      width: 20px !important;
      height: 20px !important;
    }

    .shortcut-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .shortcut-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .shortcut-icon.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .shortcut-icon.teal { background: rgba(20, 184, 166, 0.15); color: #14b8a6; }

    .shortcut-body h3 {
      font-size: 1rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .shortcut-body p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    /* RECENT LOGS */
    .recent-logs-card {
      padding: 1.5rem;
    }

    .logs-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .head-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .head-title-row h2 {
      font-size: 1.15rem;
      color: var(--text-primary);
    }

    .logs-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.825rem;
    }

    .log-entry {
      display: flex;
      gap: 0.75rem;
      padding: 0.45rem 0.75rem;
      border-radius: var(--radius-sm);
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      word-break: break-all;
    }

    .log-time {
      color: var(--accent-cyan);
      flex-shrink: 0;
      font-weight: 600;
    }

    .log-msg {
      color: var(--text-primary);
    }

    .log-empty {
      padding: 1rem;
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
    }

    /* MODAL DISPATCHED OFFERS */
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

    .dispatched-modal-card {
      width: 100%;
      max-width: 780px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-focus);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1rem;
    }

    .modal-header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal-icon-box {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-icon-box.orange {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    .modal-icon-box svg {
      width: 20px;
      height: 20px;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.4rem;
      cursor: pointer;
    }

    .modal-search-row {
      margin-bottom: 1rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.45rem 0.85rem;
    }

    .search-box input {
      border: none;
      background: transparent;
      color: var(--text-primary);
      width: 100%;
      outline: none;
      font-size: 0.85rem;
    }

    .dispatched-list {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-right: 0.25rem;
      flex: 1;
    }

    .dispatched-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .dispatched-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .dispatched-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .product-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .price-pill {
      font-size: 0.75rem;
      font-weight: 800;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 0.1rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .dispatched-time {
      font-size: 0.725rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      flex-shrink: 0;
    }

    .dispatched-details-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .status-success-badge {
      color: #10b981;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .target-groups-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.25rem;
    }

    .target-label {
      font-size: 0.725rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .target-badges-wrap {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .target-group-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      font-size: 0.725rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
    }

    .target-svg {
      width: 11px;
      height: 11px;
    }

    .msg-preview-toggle {
      margin-top: 0.35rem;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.35rem;
    }

    .btn-toggle-msg {
      background: transparent;
      border: none;
      color: var(--accent-cyan);
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0;
      font-weight: 600;
    }

    .btn-toggle-msg:hover {
      text-decoration: underline;
    }

    .expanded-msg-box {
      margin-top: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.65rem;
    }

    .expanded-msg-box pre {
      margin: 0;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .empty-state-box {
      text-align: center;
      padding: 2rem 0;
      color: var(--text-muted);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
      margin-top: 0.5rem;
    }

    /* REAL DISPATCHED OFFERS FEED */
    .dispatched-feed-card {
      padding: 1.5rem;
      margin-top: 0.5rem;
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
    }

    .feed-header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .feed-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .feed-icon-box.orange {
      background: rgba(249, 115, 22, 0.15);
      color: #f97316;
    }
    .feed-icon-box svg {
      width: 22px;
      height: 22px;
    }

    .feed-title-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .feed-title-row h2 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin: 0;
    }
    .feed-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0.15rem 0 0 0;
    }

    .feed-header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* EMPTY DISPATCHED STATE */
    .empty-dispatched-box {
      text-align: center;
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .empty-icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(249, 115, 22, 0.1);
      border: 1px solid rgba(249, 115, 22, 0.25);
      color: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon-circle svg {
      width: 28px;
      height: 28px;
    }
    .empty-dispatched-box h3 {
      font-size: 1.2rem;
      color: var(--text-primary);
      margin: 0.25rem 0 0 0;
    }
    .empty-dispatched-box p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      max-width: 540px;
      margin: 0;
      line-height: 1.45;
    }

    /* TABLE FEED */
    .dispatched-items-table-wrap {
      overflow-x: auto;
    }
    .dash-dispatched-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .dash-dispatched-table th {
      text-align: left;
      padding: 0.65rem 0.85rem;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
    }
    .dash-dispatched-table td {
      padding: 0.85rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    .product-name-td {
      max-width: 280px;
    }
    .product-strong-title {
      font-weight: 600;
      color: var(--text-primary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.35;
    }
    .price-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      white-space: nowrap;
    }
    .no-price {
      color: var(--text-muted);
    }
    .channel-pill {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.25rem 0.55rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      white-space: nowrap;
    }
    .group-tags-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .group-tag-pill {
      background: rgba(20, 184, 166, 0.12);
      border: 1px solid rgba(20, 184, 166, 0.3);
      color: #14b8a6;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      font-size: 0.725rem;
      white-space: nowrap;
    }
    .no-groups {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .time-td {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
    }
    .btn-preview-tag {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .btn-preview-tag:hover {
      border-color: #f97316;
      color: #f97316;
      background: rgba(249, 115, 22, 0.08);
    }

    /* PREVIEW MODAL */
    .preview-modal-card {
      max-width: 580px;
      width: 100%;
    }
    .preview-title-box {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .preview-channel-tag {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
    }
    .preview-pill-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .preview-text-block label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 0.35rem;
      display: block;
    }
    .preview-code-box {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      line-height: 1.5;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 320px;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .header-actions {
        display: flex;
        width: 100%;
      }
      .header-actions button {
        width: 100%;
        justify-content: center;
      }
      .main-title {
        font-size: 1.5rem;
      }
      .bot-status-hero {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .hero-actions {
        width: 100%;
      }
      .hero-actions button {
        width: 100%;
      }
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
      .feed-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .feed-header-actions {
        width: 100%;
      }
      .feed-header-actions button {
        width: 100%;
        justify-content: center;
      }
      .modal-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
        margin: 1rem auto;
      }
    }

    @media (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      .metric-val {
        font-size: 1.85rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);

  loading = false;
  sessionName = 'Sessão individual';
  previewOffer: DispatchedOffer | null = null;
  
  metrics: DashboardMetrics = {
    bot_running: false,
    posts_detected: 0,
    posts_sent: 0,
    ai_errors: 0,
    conversion_errors: 0,
    avg_latency_seconds: 0,
    total_channels: 0,
    active_channels: 0,
    whatsapp_groups: 0,
    telegram_destinations: 0
  };

  viewOfferPreview(item: DispatchedOffer) {
    this.previewOffer = item;
  }

  noivasSummary: AnalyticsSummary = {
    total_records: 0,
    total_active: 0,
    total_exits: 0,
    quick_exits_under_15m: 0,
    quick_exit_percentage: 0,
    participants: []
  };

  recentLogs: any[] = [];
  dispatchedOffers: DispatchedOffer[] = [];
  whatsappSessions: WhatsAppSession[] = [];
  offersSearch = '';
  showDispatchedModal = false;
  expandedItems: { [id: string]: boolean } = {};

  get totalDispatchedCount(): number {
    return (this.metrics as any).total_dispatched_offers || this.dispatchedOffers.length || 0;
  }

  get whatsappSessionsCount(): number {
    if (this.metrics && typeof this.metrics.whatsapp_sessions === 'number' && this.metrics.whatsapp_sessions > 0) {
      return this.metrics.whatsapp_sessions;
    }
    return this.whatsappSessions.length;
  }

  get filteredDispatchedOffers(): DispatchedOffer[] {
    if (!this.offersSearch.trim()) return this.dispatchedOffers;
    const term = this.offersSearch.toLowerCase();
    return this.dispatchedOffers.filter(o =>
      o.product_name.toLowerCase().includes(term) ||
      o.channel_name.toLowerCase().includes(term) ||
      (o.target_groups && o.target_groups.some(g => g.toLowerCase().includes(term)))
    );
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.api.getDashboardMetrics().subscribe({
      next: (m) => {
        this.metrics = m;
      },
      error: () => {}
    });

    this.api.getWhatsAppSessions().subscribe({
      next: (sessions) => {
        if (sessions && Array.isArray(sessions)) {
          this.whatsappSessions = sessions;
          if (this.metrics.whatsapp_sessions === undefined || this.metrics.whatsapp_sessions === null) {
            this.metrics.whatsapp_sessions = sessions.length;
          }
        }
      },
      error: () => {}
    });

    this.api.getBotStatus().subscribe({
      next: (st) => {
        if (st && st.session_name) {
          this.sessionName = st.session_name;
        }
      },
      error: () => {}
    });

    this.api.getDispatchedOffers(100).subscribe({
      next: (res) => {
        if (res && res.items) {
          this.dispatchedOffers = res.items;
        }
      },
      error: () => {}
    });

    this.api.getGroupAnalytics('noivas').subscribe({
      next: (res) => {
        if (res && res.total_records > 0) {
          this.noivasSummary = res;
        }
      },
      error: () => {}
    });

    this.api.getLogs(5).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && res.logs) {
          this.recentLogs = res.logs.map((msg: string) => ({
            timestamp: new Date(),
            message: msg
          }));
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openDispatchedModal() {
    this.showDispatchedModal = true;
    this.api.getDispatchedOffers(100).subscribe({
      next: (res) => {
        if (res && res.items) {
          this.dispatchedOffers = res.items;
        }
      }
    });
  }

  toggleItemPreview(id: string) {
    this.expandedItems[id] = !this.expandedItems[id];
  }

  clearAllDispatchedOffers() {
    if (confirm('Deseja realmente limpar todo o histórico de ofertas disparadas?')) {
      this.api.clearDispatchedOffers().subscribe({
        next: () => {
          this.dispatchedOffers = [];
          (this.metrics as any).total_dispatched_offers = 0;
          this.showDispatchedModal = false;
        },
        error: () => {}
      });
    }
  }

  toggleBot() {
    if (this.metrics.bot_running) {
      this.api.stopBot().subscribe({
        next: () => {
          this.metrics.bot_running = false;
        }
      });
    } else {
      this.api.startBot().subscribe({
        next: (res) => {
          this.metrics.bot_running = true;
          if (res.session) {
            this.sessionName = res.session;
          }
        }
      });
    }
  }

  formatPrice(price: string | null | undefined): string {
    if (!price) return '-';
    const raw = price.replace(/R\$\s*/i, '').trim();
    if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(raw)) {
      const n = parseFloat(raw.replace(/,/g, ''));
      return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (/^\d+\.\d{2}$/.test(raw)) {
      const n = parseFloat(raw);
      return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(raw) || /^\d+,\d{2}$/.test(raw)) {
      return 'R$ ' + raw;
    }
    return price;
  }
}
