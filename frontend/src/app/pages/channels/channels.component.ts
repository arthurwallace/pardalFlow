import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Channel, WhatsAppGroup } from '../../core/models';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channels.component.html',
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
      color: #ffffff !important;
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
      color: #ffffff !important;
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
