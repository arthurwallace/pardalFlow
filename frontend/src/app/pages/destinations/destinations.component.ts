import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WhatsAppGroup, WhatsAppSession, TelegramDestination, QueueCounts, QueueItem } from '../../core/models';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './destinations.component.html',
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

    /* QUEUE & BROADCAST STYLES */
    .action-buttons-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .btn-danger-outline {
      background: transparent;
      border: 1px solid var(--accent-danger);
      color: var(--accent-danger) !important;
    }
    .btn-danger-outline:hover {
      background: var(--accent-danger-bg);
    }
    .queue-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .q-stat-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .q-stat-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-tag);
      letter-spacing: 0.04em;
    }
    .q-stat-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .text-teal { color: #14b8a6 !important; }
    .text-orange { color: #f97316 !important; }
    .queue-table-wrap {
      overflow-x: auto;
    }
    .empty-status-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #14b8a6;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .broadcast-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .checkbox-block {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      justify-content: center;
    }
    .templates-section {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .section-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-top-row h3 {
      font-size: 1rem;
      color: var(--text-primary);
      margin: 0;
    }
    .template-item-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
    }
    .template-idx {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-tag);
      white-space: nowrap;
      padding-top: 0.4rem;
    }
    .template-item-row textarea {
      flex: 1;
    }
    .broadcast-footer-actions {
      display: flex;
      justify-content: flex-end;
    }
    /* ESTILOS AVANÇADOS WAHA & TAGS POR GRUPO */
    .header-actions-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .modal-lg {
      max-width: 760px !important;
      width: 90vw !important;
    }
    .modal-scrollable {
      max-height: 72vh;
      overflow-y: auto;
      padding-right: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-section-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .section-tag-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(20, 184, 166, 0.15);
      color: #14b8a6;
      border: 1px solid rgba(20, 184, 166, 0.3);
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-tag-badge-purple {
      font-size: 0.7rem;
      font-weight: 700;
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-hint {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .form-row-2 {
        grid-template-columns: 1fr;
      }
    }
    .align-center-checkbox {
      display: flex;
      align-items: center;
      padding-top: 1.5rem;
    }
    .targets-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.5rem;
      max-height: 160px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.65rem;
      background: var(--bg-card);
    }
    .target-checkbox-item {
      font-size: 0.85rem;
    }
    .target-checkbox-item.hidden {
      display: none;
    }
    .group-tags-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.35rem;
    }
    .tag-pill {
      font-size: 0.72rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .tag-ml {
      background: rgba(254, 240, 138, 0.15);
      border: 1px solid rgba(250, 204, 21, 0.4);
      color: #facc15;
    }
    .tag-shopee {
      background: rgba(251, 146, 60, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #fb923c;
    }
    .tag-amazon {
      background: rgba(96, 165, 250, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
    }
    .tag-magalu {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(14, 165, 233, 0.4);
      color: #38bdf8;
    }
    .badge-purple {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }
    .badge-cyan {
      background: rgba(6, 182, 212, 0.15);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .badge-secondary {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .dest-phone-tag {
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--text-secondary);
      background: var(--bg-primary);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }
    .dest-actions-grid {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn-action-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
      background: var(--bg-card);
      color: var(--text-primary);
    }
    .btn-action-sm .action-icon {
      width: 14px;
      height: 14px;
    }
    .btn-qr {
      background: rgba(20, 184, 166, 0.15);
      border-color: rgba(20, 184, 166, 0.4);
      color: #14b8a6;
    }
    .btn-qr:hover {
      background: rgba(20, 184, 166, 0.25);
    }
    .btn-start {
      background: rgba(34, 197, 94, 0.12);
      border-color: rgba(34, 197, 94, 0.3);
      color: #4ade80;
    }
    .btn-start:hover {
      background: rgba(34, 197, 94, 0.22);
    }
    .btn-stop {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .btn-stop:hover {
      background: rgba(239, 68, 68, 0.22);
    }
    .btn-restart {
      background: rgba(234, 179, 8, 0.12);
      border-color: rgba(234, 179, 8, 0.3);
      color: #facc15;
    }
    .btn-restart:hover {
      background: rgba(234, 179, 8, 0.22);
    }
    .btn-explorer {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.3);
      color: #818cf8;
    }
    .btn-explorer:hover {
      background: rgba(99, 102, 241, 0.22);
    }
    .btn-logout {
      background: rgba(148, 163, 184, 0.1);
      border-color: rgba(148, 163, 184, 0.25);
      color: #94a3b8;
    }
    .btn-logout:hover {
      background: rgba(148, 163, 184, 0.2);
    }
    /* QR CODE MODAL */
    .qr-modal-card {
      max-width: 480px;
    }
    .qr-modal-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 0;
    }
    .qr-code-container {
      width: 260px;
      height: 260px;
      background: #ffffff;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      border: 2px solid var(--border-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .qr-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .qr-loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .qr-empty-msg {
      color: #64748b;
      font-size: 0.85rem;
      text-align: center;
      padding: 1rem;
    }
    .qr-instructions {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1.15rem;
      width: 100%;
    }
    .qr-instructions ol {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.825rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    /* EXPLORER MODAL */
    .explorer-modal-card {
      max-width: 820px;
    }
    .explorer-filter-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .explorer-search-input {
      flex: 1;
    }
    .explorer-spinner-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2.5rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(20, 184, 166, 0.2);
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .explorer-groups-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 55vh;
      overflow-y: auto;
    }
    .explorer-group-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem 1.15rem;
      gap: 1rem;
      transition: border-color var(--transition-fast);
    }
    .explorer-group-item:hover {
      border-color: rgba(20, 184, 166, 0.4);
    }
    .exp-group-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }
    .exp-name-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .exp-group-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .exp-group-id {
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--text-secondary);
    }
    .exp-part-count {
      font-size: 0.75rem;
      color: var(--text-tag);
      font-weight: 500;
    }
    .exp-group-actions {
      display: flex;
      gap: 0.4rem;
      flex-shrink: 0;
    }
    .btn-sm {
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all var(--transition-fast);
    }
    .btn-purple {
      background: rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.4);
      color: #c084fc;
    }
    .btn-purple:hover {
      background: rgba(168, 85, 247, 0.25);
    }
  `]
})
export class DestinationsComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  activeTab: 'whatsapp-groups' | 'whatsapp-sessions' | 'telegram' | 'queue' | 'broadcast' = 'whatsapp-groups';

  waGroups: WhatsAppGroup[] = [];
  waSessions: WhatsAppSession[] = [];
  tgDestinations: TelegramDestination[] = [];

  // WAHA Live State & QR Code
  wahaSessionsLive: any[] = [];
  wahaStatusMap: { [key: string]: { status: string; phone?: string } } = {};
  qrModalSession: string | null = null;
  qrCodeImg: string | null = null;
  qrLoading = false;
  qrStatusMessage = '';
  qrInterval: any = null;

  // WAHA Group Explorer State
  showGroupExplorer = false;
  selectedExplorerSession = 'default';
  explorerGroups: any[] = [];
  explorerSearch = '';
  explorerLoading = false;

  get filteredExplorerGroups(): any[] {
    if (!this.explorerSearch.trim()) return this.explorerGroups;
    const q = this.explorerSearch.toLowerCase();
    return this.explorerGroups.filter(g =>
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.id && g.id.toLowerCase().includes(q))
    );
  }

  // Queue State
  queueCounts: QueueCounts = { total: 0, ofertas: 0, cupons: 0, broadcast: 0 };
  queueItems: QueueItem[] = [];
  queueBusy = false;

  // Broadcast State
  broadcastSession = 'default';
  broadcastMinParticipants = 10;
  broadcastDelay = 15;
  broadcastIgnoreAnnounce = true;
  broadcastMentionAll = false;
  broadcastTemplates: string[] = ['Confira as melhores promoções de hoje no nosso grupo!'];
  broadcasting = false;
  broadcastSuccessMessage = '';

  // Edit Group Modal
  editingGroup: WhatsAppGroup | null = null;
  editingKeywordsInput = '';

  // New Item Modals
  showNewGroupModal = false;
  showNewSessionModal = false;
  showNewTgModal = false;

  newGroup: any = {
    name: '',
    id: '',
    footer_text: '',
    ml_tag: '',
    shopee_subid: '',
    amazon_tag: '',
    magalu_store: '',
    session_name: '',
    is_monitored: false,
    mirror_enabled: false
  };
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
      } else if (tab === 'queue' || tab === 'fila') {
        this.activeTab = 'queue';
        this.loadQueue();
      } else if (tab === 'broadcast' || tab === 'disparo') {
        this.activeTab = 'broadcast';
      } else {
        this.activeTab = 'whatsapp-groups';
      }
    });
    this.loadAll();
    this.loadQueue();
  }

  setTab(tab: 'whatsapp-groups' | 'whatsapp-sessions' | 'telegram' | 'queue' | 'broadcast') {
    this.activeTab = tab;
    if (tab === 'queue') {
      this.loadQueue();
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  loadAll() {
    this.api.getWhatsAppGroups().subscribe({
      next: (data) => this.waGroups = data,
      error: () => { }
    });
    this.api.getWhatsAppSessions().subscribe({
      next: (data) => {
        this.waSessions = data;
        this.loadWahaSessionsLive();
      },
      error: () => { }
    });
    this.api.getTelegramDestinations().subscribe({
      next: (data) => this.tgDestinations = data,
      error: () => { }
    });
  }

  // --- WAHA SESSIONS LIVE METHODS ---
  loadWahaSessionsLive() {
    this.api.getWahaSessions().subscribe({
      next: (res: any) => {
        const liveList = res?.sessions || [];
        this.wahaSessionsLive = liveList;
        this.wahaStatusMap = {};
        for (const s of liveList) {
          const sName = s.name || s.id;
          const phone = s.me?.id ? s.me.id.split('@')[0] : (s.phone || '');
          this.wahaStatusMap[sName] = {
            status: s.status || 'UNKNOWN',
            phone: phone
          };
        }
      },
      error: () => { }
    });
  }

  refreshWahaSessions() {
    this.loadAll();
  }

  getWahaStatusBadgeClass(sessionName: string): string {
    const s = this.wahaStatusMap[sessionName];
    const status = s?.status?.toUpperCase();
    if (status === 'WORKING') return 'badge badge-success';
    if (status === 'SCAN_QR_CODE') return 'badge badge-warning';
    if (status === 'STARTING') return 'badge badge-info';
    if (status === 'STOPPED') return 'badge badge-secondary';
    return 'badge badge-secondary';
  }

  getWahaStatusLabel(sessionName: string): string {
    const s = this.wahaStatusMap[sessionName];
    const status = s?.status?.toUpperCase();
    if (status === 'WORKING') return 'Conectado (Online)';
    if (status === 'SCAN_QR_CODE') return 'Aguardando QR Code';
    if (status === 'STARTING') return 'Iniciando Chip...';
    if (status === 'STOPPED') return 'Parado (Desconectado)';
    if (status === 'FAILED') return 'Falha na Conexão';
    return s?.status || 'Desconhecido';
  }

  startWahaSession(sessionName: string) {
    this.api.startWahaSession(sessionName).subscribe({
      next: () => {
        setTimeout(() => this.loadWahaSessionsLive(), 1500);
      }
    });
  }

  stopWahaSession(sessionName: string) {
    this.api.stopWahaSession(sessionName).subscribe({
      next: () => {
        setTimeout(() => this.loadWahaSessionsLive(), 1000);
      }
    });
  }

  restartWahaSession(sessionName: string) {
    this.api.restartWahaSession(sessionName).subscribe({
      next: () => {
        setTimeout(() => this.loadWahaSessionsLive(), 2000);
      }
    });
  }

  logoutWahaSession(sessionName: string) {
    this.api.logoutWahaSession(sessionName).subscribe({
      next: () => {
        setTimeout(() => this.loadWahaSessionsLive(), 1500);
      }
    });
  }

  // --- QR CODE MODAL METHODS ---
  openQrModal(sessionName: string) {
    this.qrModalSession = sessionName;
    this.qrCodeImg = null;
    this.qrLoading = true;
    this.qrStatusMessage = '';
    this.fetchQrCode(sessionName);

    if (this.qrInterval) clearInterval(this.qrInterval);
    this.qrInterval = setInterval(() => {
      if (!this.qrModalSession) {
        clearInterval(this.qrInterval);
        return;
      }
      this.api.getWahaSessions().subscribe({
        next: (res: any) => {
          const sessions = res?.sessions || [];
          const current = sessions.find((s: any) => (s.name || s.id) === this.qrModalSession);
          if (current && current.status?.toUpperCase() === 'WORKING') {
            this.closeQrModal();
            this.loadAll();
          } else if (current && current.status?.toUpperCase() === 'SCAN_QR_CODE') {
            this.fetchQrCode(this.qrModalSession!);
          }
        }
      });
    }, 4000);
  }

  closeQrModal() {
    this.qrModalSession = null;
    this.qrCodeImg = null;
    if (this.qrInterval) {
      clearInterval(this.qrInterval);
      this.qrInterval = null;
    }
  }

  fetchQrCode(sessionName: string) {
    this.api.getWahaSessionQr(sessionName).subscribe({
      next: (res: any) => {
        this.qrLoading = false;
        if (res?.image) {
          this.qrCodeImg = res.image.startsWith('data:') ? res.image : `data:image/png;base64,${res.image}`;
        } else if (res?.qr) {
          this.qrCodeImg = res.qr.startsWith('data:') ? res.qr : `data:image/png;base64,${res.qr}`;
        } else {
          this.qrStatusMessage = 'Sessão já autenticada ou QR Code indisponível.';
        }
      },
      error: () => {
        this.qrLoading = false;
        this.qrStatusMessage = 'Não foi possível carregar o QR Code. Inicie a sessão primeiro.';
      }
    });
  }

  // --- WAHA GROUP EXPLORER METHODS ---
  openGroupExplorer(sessionName?: string) {
    const sName = sessionName || (this.waSessions.length > 0 ? this.waSessions[0].name : 'default');
    this.selectedExplorerSession = sName;
    this.showGroupExplorer = true;
    this.loadWahaExplorerGroups(sName);
  }

  loadWahaExplorerGroups(sessionName: string) {
    this.explorerLoading = true;
    this.api.getWahaGroups(sessionName).subscribe({
      next: (res: any) => {
        this.explorerGroups = res?.groups || [];
        this.explorerLoading = false;
      },
      error: () => {
        this.explorerGroups = [];
        this.explorerLoading = false;
      }
    });
  }

  importGroupAction(group: any, action: 'destination' | 'monitored') {
    this.api.importWahaGroup({
      session_name: this.selectedExplorerSession,
      group_id: group.id,
      name: group.name || group.id,
      action: action
    }).subscribe({
      next: () => {
        group.is_registered = true;
        if (action === 'monitored') group.is_monitored = true;
        this.loadAll();
      }
    });
  }

  toggleSession(s: WhatsAppSession) {
    this.api.updateWhatsAppSession(s.id_db || s.name, { active: s.active }).subscribe();
  }

  // --- EDIT GROUP MODAL ---
  openEditGroup(g: WhatsAppGroup) {
    this.editingGroup = {
      ...g,
      active: g.active !== false,
      ml_tag: g.ml_tag || '',
      shopee_subid: g.shopee_subid || '',
      amazon_tag: g.amazon_tag || '',
      magalu_store: g.magalu_store || '',
      session_name: g.session_name || '',
      is_monitored: !!g.is_monitored,
      mirror_enabled: !!g.mirror_enabled,
      target_whatsapp_groups: g.target_whatsapp_groups || []
    };
    this.editingKeywordsInput = (g.keywords || []).join(', ');
  }

  isGroupTargetSelected(targetId: string): boolean {
    if (!this.editingGroup?.target_whatsapp_groups) return false;
    return this.editingGroup.target_whatsapp_groups.includes(targetId);
  }

  toggleGroupTarget(targetId: string) {
    if (!this.editingGroup) return;
    if (!this.editingGroup.target_whatsapp_groups) {
      this.editingGroup.target_whatsapp_groups = [];
    }
    const idx = this.editingGroup.target_whatsapp_groups.indexOf(targetId);
    if (idx >= 0) {
      this.editingGroup.target_whatsapp_groups.splice(idx, 1);
    } else {
      this.editingGroup.target_whatsapp_groups.push(targetId);
    }
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
      footer_text: this.editingGroup.footer_text?.trim() || '',
      ml_tag: this.editingGroup.ml_tag?.trim() || '',
      shopee_subid: this.editingGroup.shopee_subid?.trim() || '',
      amazon_tag: this.editingGroup.amazon_tag?.trim() || '',
      magalu_store: this.editingGroup.magalu_store?.trim() || '',
      session_name: this.editingGroup.session_name?.trim() || '',
      is_monitored: !!this.editingGroup.is_monitored,
      mirror_enabled: !!this.editingGroup.mirror_enabled,
      target_whatsapp_groups: this.editingGroup.target_whatsapp_groups || []
    }).subscribe({
      next: () => {
        this.editingGroup = null;
        this.loadAll();
      }
    });
  }

  // --- NEW GROUP MODAL ---
  openNewGroupModal() {
    this.newGroup = {
      name: '',
      id: '',
      footer_text: '',
      ml_tag: '',
      shopee_subid: '',
      amazon_tag: '',
      magalu_store: '',
      session_name: '',
      is_monitored: false,
      mirror_enabled: false
    };
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
      ml_tag: this.newGroup.ml_tag?.trim() || '',
      shopee_subid: this.newGroup.shopee_subid?.trim() || '',
      amazon_tag: this.newGroup.amazon_tag?.trim() || '',
      magalu_store: this.newGroup.magalu_store?.trim() || '',
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

  // --- QUEUE METHODS ---
  loadQueue() {
    this.api.getQueueCounts().subscribe({
      next: (counts: QueueCounts) => this.queueCounts = counts,
      error: () => { }
    });
    this.api.getQueueItems(30).subscribe({
      next: (items: QueueItem[]) => this.queueItems = items,
      error: () => { }
    });
  }

  dispatchNextQueue() {
    this.queueBusy = true;
    this.api.dispatchNextQueue().subscribe({
      next: () => {
        this.queueBusy = false;
        this.loadQueue();
      },
      error: () => {
        this.queueBusy = false;
      }
    });
  }

  trimQueue() {
    this.api.trimQueue(20).subscribe({
      next: () => this.loadQueue()
    });
  }

  clearQueue() {
    this.api.clearQueue().subscribe({
      next: () => this.loadQueue()
    });
  }

  // --- BROADCAST METHODS ---
  addBroadcastTemplate() {
    this.broadcastTemplates.push('');
  }

  removeBroadcastTemplate(index: number) {
    if (this.broadcastTemplates.length > 1) {
      this.broadcastTemplates.splice(index, 1);
    }
  }

  startBroadcast() {
    const validTemplates = this.broadcastTemplates.map(t => t.trim()).filter(t => t.length > 0);
    if (validTemplates.length === 0) return;

    this.broadcasting = true;
    this.broadcastSuccessMessage = '';

    this.api.wahaBroadcast({
      session: this.broadcastSession,
      templates: validTemplates,
      min_participants: this.broadcastMinParticipants,
      delay_seconds: this.broadcastDelay,
      ignore_announce: this.broadcastIgnoreAnnounce,
      mention_all: this.broadcastMentionAll
    }).subscribe({
      next: (res: any) => {
        this.broadcasting = false;
        this.broadcastSuccessMessage = `Campanha iniciada com sucesso! ${res.total_targets || 0} grupos adicionados à fila de disparo.`;
        this.loadQueue();
        setTimeout(() => this.broadcastSuccessMessage = '', 6000);
      },
      error: (err: any) => {
        this.broadcasting = false;
        this.broadcastSuccessMessage = `Erro ao iniciar campanha: ${err.message || 'Verifique se a sessão WAHA está ativa.'}`;
      }
    });
  }
}
