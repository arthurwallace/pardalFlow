import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AnalyticsSummary, ParticipantRecord } from '../../core/models';

interface GroupTab {
  id: string;
  name: string;
  icon: string;
  slug: string;
  description: string;
  hasWebhook: boolean;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div>
          <span class="category-tag">RELATÓRIOS E RETENÇÃO</span>
          <h1 class="main-title">Monitor de <span class="highlight-text">Entradas e Saídas</span></h1>
          <p class="subtitle">
            Análise detalhada de retenção, tempo de permanência e churn dos seus grupos de WhatsApp via webhook do n8n.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-teal" (click)="loadGroupData()" [disabled]="loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" [class.spin]="loading">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>{{ loading ? 'Carregando...' : 'Atualizar Dados' }}</span>
          </button>
        </div>
      </div>

      <!-- TABS POR GRUPO -->
      <div class="groups-tabs-nav">
        <button 
          *ngFor="let g of groups" 
          class="group-tab-btn" 
          [class.active]="selectedGroup.id === g.id"
          (click)="selectGroup(g)"
        >
          <span class="tab-emoji">{{ g.icon }}</span>
          <span class="tab-name">{{ g.name }}</span>
          <span *ngIf="g.hasWebhook" class="tab-badge-active">ATIVO</span>
          <span *ngIf="!g.hasWebhook" class="tab-badge-pending">PENDENTE</span>
        </button>
      </div>

      <!-- CASO: GRUPO NOIVAS (ATIVO) -->
      <ng-container *ngIf="selectedGroup.hasWebhook && summary.total_records > 0">
        <!-- GROUP HERO INFO -->
        <div class="group-hero-card card">
          <div class="hero-left">
            <div class="hero-avatar">{{ selectedGroup.icon }}</div>
            <div class="hero-details">
              <div class="hero-title-row">
                <h2>Grupo: {{ selectedGroup.name }}</h2>
                <span class="badge badge-success">Webhook n8n Conectado (3.162 eventos brutos)</span>
              </div>
              <p class="hero-sub">{{ selectedGroup.description }}</p>
            </div>
          </div>
        </div>

