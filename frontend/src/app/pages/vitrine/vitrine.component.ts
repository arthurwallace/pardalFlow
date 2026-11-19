import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { VitrineProduct } from '../../core/models';

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vitrine.component.html',
  styles: [`
    .vitrine-page {
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
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 1.25rem;
    }
    .action-info {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .stat-pill {
      font-size: 0.85rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }
    .stat-pill.success strong { color: #10b981; }
    .stat-pill.warning strong { color: #f59e0b; }
    .action-buttons {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .btn-danger-outline {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-danger-outline:hover:not(:disabled) {
      background: #ef4444;
      color: #fff;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .data-table th, .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .data-table th {
      font-weight: 700;
      color: var(--text-sub, #64748b);
      background: rgba(0,0,0,0.02);
    }
    .photo-cell { width: 60px; }
    .prod-thumb {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
    }
    .no-thumb {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .title-cell { max-width: 350px; }
    .prod-link {
      color: var(--text-main, #0f172a);
      text-decoration: none;
      font-weight: 600;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .prod-link:hover { color: var(--teal-accent, #14b8a6); }
    .price-cell { font-weight: 700; }
    .text-green { color: #10b981; }
    .category-tag-pill {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      color: #475569;
    }
    .btn-sm-view {
      text-decoration: none;
      font-size: 1.1rem;
    }
    .loading-state, .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-sub, #64748b);
    }
    .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal {
      width: 90%;
      max-width: 500px;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .modal-header h3 { margin: 0; font-size: 1.2rem; }
    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .modal-desc {
      font-size: 0.85rem;
      color: var(--text-sub, #64748b);
      margin: 0 0 1rem 0;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
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
    }
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
  `]
})
export class VitrineComponent implements OnInit {
  private api = inject(ApiService);

  loading = false;
  searching = false;
  generating = false;
  showSearchModal = false;
  searchKeyword = '';
  searchCategory = 'noivas';
  toastMsg = '';
  toastSuccess = true;

  products: VitrineProduct[] = [];

  get activeCount(): number {
    return this.products.filter(p => p.status === 'active').length;
  }

  get pausedCount(): number {
    return this.products.filter(p => p.status === 'paused').length;
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.api.getVitrine().subscribe({
      next: (res) => {
        this.loading = false;
        this.products = res.products || [];
      },
      error: () => {
        this.loading = false;
        this.showToast('Erro ao carregar catálogo da vitrine', false);
      }
    });
  }

  openSearchModal() {
    this.searchKeyword = '';
    this.showSearchModal = true;
  }

  executeSearch() {
    if (!this.searchKeyword.trim()) return;
    this.searching = true;
    this.api.searchAndImportShopee(this.searchKeyword.trim(), this.searchCategory).subscribe({
      next: (res) => {
        this.searching = false;
        this.showSearchModal = false;
        this.showToast(res.message || 'Produtos importados com sucesso!', true);
        this.loadProducts();
      },
      error: () => {
        this.searching = false;
        this.showToast('Erro ao buscar produtos na Shopee', false);
      }
    });
  }

  pauseAll() {
    this.api.pauseAllVitrine().subscribe({
      next: (res) => {
        this.showToast(res.message || 'Produtos pausados', true);
        this.loadProducts();
      },
      error: () => this.showToast('Erro ao pausar produtos', false)
    });
  }

  clearAll() {
    if (confirm('Tem certeza que deseja zerar todos os produtos da vitrine?')) {
      this.api.clearVitrine().subscribe({
        next: (res) => {
          this.showToast(res.message || 'Vitrine zerada', true);
          this.loadProducts();
        },
        error: () => this.showToast('Erro ao limpar vitrine', false)
      });
    }
  }

  generateOffers() {
    this.generating = true;
    this.api.generateVitrineOffers('noivas', 5).subscribe({
      next: (res) => {
        this.generating = false;
        this.showToast(res.message || 'Ofertas enfileiradas com sucesso!', true);
      },
      error: () => {
        this.generating = false;
        this.showToast('Erro ao enfileirar ofertas da vitrine', false);
      }
    });
  }

  showToast(msg: string, success: boolean) {
    this.toastMsg = msg;
    this.toastSuccess = success;
    setTimeout(() => this.toastMsg = '', 3500);
  }
}
