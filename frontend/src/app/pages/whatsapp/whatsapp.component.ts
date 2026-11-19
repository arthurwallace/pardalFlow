import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WhatsAppGroup, WhatsAppSession } from '../../core/models';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './whatsapp.component.html',
  styles: [`
    .whatsapp-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      color: #f1f5f9;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 20px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      max-width: 700px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon {
      width: 16px !important;
      height: 16px !important;
      max-width: 16px !important;
      max-height: 16px !important;
      flex-shrink: 0;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
    }

    .btn-secondary:hover {
      background: #334155;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #334155;
      color: #cbd5e1;
    }

    .btn-outline:hover {
      background: #1e293b;
      border-color: #475569;
    }

    .btn-sm {
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .btn-outline-danger {
      background: transparent;
      border-color: rgba(239, 68, 68, 0.4);
      color: #ef4444;
    }

    .btn-outline-danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .btn-danger {
      background: #dc2626;
      color: #fff;
    }

    .btn-warning {
      background: #d97706;
      color: #fff;
    }

    /* TABS */
    .hub-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .hub-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .hub-tab-icon {
      width: 16px !important;
      height: 16px !important;
      max-width: 16px !important;
      max-height: 16px !important;
    }

    .hub-tab-btn:hover {
      color: #f1f5f9;
    }

    .hub-tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-count {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      background: #1e293b;
      color: #94a3b8;
    }

    .hub-tab-btn.active .tab-count {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
    }

    /* SECTION INTRO */
    .section-intro {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px 0;
    }

    .section-desc {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }

    /* SESSIONS GRID */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .session-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 0.2s;
    }

    .session-card.card-working {
      border-color: rgba(16, 185, 129, 0.4);
    }

    .session-card.card-error {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .session-title-box {
      display: flex;
      flex-direction: column;
    }

    .session-name {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }

    .session-phone {
      font-size: 12px;
      color: #94a3b8;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      background: #1e293b;
      color: #94a3b8;
    }

    .status-pill.working {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }

    .status-pill.scan_qr_code, .status-pill.starting {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }

    .status-pill.stopped, .status-pill.failed {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      padding: 10px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
    }

    .meta-label {
      color: #64748b;
    }

    .meta-val {
      color: #cbd5e1;
      font-weight: 600;
    }

    .meta-val.highlight {
      color: #38bdf8;
    }

    .card-footer {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* TABLES */
    .table-container {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    .data-table th {
      background: #1e293b;
      color: #94a3b8;
      font-weight: 600;
      padding: 10px 14px;
      border-bottom: 1px solid #334155;
    }

    .data-table td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
    }

    .data-table tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .jid-code {
      font-family: monospace;
      font-size: 11px;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      color: #94a3b8;
    }

    .role-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #1e293b;
      color: #94a3b8;
    }

    .role-badge.admin {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }

    .dest-info {
      display: flex;
      flex-direction: column;
    }

    .dest-title {
      font-weight: 600;
      color: #f8fafc;
    }

    .dest-jid {
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
    }

    .chip-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: #1e293b;
      color: #38bdf8;
    }

    .tag-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    .tag-shopee {
      background: rgba(238, 77, 45, 0.15);
      color: #f87171;
    }

    .tag-ml {
      background: rgba(255, 230, 0, 0.15);
      color: #facc15;
    }

    .tag-amazon {
      background: rgba(255, 153, 0, 0.15);
      color: #fb923c;
    }

    .tag-magalu {
      background: rgba(0, 134, 255, 0.15);
      color: #60a5fa;
    }

    .btn-group-sm {
      display: flex;
      gap: 6px;
    }

    .text-right {
      text-align: right;
    }

    /* SWITCH */
    .switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #334155;
      transition: .3s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #10b981;
    }

    input:checked + .slider:before {
      transform: translateX(16px);
    }

    /* MIRROR CARDS */
    .mirror-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 16px;
    }

    .mirror-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mirror-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .source-type {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #10b981;
    }

    .source-name {
      font-size: 15px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 2px 0;
    }

    .source-jid {
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
    }

    .mirror-flow {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.2);
      padding: 10px;
      border-radius: 6px;
      font-size: 11px;
    }

    .flow-step {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .flow-label {
      color: #64748b;
      font-weight: 600;
    }

    .flow-val {
      color: #cbd5e1;
    }

    .flow-arrow {
      color: #64748b;
      font-size: 14px;
    }

    .mirror-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* STATS & BROADCAST */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
    }

    .stat-val {
      font-size: 22px;
      font-weight: 700;
      color: #38bdf8;
    }

    .stat-label {
      font-size: 12px;
      color: #94a3b8;
    }

    .broadcast-box {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .box-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #f1f5f9;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
    }

    .col-12 { grid-column: span 12; }
    .col-8 { grid-column: span 8; }
    .col-6 { grid-column: span 6; }
    .col-4 { grid-column: span 4; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .form-control {
      background: #090d16;
      border: 1px solid #334155;
      color: #f1f5f9;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }

    .form-control:focus {
      border-color: #3b82f6;
    }

    .form-hint {
      font-size: 11px;
      color: #64748b;
    }

    .form-divider {
      border-top: 1px solid #1e293b;
      margin: 8px 0;
      padding-top: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #38bdf8;
    }

    .box-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 14px;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      width: 90%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-card.modal-lg {
      max-width: 680px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }

    .modal-header h3 {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      color: #f1f5f9;
    }

    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 20px;
      cursor: pointer;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .qr-code-wrapper {
      margin: 16px auto;
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
      width: 240px;
      height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .qr-loading {
      height: 240px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #94a3b8;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .empty-placeholder {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .empty-icon {
      width: 48px !important;
      height: 48px !important;
      margin-bottom: 12px;
      color: #475569;
    }

    .alert-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .alert-banner.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }

    .alert-banner.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .alert-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 16px;
      cursor: pointer;
    }
  `]
})
export class WhatsappComponent implements OnInit, OnDestroy {
  activeTab: 'sessions' | 'explorer' | 'destinations' | 'mirroring' | 'queue' = 'destinations';
  loading = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  // Data
  sessions: WhatsAppSession[] = [];
  groups: WhatsAppGroup[] = [];
  deviceGroups: any[] = [];
  explorerFilter = '';
  explorerSession = 'default';

