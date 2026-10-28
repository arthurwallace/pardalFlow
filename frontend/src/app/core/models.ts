export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  role: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Channel {
  id?: string;
  id_db?: string;
  user_id: string;
  name: string;
  description?: string;
  active: boolean;
  replace_image: boolean;
  is_coupon_group: boolean;
  whatsapp_destinations: string[];
  order: number;
}

export interface WhatsAppGroup {
  id_db: string;
  user_id: string;
  name: string;
  id: string;
  keywords: string[];
  footer_text?: string;
  active?: boolean;
}

export interface TelegramDestination {
  id_db: string;
  user_id: string;
  name: string;
  id: string;
  admin: boolean;
}

export interface WhatsAppSession {
  id_db: string;
  user_id: string;
  name: string;
  active: boolean;
}

export interface Settings {
  user_id: string;
  ai_enabled: boolean;
  magalu_enabled: boolean;
  whatsapp_send_errors: boolean;
  whatsapp_admin_dest: string;
  footer_text: string;
  forbidden_keywords: string[];
  message_template: string;
  gemini_prompt: string;
  openrouter_model_1: string;
  openrouter_model_2: string;
  regex_shopee: string;
  regex_mercado_livre: string;
  regex_amazon: string;
  regex_magalu: string;
  custom_telegram_api_id?: string;
  custom_telegram_api_hash?: string;
  custom_telegram_session?: string;
  custom_shopee_app_id?: string;
  custom_shopee_secret?: string;
  custom_openrouter_api_key?: string;
  shopee_app_id?: string;
  shopee_app_secret?: string;
  openrouter_api_key?: string;
  groq_api_key?: string;
  google_api_key?: string;
  telegram_api_id?: number | string;
  telegram_api_hash?: string;
}

export interface DashboardMetrics {
  bot_running: boolean;
  posts_detected: number;
  posts_sent: number;
  ai_errors: number;
  conversion_errors: number;
  avg_latency_seconds: number;
  total_channels: number;
  active_channels: number;
  whatsapp_groups: number;
  telegram_destinations: number;
  total_dispatched_offers?: number;
  whatsapp_sessions?: number;
  active_whatsapp_sessions?: number;
}

export interface ParticipantRecord {
  phone: string;
  entry_time?: string;
  exit_time?: string;
  status: string;
  group_time?: string;
  minutes?: number;
  tag: string;
}

export interface AnalyticsSummary {
  total_records: number;
  total_active: number;
  total_exits: number;
  quick_exits_under_15m: number;
  quick_exit_percentage: number;
  participants: ParticipantRecord[];
}

export interface BotStatus {
  user_id: string;
  is_running: boolean;
  session_name?: string;
  metrics: {
    detected: number;
    sent: number;
    ai_errors: number;
    conversion_errors: number;
    avg_latency: number;
  };
}

export interface DispatchedOffer {
  id: string;
  product_name: string;
  price?: string;
  channel_name: string;
  original_text: string;
  converted_text: string;
  target_groups: string[];
  platform: string;
  status: string;
  sent_at: string;
}

export interface DispatchedOffersResponse {
  total: number;
  items: DispatchedOffer[];
}
