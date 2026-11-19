import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

interface SystemNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-primary);
    }

    /* SIDEBAR */
    .sidebar {
      width: 250px;
      min-width: 250px;
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 50;
    }

    .sidebar-brand {
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0d9488 0%, #2563eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(13, 148, 136, 0.3);
      flex-shrink: 0;
    }

    .brand-icon-svg {
      width: 18px !important;
      height: 18px !important;
      color: #ffffff;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .brand-name .highlight {
      color: var(--accent-cyan);
    }

    .brand-tagline {
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }

    /* NAV */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .nav-link:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .nav-link.active {
      background-color: rgba(20, 184, 166, 0.15);
      border-left: 3px solid var(--accent-teal);
      color: var(--accent-teal);
    }

    .nav-link-featured {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .badge-new {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      margin-left: auto;
    }

    /* COLLAPSIBLE NAV GROUPS */
    .nav-group {
      margin-bottom: 0.35rem;
    }

    .nav-group-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.75rem;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      transition: all var(--transition-fast);
    }

    .nav-group-header:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .group-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .chevron-icon {
      width: 14px !important;
      height: 14px !important;
      color: var(--text-muted);
      transition: transform 200ms ease;
    }

    .chevron-icon.rotated {
      transform: rotate(90deg);
      color: var(--accent-cyan);
    }

    .nav-sub-items {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-left: 0.9rem;
      padding-left: 0.65rem;
      border-left: 1px solid var(--border-color);
      margin-top: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .sub-link {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 0.825rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .sub-link:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .sub-link.active {
      color: var(--text-primary);
      background-color: rgba(56, 189, 248, 0.12);
      font-weight: 700;
    }

    .sub-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .sub-link:hover .sub-dot,
    .sub-link.active .sub-dot {
      background-color: var(--accent-cyan);
      box-shadow: 0 0 6px var(--accent-cyan);
    }

    .nav-icon {
      width: 17px !important;
      height: 17px !important;
      color: var(--text-muted);
    }

    .nav-link:hover .nav-icon,
    .nav-link.active .nav-icon {
      color: var(--accent-teal);
    }

    .icon-teal { color: #14b8a6 !important; }
    .icon-green { color: #10b981 !important; }
    .icon-blue { color: #3b82f6 !important; }
    .icon-purple { color: #a855f7 !important; }
    .icon-yellow { color: #f59e0b !important; }
    .icon-orange { color: #f97316 !important; }
    .icon-pink { color: #ec4899 !important; }

    /* PROMO CARD */
    .sidebar-promo-card {
      margin: 0.75rem;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%);
      border: 1px solid var(--border-color);
    }

    .promo-brand {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent-teal);
      margin-bottom: 0.25rem;
    }

    .promo-brand span { color: var(--text-primary); }

    .promo-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .promo-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* CONTENT WRAPPER */
    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* TOPBAR */
    .topbar {
      height: 60px;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      gap: 1.5rem;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .topbar-search {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.45rem 0.85rem;
      width: 360px;
      max-width: 100%;
    }

    .search-icon {
      width: 15px !important;
      height: 15px !important;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .topbar-search input {
      background: transparent;
      border: none;
      padding: 0;
      font-size: 0.825rem;
      color: var(--text-primary);
      outline: none;
      width: 100%;
    }

    .search-shortcut {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.1rem 0.35rem;
      background-color: var(--bg-primary);
    }

    .topbar-motto {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 0.3rem 0.85rem;
    }

    .motto-logo {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent-teal);
    }

    .motto-text {
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--accent-danger);
    }

    .status-pill.online {
      border-color: rgba(16, 185, 129, 0.4);
      color: var(--accent-success-text);
    }

    .status-pill.online .status-indicator {
      background-color: var(--accent-success);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
    }

    .topbar-action-btn {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      position: relative;
      transition: all var(--transition-fast);
    }

    .topbar-action-btn:hover {
      background-color: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--border-subtle);
    }

    .theme-icon, .notif-icon {
      width: 17px !important;
      height: 17px !important;
    }

    .notif-wrap {
      position: relative;
    }

    .notif-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background-color: #ef4444;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* NOTIFICATION POPOVER */
    .notif-dropdown {
      position: absolute;
      top: 45px;
      right: 0;
      width: 320px;
      z-index: 100;
      padding: 1rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-subtle);
    }

    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .notif-header h3 {
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .btn-clear-notif {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.75rem;
      cursor: pointer;
    }

    .btn-clear-notif:hover {
      color: var(--accent-teal);
    }

    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 280px;
      overflow-y: auto;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.4rem;
      border-radius: var(--radius-sm);
      background-color: var(--bg-primary);
    }

    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .notif-dot.green { background-color: #10b981; }
    .notif-dot.blue { background-color: #3b82f6; }
    .notif-dot.yellow { background-color: #f59e0b; }

    .notif-content {
      flex: 1;
    }

    .notif-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-primary);
      display: block;
    }

    .notif-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.3;
    }

    .notif-time {
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      display: block;
    }

    .notif-empty {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: center;
      padding: 1rem 0;
    }

    .user-profile-widget {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding-left: 0.5rem;
      border-left: 1px solid var(--border-color);
    }

    .user-avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-fullname {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .logout-link-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.78rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .logout-link-btn:hover {
      color: #f87171;
    }

    .btn-mobile-menu {
      display: none;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .hamburger-icon {
      width: 20px;
      height: 20px;
    }
    .mobile-brand-title {
      display: none;
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }
    .mobile-brand-title .highlight {
      color: var(--accent-teal);
    }
    .mobile-close-btn {
      display: none;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 1rem;
      width: 30px;
      height: 30px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
    }
    .mobile-sidebar-backdrop {
      display: none;
    }
    .mobile-bottom-bar {
      display: none;
    }

    .page-content {
      flex: 1;
      padding: 1.75rem 2rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 900px) {
      .btn-mobile-menu {
        display: flex;
      }
      .mobile-brand-title {
        display: block;
      }
      .mobile-close-btn {
        display: flex;
      }
      .mobile-sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 998;
      }
      .sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: 280px;
        z-index: 999;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: none;
      }
      .sidebar.mobile-open {
        transform: translateX(0);
        box-shadow: 10px 0 25px rgba(0, 0, 0, 0.3);
      }
      .sidebar-brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .topbar {
        padding: 0 1rem;
        gap: 0.75rem;
      }
      .topbar-motto {
        display: none;
      }
      .topbar-search {
        display: none;
      }
      .user-fullname {
        display: none;
      }
      .page-content {
        padding: 1rem;
        padding-bottom: 5.5rem;
      }

      .mobile-bottom-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: var(--bg-card);
        border-top: 1px solid var(--border-color);
        z-index: 900;
        align-items: center;
        justify-content: space-around;
        padding: 0.25rem 0.5rem;
        box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
      }
      .bottom-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: var(--text-muted);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.68rem;
        font-weight: 500;
        gap: 2px;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }
      .bottom-nav-item svg {
        width: 20px;
        height: 20px;
      }
      .bottom-nav-item.active,
      .bottom-nav-item:hover {
        color: var(--accent-teal);
      }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  theme = inject(ThemeService);
  auth = inject(AuthService);
  api = inject(ApiService);
  router = inject(Router);

  mobileSidebarOpen = false;
  isBotRunning = false;
  userName = 'Usuário';
  userInitial = 'U';

  // Collapsible Accordion Navigation Groups
  openGroups: { [key: string]: boolean } = {
    channels: true,
    content: true,
    integrations: true,
    reports: false,
    system: false
  };

  toggleGroup(group: string) {
    this.openGroups[group] = !this.openGroups[group];
  }

  showNotifications = false;
  notifications: SystemNotification[] = [
    { id: '1', title: 'Telegram Conectado', description: 'Sessão do Telegram ativa e conectada.', time: 'Há 5 min', type: 'success' },
    { id: '2', title: 'WhatsApp Conectado', description: 'Chips e grupos sincronizados via WAHA.', time: 'Há 12 min', type: 'info' },
    { id: '3', title: 'Canais Prontos', description: 'Filtros e tags de afiliados configurados por grupo.', time: 'Hoje', type: 'success' }
  ];

  get unreadCount(): number {
    return this.notifications.length;
  }

  sessionName = 'Sessão individual';
  private statusEventSource: EventSource | null = null;

  ngOnInit() {
    this.refreshUser();
    this.initStatusStream();
  }

  ngOnDestroy() {
    this.stopStatusStream();
  }

  initStatusStream() {
    this.stopStatusStream();
    const url = this.api.getBotStatusStreamUrl();
    if (!url) {
      this.checkBotStatus();
      return;
    }

    try {
      this.statusEventSource = new EventSource(url);
      this.statusEventSource.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res && typeof res.is_running === 'boolean') {
            this.isBotRunning = res.is_running;
            if (res.session_name) {
              this.sessionName = res.session_name;
            }
          }
        } catch (e) {
          // Ignore parse errors or comments
        }
      };

      this.statusEventSource.onerror = () => {
        // EventSource automatically retries connection in the background
      };
    } catch (e) {
      this.checkBotStatus();
    }
  }

  stopStatusStream() {
    if (this.statusEventSource) {
      this.statusEventSource.close();
      this.statusEventSource = null;
    }
  }

  refreshUser() {
    const user = this.auth.currentUser();
    if (user && user.full_name) {
      this.userName = user.full_name;
      this.userInitial = user.full_name.charAt(0).toUpperCase();
    }
  }

  checkBotStatus() {
    this.api.getBotStatus().subscribe({
      next: (res) => {
        this.isBotRunning = res.is_running;
        if (res.session_name) {
          this.sessionName = res.session_name;
        }
      },
      error: () => {}
    });
  }

  toggleBot() {
    const targetState = !this.isBotRunning;
    this.isBotRunning = targetState; // Optimistic update

    if (!targetState) {
      this.api.stopBot().subscribe({
        next: () => {
          this.isBotRunning = false;
          setTimeout(() => this.checkBotStatus(), 800);
        },
        error: () => {
          this.checkBotStatus();
        }
      });
    } else {
      this.api.startBot().subscribe({
        next: (res) => {
          this.isBotRunning = true;
          if (res.session) {
            this.sessionName = res.session;
          }
          setTimeout(() => this.checkBotStatus(), 800);
        },
        error: () => {
          this.checkBotStatus();
        }
      });
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  clearNotifications() {
    this.notifications = [];
    this.showNotifications = false;
  }

  goToTester() {
    this.router.navigate(['/tester']);
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
  }

  logout() {
    this.auth.logout();
  }
}