        <!-- PERIOD FILTER BAR (Arthur's request: hoje, semana, mês, todo o período) -->
        <div class="period-filter-bar">
          <div class="period-label-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="period-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span class="period-title">Filtrar Movimentações:</span>
          </div>
          <div class="period-pill-group">
            <button 
              type="button"
              class="period-pill-btn" 
              [class.active]="selectedPeriod === 'today'" 
              (click)="setPeriod('today')"
            >
              <span>Hoje</span>
            </button>
            <button 
              type="button"
              class="period-pill-btn" 
              [class.active]="selectedPeriod === 'yesterday'" 
              (click)="setPeriod('yesterday')"
            >
              <span>Ontem</span>
            </button>
            <button 
              type="button"
              class="period-pill-btn" 
              [class.active]="selectedPeriod === 'week'" 
              (click)="setPeriod('week')"
            >
              <span>Últimos 7 dias</span>
            </button>
            <button 
              type="button"
              class="period-pill-btn" 
              [class.active]="selectedPeriod === 'month'" 
              (click)="setPeriod('month')"
            >
              <span>Últimos 30 dias</span>
            </button>
            <button 
              type="button"
              class="period-pill-btn" 
              [class.active]="selectedPeriod === 'all'" 
              (click)="setPeriod('all')"
            >
              <span>Todo o período</span>
            </button>
          </div>
        </div>

        <!-- KPI METRIC CARDS DO GRUPO SELECIONADO (Atualizados dinamicamente pelo período) -->
        <div class="kpi-grid">
          <div class="card kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">TOTAL DE REGISTROS</span>
              <div class="kpi-icon teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
            </div>
            <span class="kpi-val">{{ periodKPI.total_records | number }}</span>
            <span class="kpi-sub neutral">{{ periodKPI.period_title }}</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">ATUALMENTE NO GRUPO</span>
              <div class="kpi-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-svg"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            </div>
            <span class="kpi-val text-green">{{ periodKPI.total_active | number }}</span>
            <span class="kpi-sub success">🟢 Membros Ativos</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">TOTAL DE SAÍDAS</span>
              <div class="kpi-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-svg"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
            </div>
            <span class="kpi-val text-red">{{ periodKPI.total_exits | number }}</span>
            <span class="kpi-sub text-red">🔴 Saídas no período</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">SAÍDAS &lt; 15 MINUTOS</span>
              <div class="kpi-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
            </div>
            <span class="kpi-val text-yellow">{{ periodKPI.quick_exits_under_15m | number }}</span>
            <span class="kpi-sub text-yellow">🚨 {{ periodKPI.quick_exit_percentage | number:'1.1-1' }}% das saídas (Churn rápido)</span>
          </div>
        </div>

        <!-- PARTICIPANTS TABLE CARD -->
        <div class="card table-card">
          <!-- CONTROLS & FILTER BAR -->
          <div class="table-controls-bar">
            <div class="controls-left">
              <h2>Listagem de Participantes</h2>
              <span class="results-count">Exibindo {{ filteredAndSortedRecords.length }} registros</span>
            </div>

            <div class="controls-right">
              <!-- STATUS FILTER -->
              <div class="filter-item">
                <label>Status</label>
                <select [(ngModel)]="statusFilter" (change)="currentPage = 1">
                  <option value="Todos">Todos os Status</option>
                  <option value="Ativos">🟢 Apenas Ativos</option>
                  <option value="Saídas">🔴 Todas as Saídas</option>
                  <option value="Saídas < 15 min">🚨 Saídas &lt; 15 min</option>
                </select>
              </div>

              <!-- SEARCH PHONE -->
              <div class="search-item">
                <label>Buscar Telefone</label>
                <div class="search-input-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-svg"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" [(ngModel)]="searchPhone" placeholder="Ex: (61) 99999-8888 ou 5561..." (input)="currentPage = 1">
                </div>
              </div>
            </div>
          </div>

          <!-- TABLE WITH CLICKABLE SORT HEADERS -->
          <div class="table-responsive">
            <table class="participants-table">
              <thead>
                <tr>
                  <th class="sortable" (click)="sort('phone')">
                    <div class="th-content">
                      <span>Telefone</span>
                      <span class="sort-indicator">{{ getSortIcon('phone') }}</span>
                    </div>
                  </th>
                  <th class="sortable" (click)="sort('entry_time')">
                    <div class="th-content">
                      <span>Entrada</span>
                      <span class="sort-indicator">{{ getSortIcon('entry_time') }}</span>
                    </div>
                  </th>
                  <th class="sortable" (click)="sort('exit_time')">
                    <div class="th-content">
                      <span>Saída</span>
                      <span class="sort-indicator">{{ getSortIcon('exit_time') }}</span>
                    </div>
                  </th>
                  <th class="sortable" (click)="sort('minutes')">
                    <div class="th-content">
                      <span>Tempo de Grupo</span>
                      <span class="sort-indicator">{{ getSortIcon('minutes') }}</span>
                    </div>
                  </th>
                  <th class="sortable" (click)="sort('tag')">
                    <div class="th-content">
                      <span>Status / Tag</span>
                      <span class="sort-indicator">{{ getSortIcon('tag') }}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="paginatedRecords.length === 0">
                  <td colspan="5" class="empty-cell">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
                <tr *ngFor="let p of paginatedRecords" [class.row-quick-exit]="p.tag && p.tag.includes('< 15')" [class.row-active]="p.status === 'Ativo'">
                  <!-- TELEFONE -->
                  <td class="phone-cell">
                    <span class="phone-num">{{ formatPhone(p.phone) }}</span>
                  </td>

                  <!-- ENTRADA -->
                  <td class="date-cell">
                    {{ p.entry_time ? (p.entry_time | date:'dd/MM/yyyy HH:mm') : '-' }}
                  </td>

                  <!-- SAÍDA -->
                  <td class="date-cell">
                    {{ p.exit_time ? (p.exit_time | date:'dd/MM/yyyy HH:mm') : '-' }}
                  </td>

                  <!-- TEMPO DE GRUPO -->
                  <td class="duration-cell">
                    <span class="duration-badge">{{ formatGroupTime(p.group_time) }}</span>
                  </td>

                  <!-- STATUS / TAG -->
                  <td class="tag-cell">
                    <span 
                      class="badge" 
                      [class.badge-success]="p.status === 'Ativo'"
                      [class.badge-danger]="p.tag && p.tag.includes('< 15')"
                      [class.badge-warning]="p.status === 'Inativo' && (!p.tag || !p.tag.includes('< 15'))"
                    >
                      {{ p.tag || p.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINATION FOOTER -->
          <div class="pagination-footer">
            <div class="page-size-selector">
              <span>Mostrar:</span>
              <select [(ngModel)]="pageSize" (change)="currentPage = 1">
                <option [ngValue]="25">25 por página</option>
                <option [ngValue]="50">50 por página</option>
                <option [ngValue]="100">100 por página</option>
              </select>
            </div>

            <div class="page-info">
              Página {{ currentPage }} de {{ totalPages }} ({{ filteredAndSortedRecords.length | number }} registros)
            </div>

            <div class="page-buttons">
              <button class="btn btn-secondary btn-sm" [disabled]="currentPage === 1" (click)="currentPage = 1">
                «
              </button>
              <button class="btn btn-secondary btn-sm" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
                ‹ Anterior
              </button>
              <button class="btn btn-secondary btn-sm" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1">
                Próxima ›
              </button>
              <button class="btn btn-secondary btn-sm" [disabled]="currentPage === totalPages" (click)="currentPage = totalPages">
                »
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- CASO: GRUPOS AGUARDANDO CONFIGURAÇÃO NO N8N -->
      <div *ngIf="!selectedGroup.hasWebhook || summary.total_records === 0" class="card pending-card">
        <div class="pending-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pending-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h2>Webhook n8n Pendente para {{ selectedGroup.name }}</h2>
        <p class="pending-text">
          O grupo <strong>{{ selectedGroup.name }}</strong> ainda não possui eventos gravados no seu webhook do CasaOS n8n.
        </p>
        <div class="endpoint-code-box">
          <span class="code-label">URL DO ENDPOINT PARA CADASTRAR NO N8N:</span>
          <code>https://seu-n8n.dominio.com/webhook/csv_monitoramento_entradas_saidas_grupos/{{ selectedGroup.slug }}</code>
        </div>
        <div class="pending-actions">
          <button class="btn btn-teal" (click)="selectGroup(groups[0])">
            <span>Visualizar Grupo Noivas Ativo (2.016 Registros)</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .category-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent-teal);
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
      color: var(--accent-teal);
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

    /* GROUPS TABS NAV */
    .groups-tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .group-tab-btn {
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

    .group-tab-btn:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .group-tab-btn.active {
      background-color: rgba(20, 184, 166, 0.15);
      border-color: var(--accent-teal);
      color: var(--accent-teal);
    }

    .tab-emoji {
      font-size: 1.1rem;
    }

    .tab-name {
      font-weight: 700;
    }

    .tab-badge-active {
      font-size: 0.65rem;
      background-color: rgba(16, 185, 129, 0.15);
      color: var(--accent-success-text);
      border: 1px solid var(--accent-success-border);
      border-radius: var(--radius-full);
      padding: 0.1rem 0.45rem;
      font-weight: 700;
    }

    .tab-badge-pending {
      font-size: 0.65rem;
      background-color: rgba(148, 163, 184, 0.15);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 0.1rem 0.45rem;
      font-weight: 700;
    }

    /* HERO CARD */
    .group-hero-card {
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(20, 184, 166, 0.08) 100%);
      border: 1px solid var(--border-subtle);
    }

    .hero-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .hero-avatar {
      font-size: 2.25rem;
      width: 54px;
      height: 54px;
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .hero-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .hero-title-row h2 {
      font-size: 1.35rem;
      color: var(--text-primary);
    }

    .hero-sub {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* PERIOD FILTER BAR */
    .period-filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 0.75rem 1.25rem;
      flex-wrap: wrap;
    }

    .period-label-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .period-icon {
      width: 18px !important;
      height: 18px !important;
      color: #14b8a6;
    }

    .period-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .period-pill-group {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .period-pill-btn {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.4rem 0.95rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .period-pill-btn:hover {
      color: var(--text-primary);
      border-color: #14b8a6;
      background-color: rgba(20, 184, 166, 0.08);
    }

    .period-pill-btn.active {
      background: #14b8a6;
      border-color: #14b8a6;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(20, 184, 166, 0.35);
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .kpi-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-label);
      letter-spacing: 0.05em;
    }

    .kpi-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-svg {
      width: 16px !important;
      height: 16px !important;
    }

    .kpi-icon.teal { background: rgba(20, 184, 166, 0.15); color: #14b8a6; }
    .kpi-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .kpi-icon.red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .kpi-icon.yellow { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    .kpi-val {
      font-size: 2.15rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .kpi-sub {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .kpi-sub.success { color: var(--accent-success-text); }
    .kpi-sub.neutral { color: var(--text-secondary); }
    .text-green { color: var(--accent-success-text) !important; }
    .text-red { color: var(--accent-danger-text) !important; }
    .text-yellow { color: var(--accent-warning-text) !important; }

    /* TABLE CARD */
    .table-card {
      padding: 1.5rem;
    }

    .table-controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1.5rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .controls-left h2 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 0.2rem;
    }

    .results-count {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .controls-right {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-item, .search-item {
      display: flex;
      flex-direction: column;
    }

    .search-input-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.75rem;
      width: 220px;
    }

    .search-svg {
      width: 14px !important;
      height: 14px !important;
      color: var(--text-muted);
    }

    .search-input-box input {
      border: none;
      background: transparent;
      padding: 0;
      color: var(--text-primary);
      font-size: 0.825rem;
    }

    /* TABLE */
    .table-responsive {
      overflow-x: auto;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .participants-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .participants-table th {
      background-color: var(--bg-card);
      padding: 0.85rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-label);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
      user-select: none;
    }

    .participants-table th.sortable {
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }

    .participants-table th.sortable:hover {
      background-color: var(--bg-card-hover);
      color: var(--text-primary);
    }

    .th-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .sort-indicator {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .participants-table td {
      padding: 0.8rem 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    .participants-table tr:hover td {
      background-color: var(--bg-card-hover);
    }

    .row-quick-exit td {
      background-color: rgba(239, 68, 68, 0.06);
    }

    .row-active td {
      background-color: rgba(16, 185, 129, 0.03);
    }

    .phone-cell {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: var(--text-primary);
    }

    .date-cell {
      color: var(--text-secondary);
      font-size: 0.825rem;
    }

    .duration-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      background-color: var(--bg-primary);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .empty-cell {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* PAGINATION */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: var(--text-secondary);
    }

    .page-size-selector select {
      width: auto;
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
    }

    .page-info {
      font-size: 0.825rem;
      color: var(--text-muted);
    }

    .page-buttons {
      display: flex;
      gap: 0.4rem;
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
    }

    /* PENDING CARD */
    .pending-card {
      padding: 3rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .pending-icon-box {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pending-icon {
      width: 28px !important;
      height: 28px !important;
      color: var(--accent-warning-text);
    }

    .pending-card h2 {
      font-size: 1.35rem;
      color: var(--text-primary);
    }

    .pending-text {
      max-width: 600px;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .endpoint-code-box {
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      max-width: 650px;
      width: 100%;
    }

    .code-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-label);
      letter-spacing: 0.05em;
    }

    .endpoint-code-box code {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
      font-size: 0.825rem;
      word-break: break-all;
    }

    .pending-actions {
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .header-actions {
        width: 100%;
      }
      .header-actions .btn {
        width: 100%;
        justify-content: center;
      }
      .groups-tabs-nav {
        overflow-x: auto;
        padding-bottom: 0.35rem;
        flex-wrap: nowrap;
      }
      .group-tab-btn {
        white-space: nowrap;
        flex-shrink: 0;
      }
      .period-filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .period-pill-group {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
      .table-controls-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .controls-right {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .search-input-box {
        width: 100%;
      }
      .pagination-footer {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
        gap: 0.75rem;
      }
      .page-buttons {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  api = inject(ApiService);

  groups: GroupTab[] = [
    { id: 'noivas', name: 'Noivas', icon: '💍', slug: 'noivas', description: 'Grupo de promoções e produtos para noivas e casamentos.', hasWebhook: true },
    { id: 'pardal', name: 'Pardal Principal', icon: '🦅', slug: 'pardal', description: 'Grupo geral com as melhores promoções diárias.', hasWebhook: false },
    { id: 'cupons', name: 'Cupons VIP', icon: '🎟️', slug: 'cupons', description: 'Grupo especializado em cupons de desconto exclusivos.', hasWebhook: false },
    { id: 'baby', name: 'Baby & Kids', icon: '👶', slug: 'baby', description: 'Ofertas para bebês, gestantes e produtos infantis.', hasWebhook: false },
    { id: 'maromba', name: 'Maromba & Fitness', icon: '💪', slug: 'maromba', description: 'Suplementos, roupas fitness e equipamentos de treino.', hasWebhook: false },
    { id: 'pardal_2', name: 'Pardal 2', icon: '🦅', slug: 'pardal_2', description: 'Grupo reserva e contingência para rotação de membros.', hasWebhook: false }
  ];

  selectedGroup: GroupTab = this.groups[0];

  summary: AnalyticsSummary = {
    total_records: 0,
    total_active: 0,
    total_exits: 0,
    quick_exits_under_15m: 0,
    quick_exit_percentage: 0,
    participants: []
  };

  loading = false;
  statusFilter = 'Todos';
  searchPhone = '';
  selectedPeriod: 'today' | 'yesterday' | 'week' | 'month' | 'all' = 'today';

  sortColumn: 'phone' | 'entry_time' | 'exit_time' | 'minutes' | 'tag' = 'entry_time';
  sortAsc = false;

  currentPage = 1;
  pageSize = 50;

  ngOnInit() {
    this.loadGroupData();
  }

  selectGroup(g: GroupTab) {
    this.selectedGroup = g;
    this.currentPage = 1;
    this.loadGroupData();
  }

  setPeriod(period: 'today' | 'yesterday' | 'week' | 'month' | 'all') {
    this.selectedPeriod = period;
    this.currentPage = 1;
  }

  private getLocalDateString(d: string | Date): string {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return '';
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(dateObj); // returns "YYYY-MM-DD"
    } catch {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }

  isDateInPeriod(d: string | Date | undefined, period: 'today' | 'yesterday' | 'week' | 'month' | 'all'): boolean {
    if (!d) return false;
    if (period === 'all') return true;

    const dateStr = this.getLocalDateString(d);
    if (!dateStr) return false;

    const now = new Date();
    const todayStr = this.getLocalDateString(now);

    if (period === 'today') {
      return dateStr === todayStr;
    }

    if (period === 'yesterday') {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      const yesterdayStr = this.getLocalDateString(yest);
      return dateStr === yesterdayStr;
    }

    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (period === 'week') {
      const diffDays = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    if (period === 'month') {
      const diffDays = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }

    return true;
  }

  get periodParticipants(): ParticipantRecord[] {
    if (!this.summary.participants) return [];
    if (this.selectedPeriod === 'all') return this.summary.participants;

    return this.summary.participants.filter(p => {
      const entryMatches = this.isDateInPeriod(p.entry_time, this.selectedPeriod);
      const exitMatches = p.exit_time ? this.isDateInPeriod(p.exit_time, this.selectedPeriod) : false;
      return entryMatches || exitMatches;
    });
  }

  get periodKPI(): {
    total_records: number;
    total_active: number;
    total_exits: number;
    quick_exits_under_15m: number;
    quick_exit_percentage: number;
    period_title: string;
  } {
    const list = this.periodParticipants;
    const total_records = list.length;
    const total_active = list.filter(p => p.status === 'Ativo').length;
    const total_exits = list.filter(p => p.status === 'Inativo').length;
    const quick_exits = list.filter(p => p.tag && p.tag.includes('< 15')).length;
    const quick_pct = total_exits > 0 ? Math.round((quick_exits / total_exits) * 1000) / 10 : 0.0;

    let period_title = 'Todo o Histórico';
    if (this.selectedPeriod === 'today') period_title = 'Movimentações de Hoje';
    if (this.selectedPeriod === 'yesterday') period_title = 'Movimentações de Ontem';
    if (this.selectedPeriod === 'week') period_title = 'Últimos 7 dias';
    if (this.selectedPeriod === 'month') period_title = 'Últimos 30 dias';

    return {
      total_records,
      total_active,
      total_exits,
      quick_exits_under_15m: quick_exits,
      quick_exit_percentage: quick_pct,
      period_title
    };
  }

  loadGroupData() {
    this.loading = true;
    this.api.getGroupAnalytics(this.selectedGroup.slug).subscribe({
      next: (data: AnalyticsSummary) => {
        this.loading = false;
        this.summary = data;
      },
      error: () => {
        this.loading = false;
        this.summary = {
          total_records: 0,
          total_active: 0,
          total_exits: 0,
          quick_exits_under_15m: 0,
          quick_exit_percentage: 0,
          participants: []
        };
      }
    });
  }

  sort(column: 'phone' | 'entry_time' | 'exit_time' | 'minutes' | 'tag') {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
    this.currentPage = 1;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortAsc ? '▲' : '▼';
  }

  get filteredAndSortedRecords(): ParticipantRecord[] {
    const source = this.periodParticipants;
    if (!source) return [];

    let list = source.filter(p => {
      if (this.statusFilter === 'Ativos') return p.status === 'Ativo';
      if (this.statusFilter === 'Saídas') return p.status === 'Inativo';
      if (this.statusFilter === 'Saídas < 15 min') return p.tag && p.tag.includes('< 15');
      return true;
    });

    if (this.searchPhone.trim()) {
      const q = this.searchPhone.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      list = list.filter(p => {
        if (!p.phone) return false;
        const pRaw = p.phone.toLowerCase();
        const pFormatted = this.formatPhone(p.phone).toLowerCase();
        const pDigits = p.phone.replace(/\D/g, '');
        return pRaw.includes(q) || pFormatted.includes(q) || (qDigits.length > 0 && pDigits.includes(qDigits));
      });
    }

    list.sort((a, b) => {
      let valA: any = (a as any)[this.sortColumn];
      let valB: any = (b as any)[this.sortColumn];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (this.sortColumn === 'entry_time' || this.sortColumn === 'exit_time') {
        const timeA = valA ? new Date(valA).getTime() : (this.sortAsc ? Infinity : -Infinity);
        const timeB = valB ? new Date(valB).getTime() : (this.sortAsc ? Infinity : -Infinity);
        return this.sortAsc ? (timeA - timeB) : (timeB - timeA);
      }

      if (this.sortColumn === 'minutes') {
        const numA = typeof valA === 'number' ? valA : 0;
        const numB = typeof valB === 'number' ? valB : 0;
        return this.sortAsc ? (numA - numB) : (numB - numA);
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return this.sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return list;
  }

  get totalPages(): number {
    const total = this.filteredAndSortedRecords.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  get paginatedRecords(): ParticipantRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSortedRecords.slice(start, start + this.pageSize);
  }
  formatPhone(phone: string | undefined): string {
    if (!phone) return '-';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return phone;

    // Brazil with 55 (13 digits: 55 + 2 DDD + 9 digits)
    if (digits.length === 13 && digits.startsWith('55')) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    // Brazil with 55 (12 digits: 55 + 2 DDD + 8 digits)
    if (digits.length === 12 && digits.startsWith('55')) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    // Brazil without 55 (11 digits: 2 DDD + 9 digits)
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    // Brazil without 55 (10 digits: 2 DDD + 8 digits)
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Other international numbers
    if (digits.length > 10) {
      return `+${digits.slice(0, digits.length - 10)} (${digits.slice(digits.length - 10, digits.length - 8)}) ${digits.slice(digits.length - 8, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
    }
    return `+${digits}`;
  }

  formatGroupTime(val: string | undefined): string {
    if (!val) return '-';
    let s = val;
    // Handle English '29 days 19:32:36' or '29 days, 19:32:36'
    s = s.replace(/(\d+)\s*days?,?\s*(\d{1,2}):(\d{2})(?::\d{2})?/i, (m, days, hours, mins) => {
      const dNum = parseInt(days, 10);
      const dStr = dNum === 1 ? '1 dia' : `${dNum} dias`;
      const hNum = parseInt(hours, 10);
      return hNum > 0 ? `${dStr} e ${hNum}h ${mins}m` : `${dStr} e ${mins}m`;
    });
    // Handle 'HH:MM:SS'
    s = s.replace(/^(\d{1,2}):(\d{2}):(\d{2})$/, (m, hours, mins) => {
      const h = parseInt(hours, 10);
      return h > 0 ? `${h}h ${mins}m` : `${parseInt(mins, 10)} min`;
    });
    return s;
  }

}
