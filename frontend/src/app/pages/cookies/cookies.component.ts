import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PlatformCookie } from '../../core/models';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cookies.component.html',
  styles: [`
    .cookies-page {
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
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--teal-accent, #14b8a6);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
      display: block;
    }
    .main-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }
    .highlight-text {
      color: var(--accent-cyan);
    }
    .subtitle {
      font-size: 0.925rem;
      color: var(--text-secondary);
      margin: 0;
      max-width: 800px;
    }
    .webhook-banner {
      display: flex;
      gap: 1.25rem;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    .banner-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(20, 184, 166, 0.15);
      color: var(--accent-teal);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .banner-icon svg {
      width: 24px;
      height: 24px;
    }
    .banner-content h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 0.25rem 0;
      color: var(--text-primary);
    }
    .banner-content p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 0.75rem 0;
    }
    .webhook-url-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-input);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .webhook-url-box code {
      font-size: 0.85rem;
      color: var(--accent-cyan);
      font-weight: 600;
      word-break: break-all;
    }
    .btn-copy {
      background: var(--teal-accent, #14b8a6);
      color: #fff;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .platform-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-header {
      margin-bottom: 0.75rem;
    }
    .platform-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .platform-logo {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      color: #fff;
    }
    .platform-logo.ml { background: #ffe600; color: #2d3277; }
    .platform-logo.amz { background: #ff9900; color: #111; }
    .platform-logo.magalu { background: #0086ff; color: #fff; }
    .platform-logo.shopee { background: #ee4d2d; color: #fff; }
    .platform-meta h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 0.25rem 0;
    }
    .card-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }
    .code-textarea {
      width: 100%;
      font-family: monospace;
      font-size: 0.8rem;
      border-radius: var(--radius-md);
      padding: 0.65rem;
      background: var(--bg-input) !important;
      color: var(--text-primary) !important;
      border: 1px solid var(--border-color) !important;
      resize: vertical;
      box-sizing: border-box;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }
    .meta-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.85rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      color: #fff;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
  `]
})
export class CookiesComponent implements OnInit {
  private api = inject(ApiService);

  loading = false;
  saving = false;
  copied = false;
  toastMsg = '';
  toastSuccess = true;

  mlCookie: PlatformCookie = { platform: 'mercadolivre', has_cookies: false, cookies: '', status: 'pending' };
  amzCookie: PlatformCookie = { platform: 'amazon', has_cookies: false, cookies: '', status: 'pending' };
  magaluCookie: PlatformCookie = { platform: 'magalu', has_cookies: false, cookies: '', status: 'pending' };
  shopeeCookie: PlatformCookie = { platform: 'shopee', has_cookies: false, cookies: '', status: 'pending' };

  webhookUrl = '';

  ngOnInit() {
    if (typeof window !== 'undefined' && window.location) {
      this.webhookUrl = `${window.location.origin}/api/v1/cookies/webhook/atualizar-cookies-loja`;
    } else {
      this.webhookUrl = 'http://localhost:8000/api/v1/cookies/webhook/atualizar-cookies-loja';
    }
    this.loadCookies();
  }

  loadCookies() {
    this.loading = true;
    this.api.getCookies().subscribe({
      next: (list) => {
        this.loading = false;
        for (const item of list) {
          if (item.platform === 'mercadolivre') this.mlCookie = item;
          if (item.platform === 'amazon') this.amzCookie = item;
          if (item.platform === 'magalu') this.magaluCookie = item;
          if (item.platform === 'shopee') this.shopeeCookie = item;
        }
      },
      error: () => {
        this.loading = false;
        this.showToast('Erro ao carregar cookies das plataformas', false);
      }
    });
  }

  savePlatform(platform: string, cookies: string) {
    this.saving = true;
    this.api.saveCookie(platform, cookies).subscribe({
      next: () => {
        this.saving = false;
        this.showToast(`Cookies da loja ${platform.toUpperCase()} salvos com sucesso!`, true);
        this.loadCookies();
      },
      error: () => {
        this.saving = false;
        this.showToast(`Falha ao salvar cookies de ${platform}`, false);
      }
    });
  }

  copyWebhookUrl() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(this.webhookUrl);
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    }
  }

  showToast(msg: string, success: boolean) {
    this.toastMsg = msg;
    this.toastSuccess = success;
    setTimeout(() => this.toastMsg = '', 3500);
  }
}
