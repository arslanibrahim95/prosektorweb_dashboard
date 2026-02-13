/**
 * Token Refresh Service
 *
 * Proaktif token yenileme mekanizması ile oturum yönetimi.
 * Token süresi dolmadan önce yeniler ve kullanıcıyı uyarır.
 */

import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// Default configuration
const DEFAULT_WARNING_MINUTES = 5;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_REFRESH_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before expiry

export interface TokenRefreshState {
  isRefreshing: boolean;
  lastRefreshAttempt: number;
  retryCount: number;
}

export type SessionWarningLevel = 'none' | 'warning' | 'critical';

export interface SessionWarningState {
  show: boolean;
  level: SessionWarningLevel;
  timeUntilExpiry: number; // milliseconds
}

/**
 * Token refresh configuration
 */
export interface TokenRefreshConfig {
  warningMinutes: number;
  maxRetries: number;
  refreshBeforeMs: number;
  onSessionExpiring?: (timeUntilExpiry: number) => void;
  onSessionExpired?: () => void;
  onRefreshFailed?: (error: Error) => void;
}

const DEFAULT_CONFIG: TokenRefreshConfig = {
  warningMinutes: DEFAULT_WARNING_MINUTES,
  maxRetries: DEFAULT_MAX_RETRIES,
  refreshBeforeMs: DEFAULT_REFRESH_BEFORE_MS,
};

/**
 * Token Refresh Service class
 */
export class TokenRefreshService {
  private state: TokenRefreshState = {
    isRefreshing: false,
    lastRefreshAttempt: 0,
    retryCount: 0,
  };

  private config: TokenRefreshConfig;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<TokenRefreshConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Access token'ın süre dolmasına kalan süreyi milisaniye cinsinden döndürür.
   * Session yoksa veya expires_at bilgisi yoksa null döner.
   */
  getTimeUntilExpiry(session: Session | null): number | null {
    if (!session?.expires_at) return null;

    const expiresAtMs = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const remaining = expiresAtMs - now;

    return remaining > 0 ? remaining : 0;
  }

  /**
   * Session durumunu kontrol ederek uyarı seviyesini belirler.
   */
  getSessionWarning(session: Session | null): SessionWarningState {
    const timeUntilExpiry = this.getTimeUntilExpiry(session);

    if (timeUntilExpiry === null) {
      return { show: false, level: 'none', timeUntilExpiry: 0 };
    }

    const warningThresholdMs = this.config.warningMinutes * 60 * 1000;
    const criticalThresholdMs = 60 * 1000; // 1 minute

    if (timeUntilExpiry <= criticalThresholdMs) {
      return { show: true, level: 'critical', timeUntilExpiry };
    }

    if (timeUntilExpiry <= warningThresholdMs) {
      return { show: true, level: 'warning', timeUntilExpiry };
    }

    return { show: false, level: 'none', timeUntilExpiry };
  }

  /**
   * Proaktif token yenileme - süre dolmadan önce yeniler.
   * Retry mekanizması ile exponential backoff kullanır.
   */
  async refreshAccessToken(): Promise<boolean> {
    // Eğer zaten yeniliyorsa, başka bir isteğe izin verme
    if (this.state.isRefreshing) {
      return false;
    }

    // Max retry aşıldıysa oturumu kapat
    if (this.state.retryCount >= this.config.maxRetries) {
      this.config.onSessionExpired?.();
      this.resetState();
      return false;
    }

    this.state.isRefreshing = true;
    this.state.lastRefreshAttempt = Date.now();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('No session returned after refresh');
      }

      // Başarılı yenileme - state'i sıfırla
      this.resetState();

      // Yeni timer başlat
      this.scheduleNextRefresh(data.session);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Refresh failed');
      this.state.retryCount++;
      this.state.isRefreshing = false;

      this.config.onRefreshFailed?.(error);

      // Exponential backoff ile retry
      const backoffMs = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);

      if (this.state.retryCount < this.config.maxRetries) {
        this.refreshTimer = setTimeout(() => {
          void this.refreshAccessToken();
        }, backoffMs);
      } else {
        // Max retry aşıldı
        this.config.onSessionExpired?.();
        this.resetState();
      }

      return false;
    }
  }

  /**
   * Session'a göre otomatik yenileme timer'ını başlatır.
   */
  startAutoRefresh(session: Session | null): void {
    this.stopAutoRefresh();

    if (!session?.expires_at) return;

    const timeUntilExpiry = this.getTimeUntilExpiry(session);
    if (timeUntilExpiry === null || timeUntilExpiry <= 0) {
      this.config.onSessionExpired?.();
      return;
    }

    // Refresh threshold'dan önce yenile
    const refreshDelay = Math.max(
      timeUntilExpiry - this.config.refreshBeforeMs,
      0
    );

    this.refreshTimer = setTimeout(() => {
      void this.refreshAccessToken();
    }, refreshDelay);

    // Her dakika session durumunu kontrol et
    this.checkTimer = setInterval(() => {
      const warning = this.getSessionWarning(session);
      if (warning.show) {
        this.config.onSessionExpiring?.(warning.timeUntilExpiry);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Otomatik yenilemeyi durdurur.
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Retry mekanizması için refresh planlar.
   */
  private scheduleNextRefresh(session: Session): void {
    const timeUntilExpiry = this.getTimeUntilExpiry(session);
    if (!timeUntilExpiry) return;

    const refreshDelay = Math.max(
      timeUntilExpiry - this.config.refreshBeforeMs,
      60000 // Minimum 1 dakika
    );

    this.refreshTimer = setTimeout(() => {
      void this.refreshAccessToken();
    }, refreshDelay);
  }

  /**
   * State'i sıfırlar.
   */
  private resetState(): void {
    this.state = {
      isRefreshing: false,
      lastRefreshAttempt: 0,
      retryCount: 0,
    };
  }

  /**
   * Service'i temizler.
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.resetState();
  }

  /**
   * Mevcut state'i döndürür.
   */
  getState(): TokenRefreshState {
    return { ...this.state };
  }
}

/**
 * Singleton instance for global use
 */
let globalRefreshService: TokenRefreshService | null = null;

export function getRefreshService(config?: Partial<TokenRefreshConfig>): TokenRefreshService {
  if (!globalRefreshService) {
    globalRefreshService = new TokenRefreshService(config);
  }
  return globalRefreshService;
}

export function destroyRefreshService(): void {
  if (globalRefreshService) {
    globalRefreshService.destroy();
    globalRefreshService = null;
  }
}

/**
 * Format milliseconds to human readable time (e.g., "5 dakika")
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  if (minutes > 0) {
    return `${minutes} dakika`;
  }
  return `${seconds} saniye`;
}

/**
 * Check if session is expiring soon (within warning threshold)
 */
export function isSessionExpiringSoon(
  session: Session | null,
  warningMinutes: number = DEFAULT_WARNING_MINUTES
): boolean {
  const service = new TokenRefreshService({ warningMinutes });
  const warning = service.getSessionWarning(session);
  return warning.show;
}
