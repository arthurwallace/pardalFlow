import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import {
  Channel, WhatsAppGroup, TelegramDestination, WhatsAppSession,
  Settings, DashboardMetrics, AnalyticsSummary, BotStatus, DispatchedOffersResponse, DispatchedOffer
} from '../models';

function resolveApiBase(): string {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '4200') {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = resolveApiBase();

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  // Metrics
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.base}/metrics/dashboard`, { headers: this.headers() });
  }

  getDispatchedOffers(limit = 50, skip = 0): Observable<DispatchedOffersResponse> {
    return this.http.get<DispatchedOffersResponse>(`${this.base}/metrics/dispatched-offers?limit=${limit}&skip=${skip}`, { headers: this.headers() });
  }

  getLogsStreamUrl(): string {
    const token = this.auth.getToken() || '';
    return `${this.base}/bot/logs/stream?token=${encodeURIComponent(token)}`;
  }

  // Bot Control
  getBotStatus(): Observable<BotStatus> {
    return this.http.get<BotStatus>(`${this.base}/bot/status`, { headers: this.headers() });
  }

  startBot(): Observable<{ message: string; is_running: boolean; session?: string }> {
    return this.http.post<{ message: string; is_running: boolean }>(`${this.base}/bot/start`, {}, { headers: this.headers() });
  }

  stopBot(): Observable<{ message: string; is_running: boolean }> {
    return this.http.post<{ message: string; is_running: boolean }>(`${this.base}/bot/stop`, {}, { headers: this.headers() });
  }

  getLogs(limit = 150): Observable<{ user_id: string; logs: string[] }> {
    return this.http.get<{ user_id: string; logs: string[] }>(`${this.base}/bot/logs?limit=${limit}`, { headers: this.headers() });
  }

  // Telegram Session Management
  getTelegramSessionStatus(): Observable<{
    is_connected: boolean;
    session_exists: boolean;
    account_name: string;
    phone: string;
    username: string;
    session_file: string;
    api_id: string;
    api_hash_masked: string;
  }> {
    return this.http.get<any>(`${this.base}/bot/telegram/session-status`, { headers: this.headers() });
  }

  sendTelegramCode(data: { phone: string; api_id?: string; api_hash?: string }): Observable<{
    success: boolean;
    message: string;
    phone_code_hash: string;
    phone: string;
  }> {
    return this.http.post<any>(`${this.base}/bot/telegram/send-code`, data, { headers: this.headers() });
  }

  verifyTelegramCode(data: {
    phone: string;
    code: string;
    phone_code_hash: string;
    password?: string;
    api_id?: string;
    api_hash?: string;
  }): Observable<{
    success: boolean;
    needs_password?: boolean;
    message: string;
    account_name?: string;
    phone?: string;
    username?: string;
  }> {
    return this.http.post<any>(`${this.base}/bot/telegram/verify-code`, data, { headers: this.headers() });
  }

  importTelegramSession(data: { session_string: string; api_id?: string; api_hash?: string }): Observable<{
    success: boolean;
    message: string;
    account_name?: string;
    phone?: string;
  }> {
    return this.http.post<any>(`${this.base}/bot/telegram/import-session`, data, { headers: this.headers() });
  }

  disconnectTelegram(): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${this.base}/bot/telegram/disconnect`, {}, { headers: this.headers() });
  }

  // Channels
  getChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${this.base}/channels`, { headers: this.headers() });
  }

  createChannel(channel: Partial<Channel>): Observable<Channel> {
    return this.http.post<Channel>(`${this.base}/channels`, channel, { headers: this.headers() });
  }

  updateChannel(id: string, channel: Partial<Channel>): Observable<Channel> {
    return this.http.put<Channel>(`${this.base}/channels/${id}`, channel, { headers: this.headers() });
  }

  deleteChannel(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/channels/${id}`, { headers: this.headers() });
  }

  reorderChannels(channelIds: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/channels/reorder`, { channel_ids: channelIds }, { headers: this.headers() });
  }

  testReachability(): Observable<any> {
    return this.http.post<any>(`${this.base}/channels/test-reachability`, {}, { headers: this.headers() });
  }

  // Destinations: WhatsApp Groups
  getWhatsAppGroups(): Observable<WhatsAppGroup[]> {
    return this.http.get<WhatsAppGroup[]>(`${this.base}/destinations/whatsapp-groups`, { headers: this.headers() });
  }

  createWhatsAppGroup(group: Partial<WhatsAppGroup>): Observable<WhatsAppGroup> {
    return this.http.post<WhatsAppGroup>(`${this.base}/destinations/whatsapp-groups`, group, { headers: this.headers() });
  }

  updateWhatsAppGroup(idDb: string, group: Partial<WhatsAppGroup>): Observable<WhatsAppGroup> {
    return this.http.put<WhatsAppGroup>(`${this.base}/destinations/whatsapp-groups/${idDb}`, group, { headers: this.headers() });
  }

  deleteWhatsAppGroup(idDb: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/destinations/whatsapp-groups/${idDb}`, { headers: this.headers() });
  }

  // Destinations: Telegram
  getTelegramDestinations(): Observable<TelegramDestination[]> {
    return this.http.get<TelegramDestination[]>(`${this.base}/destinations/telegram`, { headers: this.headers() });
  }

  createTelegramDestination(dest: Partial<TelegramDestination>): Observable<TelegramDestination> {
    return this.http.post<TelegramDestination>(`${this.base}/destinations/telegram`, dest, { headers: this.headers() });
  }

  updateTelegramDestination(idDb: string, dest: Partial<TelegramDestination>): Observable<TelegramDestination> {
    return this.http.put<TelegramDestination>(`${this.base}/destinations/telegram/${idDb}`, dest, { headers: this.headers() });
  }

  deleteTelegramDestination(idDb: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/destinations/telegram/${idDb}`, { headers: this.headers() });
  }

  // Destinations: WhatsApp Sessions
  getWhatsAppSessions(): Observable<WhatsAppSession[]> {
    return this.http.get<WhatsAppSession[]>(`${this.base}/destinations/whatsapp-sessions`, { headers: this.headers() });
  }

  createWhatsAppSession(session: Partial<WhatsAppSession>): Observable<WhatsAppSession> {
    return this.http.post<WhatsAppSession>(`${this.base}/destinations/whatsapp-sessions`, session, { headers: this.headers() });
  }

  updateWhatsAppSession(idDb: string, session: Partial<WhatsAppSession>): Observable<WhatsAppSession> {
    return this.http.put<WhatsAppSession>(`${this.base}/destinations/whatsapp-sessions/${idDb}`, session, { headers: this.headers() });
  }

  deleteWhatsAppSession(idDb: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/destinations/whatsapp-sessions/${idDb}`, { headers: this.headers() });
  }

  // Settings
  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.base}/settings`, { headers: this.headers() });
  }

  updateSettings(settings: Partial<Settings>): Observable<Settings> {
    return this.http.put<Settings>(`${this.base}/settings`, settings, { headers: this.headers() });
  }

  // Tester
  testConvertLinks(text: string, customMlTag?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/tester/convert-links`, { text, custom_ml_tag: customMlTag }, { headers: this.headers() });
  }

  testAiFormat(text: string, template?: string, prompt?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/tester/format-ai`, { text, template, prompt }, { headers: this.headers() });
  }

  testPipeline(payload: any): Observable<any> {
    const body = typeof payload === 'string' ? { text: payload } : payload;
    return this.http.post<any>(`${this.base}/tester/test-pipeline`, body, { headers: this.headers() });
  }

  dispatchNow(payload: { text: string; channel_name?: string; custom_target_groups?: string[] }): Observable<any> {
    return this.http.post<any>(`${this.base}/tester/dispatch-now`, payload, { headers: this.headers() });
  }

  // Analytics
  getGroupAnalytics(group = 'noivas', period?: string): Observable<AnalyticsSummary> {
    const query = period && period !== 'all' ? `?group=${group}&period=${period}` : `?group=${group}`;
    return this.http.get<AnalyticsSummary>(`${this.base}/analytics/whatsapp-groups${query}`, { headers: this.headers() });
  }

  // Clear Dispatched Offers History
  clearDispatchedOffers(): Observable<{ message: string; count: number }> {
    return this.http.delete<any>(`${this.base}/metrics/dispatched-offers`, { headers: this.headers() });
  }
}