  // Queue & Broadcast
  queueCounts: any = { ofertas: 0, notificacoes: 0, total: 0 };
  queueItems: any[] = [];
  broadcastText = '';
  broadcastImageUrl = '';
  broadcastSession = 'default';

  // Modals
  qrModalOpen = false;
  activeQrSession = '';
  activeQrStatus = '';
  qrCodeBase64: string | null = null;
  qrPollingTimer: any = null;

  groupModalOpen = false;
  selectedGroup: any = null;
  groupForm: any = {
    name: '',
    group_id: '',
    session_name: 'default',
    group_type: 'destination',
    shopee_subid: '',
    ml_tag: '',
    amazon_tag: '',
    magalu_store: '',
    footer_text: '',
    is_active: true
  };

  newSessionModalOpen = false;
  newSessionName = '';

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadAllData();
  }

  ngOnDestroy() {
    this.stopQrPolling();
  }

  get destinationGroups(): WhatsAppGroup[] {
    return this.groups.filter(g => g.group_type === 'destination' || (!g.group_type && !g.is_monitored));
  }

  get monitoredGroups(): WhatsAppGroup[] {
    return this.groups.filter(g => g.group_type === 'monitored' || !!g.is_monitored);
  }

  get filteredExplorerGroups(): any[] {
    if (!this.explorerFilter) return this.deviceGroups;
    const term = this.explorerFilter.toLowerCase();
    return this.deviceGroups.filter(g =>
      (g.name && g.name.toLowerCase().includes(term)) ||
      (g.id && g.id.toLowerCase().includes(term))
    );
  }

  get queueCountTotal(): number {
    return (this.queueCounts?.total || 0) + this.queueItems.length;
  }

  showAlert(message: string, type: 'success' | 'error' = 'success') {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      if (this.alertMessage === message) this.alertMessage = null;
    }, 5000);
  }

  loadAllData() {
    this.loading = true;
    this.api.getWahaSessions().subscribe({
      next: (res: any) => {
        // Backend returns { sessions: [...], base_url: "..." } or directly an array
        const rawSessions = Array.isArray(res) ? res : (Array.isArray(res?.sessions) ? res.sessions : []);
        this.sessions = rawSessions;
        this.loading = false;

        // Se encontrou sessões e a sessão de broadcast não existe nelas, seleciona a primeira
        if (this.sessions.length > 0) {
          const currentExists = this.sessions.some(s => s.name === this.broadcastSession);
          if (!currentExists) {
            this.broadcastSession = this.sessions[0].name;
            this.explorerSession = this.sessions[0].name;
          }
          this.loadDeviceGroups(this.explorerSession);
        } else {
          this.loadDeviceGroups('default');
        }
      },
      error: () => {
        this.sessions = [];
        this.loading = false;
        this.loadDeviceGroups('default');
      }
    });

    this.api.getWhatsAppGroups().subscribe({
      next: (groups) => {
        this.groups = Array.isArray(groups) ? groups : [];
      },
      error: () => {
        this.groups = [];
      }
    });

    this.loadQueueData();
  }

  loadDeviceGroups(sessionName: string = 'default') {
    this.api.getWahaGroups(sessionName).subscribe({
      next: (res: any) => {
        this.deviceGroups = Array.isArray(res) ? res : (res?.groups || []);
      },
      error: () => {
        this.deviceGroups = [];
      }
    });
  }

  loadQueueData() {
    this.api.getQueueCounts().subscribe({
      next: (counts) => this.queueCounts = counts,
      error: () => { }
    });

    this.api.getQueueItems(20).subscribe({
      next: (items: any) => this.queueItems = Array.isArray(items) ? items : (items?.items || []),
      error: () => { }
    });
  }

  getGroupsCountBySession(sessionName: string): number {
    return this.groups.filter(g => g.session_name === sessionName).length;
  }

  getMirrorTargetCount(group: WhatsAppGroup): number {
    const list = group.mirror_to_group_ids;
    if (Array.isArray(list)) return list.length;
    return this.destinationGroups.length;
  }

  // --- SESSIONS ACTIONS ---
  openNewSessionModal() {
    this.newSessionName = 'chip_' + Math.floor(Math.random() * 1000);
    this.newSessionModalOpen = true;
  }

  createSession() {
    if (!this.newSessionName) return;
    this.api.createWahaSession(this.newSessionName).subscribe({
      next: () => {
        this.showAlert(`Sessão ${this.newSessionName} criada com sucesso.`);
        const created = this.newSessionName;
        this.newSessionModalOpen = false;
        this.loadAllData();
        this.openQrModal(created);
      },
      error: (err) => this.showAlert('Erro ao criar sessão: ' + (err?.error?.detail || err.message), 'error')
    });
  }

  startSession(name: string) {
    this.api.startWahaSession(name).subscribe({
      next: () => {
        this.showAlert(`Sessão ${name} iniciada.`);
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao iniciar: ' + err.message, 'error')
    });
  }

  stopSession(name: string) {
    this.api.stopWahaSession(name).subscribe({
      next: () => {
        this.showAlert(`Sessão ${name} pausada.`);
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao pausar: ' + err.message, 'error')
    });
  }

  restartSession(name: string) {
    this.api.restartWahaSession(name).subscribe({
      next: () => {
        this.showAlert(`Sessão ${name} reiniciada.`);
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao reiniciar: ' + err.message, 'error')
    });
  }

  logoutSession(name: string) {
    if (!confirm(`Tem certeza que deseja desconectar e desvincular a sessão ${name}?`)) return;
    this.api.logoutWahaSession(name).subscribe({
      next: () => {
        this.showAlert(`Sessão ${name} desconectada.`);
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao desconectar: ' + err.message, 'error')
    });
  }

  // --- QR CODE MODAL ---
  openQrModal(sessionName: string) {
    this.activeQrSession = sessionName;
    this.activeQrStatus = 'Carregando...';
    this.qrCodeBase64 = null;
    this.qrModalOpen = true;
    this.fetchQrCode();
    this.startQrPolling();
  }

  closeQrModal() {
    this.qrModalOpen = false;
    this.stopQrPolling();
  }

  fetchQrCode() {
    if (!this.activeQrSession) return;
    this.api.getWahaSessionQr(this.activeQrSession).subscribe({
      next: (res) => {
        this.activeQrStatus = res?.status || 'SCAN_QR_CODE';
        if (res?.qr) {
          this.qrCodeBase64 = res.qr.startsWith('data:') ? res.qr : `data:image/png;base64,${res.qr}`;
        }
        if (res?.status === 'WORKING') {
          this.showAlert(`Dispositivo ${this.activeQrSession} conectado com sucesso!`);
          this.closeQrModal();
          this.loadAllData();
        }
      },
      error: () => {
        this.activeQrStatus = 'Aguardando QR Code do WAHA...';
      }
    });
  }

  startQrPolling() {
    this.stopQrPolling();
    this.qrPollingTimer = setInterval(() => {
      if (this.qrModalOpen) {
        this.fetchQrCode();
      }
    }, 3500);
  }

  stopQrPolling() {
    if (this.qrPollingTimer) {
      clearInterval(this.qrPollingTimer);
      this.qrPollingTimer = null;
    }
  }

  // --- EXPLORER ACTIONS ---
  importAsDestination(group: any) {
    this.api.importWahaGroup({
      group_id: group.id,
      name: group.name,
      group_type: 'destination',
      session_name: this.sessions[0]?.name || 'default'
    }).subscribe({
      next: () => {
        this.showAlert(`Grupo "${group.name}" importado como Destino de Ofertas.`);
        group.is_destination = true;
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao importar grupo: ' + err.message, 'error')
    });
  }

  importAsMonitored(group: any) {
    this.api.importWahaGroup({
      group_id: group.id,
      name: group.name,
      group_type: 'monitored',
      session_name: this.sessions[0]?.name || 'default'
    }).subscribe({
      next: () => {
        this.showAlert(`Grupo "${group.name}" adicionado para Monitoramento/Espelhamento.`);
        group.is_monitored = true;
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao importar grupo: ' + err.message, 'error')
    });
  }

  // --- DESTINATION GROUPS CRUD ---
  openEditGroupModal(group: WhatsAppGroup | null) {
    this.selectedGroup = group;
    if (group) {
      this.groupForm = {
        name: group.name || '',
        group_id: group.group_id || group.id || '',
        session_name: group.session_name || 'default',
        group_type: group.group_type || (group.is_monitored ? 'monitored' : 'destination'),
        shopee_subid: group.shopee_subid || '',
        ml_tag: group.ml_tag || '',
        amazon_tag: group.amazon_tag || '',
        magalu_store: group.magalu_store || '',
        footer_text: group.footer_text || '',
        is_active: group.is_active !== false && group.active !== false
      };
    } else {
      this.groupForm = {
        name: '',
        group_id: '',
        session_name: this.sessions[0]?.name || 'default',
        group_type: 'destination',
        shopee_subid: '',
        ml_tag: '',
        amazon_tag: '',
        magalu_store: '',
        footer_text: '',
        is_active: true
      };
    }
    this.groupModalOpen = true;
  }

  openNewMirrorModal() {
    this.selectedGroup = null;
    this.groupForm = {
      name: '',
      group_id: '',
      session_name: this.sessions[0]?.name || 'default',
      group_type: 'monitored',
      shopee_subid: '',
      ml_tag: '',
      amazon_tag: '',
      magalu_store: '',
      footer_text: '',
      is_active: true
    };
    this.groupModalOpen = true;
  }

  saveGroup() {
    if (!this.groupForm.group_id) {
      alert('O JID / ID do grupo é obrigatório.');
      return;
    }
    const payload: Partial<WhatsAppGroup> = {
      ...this.groupForm,
      id: this.groupForm.group_id,
      active: this.groupForm.is_active
    };
    const targetId = this.selectedGroup?.id_db || this.selectedGroup?.id;
    if (targetId) {
      this.api.updateWhatsAppGroup(targetId, payload).subscribe({
        next: () => {
          this.showAlert('Configurações do grupo atualizadas!');
          this.groupModalOpen = false;
          this.loadAllData();
        },
        error: (err) => this.showAlert('Erro ao atualizar: ' + err.message, 'error')
      });
    } else {
      this.api.createWhatsAppGroup(payload).subscribe({
        next: () => {
          this.showAlert('Grupo adicionado com sucesso!');
          this.groupModalOpen = false;
          this.loadAllData();
        },
        error: (err) => this.showAlert('Erro ao cadastrar: ' + err.message, 'error')
      });
    }
  }

  toggleGroupActive(group: WhatsAppGroup) {
    const groupId = group.id_db || group.id;
    if (!groupId) return;
    const newState = group.is_active ?? group.active ?? true;
    this.api.updateWhatsAppGroup(groupId, { is_active: newState, active: newState }).subscribe({
      next: () => this.showAlert(`Status do grupo "${group.name}" atualizado.`),
      error: () => {
        group.is_active = !newState;
        group.active = !newState;
      }
    });
  }

  deleteGroup(group: WhatsAppGroup) {
    const groupId = group.id_db || group.id;
    if (!groupId) return;
    if (!confirm(`Remover "${group.name}" da plataforma?`)) return;
    this.api.deleteWhatsAppGroup(groupId).subscribe({
      next: () => {
        this.showAlert(`Grupo "${group.name}" removido.`);
        this.loadAllData();
      },
      error: (err) => this.showAlert('Erro ao remover: ' + err.message, 'error')
    });
  }

  // --- QUEUE & BROADCAST ---
  dispatchQueueItem() {
    this.api.dispatchNextQueue('ofertas').subscribe({
      next: (res) => {
        this.showAlert(`Disparo executado: ${res?.message || 'Sucesso'}`);
        this.loadQueueData();
      },
      error: (err) => this.showAlert('Erro ao despachar: ' + err.message, 'error')
    });
  }

  trimQueueItems() {
    this.api.trimQueue(5).subscribe({
      next: () => {
        this.showAlert('Fila reduzida.');
        this.loadQueueData();
      },
      error: (err) => this.showAlert('Erro ao limpar fila: ' + err.message, 'error')
    });
  }

  sendBroadcast() {
    if (!this.broadcastText) return;
    const destIds = this.destinationGroups
      .filter(g => g.is_active !== false && g.active !== false)
      .map(g => g.group_id || g.id);
    if (destIds.length === 0) {
      alert('Nenhum grupo de destino ativo cadastrado.');
      return;
    }
    this.api.wahaBroadcast({
      text: this.broadcastText,
      image_url: this.broadcastImageUrl || undefined,
      session_name: this.broadcastSession,
      target_groups: destIds
    }).subscribe({
      next: (res) => {
        this.showAlert(`Disparo enfileirado para ${res?.enqueued || destIds.length} grupos com sucesso!`);
        this.broadcastText = '';
        this.broadcastImageUrl = '';
        this.loadQueueData();
      },
      error: (err) => this.showAlert('Erro no disparo: ' + (err?.error?.detail || err.message), 'error')
    });
  }
}
