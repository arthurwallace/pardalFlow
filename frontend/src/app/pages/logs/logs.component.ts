import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logs-page">
      <!-- HEADER CATEGORY & TITLE -->
      <div class="page-header">
        <div>
          <span class="category-tag">TELEMETRIA E AUDITORIA</span>
          <h1 class="main-title">Logs & <span class="highlight-text">Eventos em Tempo Real</span></h1>
          <p class="subtitle">
            Acompanhe em tempo real (Server-Sent Events) as mensagens capturadas dos canais ativos, conversões de links e entregas nos grupos.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="toggleStreaming()">
            <span class="stream-dot" [class.active]="isStreaming"></span>
            <span>{{ isStreaming ? 'Pausar Streaming' : 'Retomar Streaming' }}</span>
          </button>
          <button class="btn btn-secondary" (click)="clearLogs()">
            <span>Limpar Tela</span>
          </button>
        </div>
      </div>

      <!-- STREAMING STATUS BAR -->
      <div class="stream-status-bar">
        <div class="status-left">
          <span class="live-badge" [class.live-active]="isStreaming" [class.live-paused]="!isStreaming">
            <span class="pulse-indicator"></span>
            {{ isStreaming ? 'STREAMING ATIVO (SSE)' : 'STREAMING PAUSADO' }}
          </span>
          <span class="filter-tip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tip-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            Exibindo exclusivamente mensagens de canais com monitoramento ativo.
          </span>
        </div>
        <span class="log-count">{{ logs.length }} eventos capturados</span>
      </div>

      <!-- LOG TERMINAL CONTAINER -->
      <div class="card terminal-card">
        <div class="terminal-head">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <span class="terminal-title">pardalbot&#64;telethon-listener: stdout (live-stream)</span>
          <span class="terminal-badge">{{ connectionState }}</span>
        </div>

        <div class="terminal-body" #terminalBody>
          <div *ngIf="logs.length === 0" class="log-empty">
            Aguardando eventos dos canais com monitoramento ativo...
          </div>
          <div *ngFor="let log of logs; trackBy: trackByFn" class="log-line">
            <span class="log-time">[{{ log.timestamp | date:'HH:mm:ss' }}]</span>
            <span 
              class="log-msg" 
              [class.text-green]="log.message.includes('✅')" 
              [class.text-red]="log.message.includes('❌') || log.message.includes('Erro')" 
              [class.text-blue]="log.message.includes('📩') || log.message.includes('Iniciando')"
              [class.text-yellow]="log.message.includes('⚠️')"
              [class.text-teal]="log.message.includes('🤖')"
            >
              {{ log.message }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logs-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .stream-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
      display: inline-block;
    }

    .stream-dot.active {
      background: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }

    /* STREAM STATUS BAR */
    .stream-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.65rem 1.15rem;
      font-size: 0.825rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .status-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.725rem;
      font-weight: 800;
      padding: 0.2rem 0.65rem;
      border-radius: var(--radius-full);
      letter-spacing: 0.04em;
    }

    .live-active {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }

    .live-paused {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }

    .pulse-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }

    .filter-tip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .tip-icon {
      width: 14px;
      height: 14px;
      color: #14b8a6;
      flex-shrink: 0;
    }

    .log-count {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
    }

    /* TERMINAL CARD */
    .terminal-card {
      background-color: #070c18;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 0;
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .terminal-head {
      background-color: #0b1222;
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .terminal-dots {
      display: flex;
      gap: 0.4rem;
    }

    .dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
    }

    .dot.red { background-color: #ef4444; }
    .dot.yellow { background-color: #f59e0b; }
    .dot.green { background-color: #10b981; }

    .terminal-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      color: #94a3b8;
      flex: 1;
    }

    .terminal-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      text-transform: uppercase;
    }

    .terminal-body {
      padding: 1.25rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.7;
      max-height: 580px;
      min-height: 380px;
      overflow-y: auto;
      background-color: #050812;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .log-line {
      display: flex;
      gap: 0.75rem;
      word-break: break-all;
    }

    .log-time {
      color: #38bdf8;
      font-weight: 600;
      flex-shrink: 0;
    }

    .log-msg {
      color: var(--text-primary);
    }

    .text-green { color: #34d399 !important; }
    .text-red { color: #f87171 !important; }
    .text-blue { color: #60a5fa !important; }
    .text-yellow { color: #fbbf24 !important; }
    .text-teal { color: #2dd4bf !important; }

    .log-empty {
      color: var(--text-muted);
      font-style: italic;
      padding: 2rem 0;
      text-align: center;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .header-actions {
        flex-direction: column;
      }
      .header-actions button {
        width: 100%;
        justify-content: center;
      }
      .stream-status-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .status-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class LogsComponent implements OnInit, OnDestroy, AfterViewChecked {
  api = inject(ApiService);
  
  @ViewChild('terminalBody') terminalBody!: ElementRef;

  logs: LogEntry[] = [];
  isStreaming = true;
  connectionState = 'CONECTANDO...';
  private eventSource: EventSource | null = null;
  private shouldAutoScroll = true;

  ngOnInit() {
    this.startStreaming();
  }

  ngOnDestroy() {
    this.stopStreaming();
  }

  ngAfterViewChecked() {
    if (this.shouldAutoScroll && this.terminalBody) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      this.terminalBody.nativeElement.scrollTop = this.terminalBody.nativeElement.scrollHeight;
    } catch (err) {}
  }

  startStreaming() {
    this.stopStreaming();
    this.isStreaming = true;
    this.connectionState = 'CONECTANDO...';

    const url = this.api.getLogsStreamUrl();
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.connectionState = 'ONLINE (SSE)';
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.message) {
            this.addLog(data.message);
          }
        } catch (e) {
          if (event.data) {
            this.addLog(event.data);
          }
        }
      };

      this.eventSource.onerror = () => {
        this.connectionState = 'RECONECTANDO...';
      };
    } catch (e) {
      this.connectionState = 'ERRO SSE';
      this.loadFallbackLogs();
    }
  }

  stopStreaming() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isStreaming = false;
    this.connectionState = 'PAUSADO';
  }

  toggleStreaming() {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      this.startStreaming();
    }
  }

  addLog(rawMsg: string) {
    let cleanMsg = rawMsg;
    let time = new Date();

    // Parse [YYYY-MM-DD HH:MM:SS] if present
    const match = rawMsg.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)$/);
    if (match) {
      time = new Date(match[1].replace(' ', 'T'));
      cleanMsg = match[2];
    }

    this.logs.push({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: time,
      message: cleanMsg
    });

    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  loadFallbackLogs() {
    this.api.getLogs(60).subscribe({
      next: (res) => {
        this.logs = (res.logs || []).reverse().map(l => ({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          message: l
        }));
      }
    });
  }

  clearLogs() {
    this.logs = [];
  }

  trackByFn(index: number, item: LogEntry): string {
    return item.id;
  }
}
