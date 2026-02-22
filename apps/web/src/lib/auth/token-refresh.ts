/**
 * Token Refresh Service
 *
 * Proaktif token yenileme mekanizması ile oturum yönetimi.
 * Token süresi dolmadan önce yeniler ve kullanıcıyı uyarır.
 * 
 * SECURITY FIXES:
 * - Request coalescing: Prevents duplicate refresh requests
 * - Proper error handling for concurrent operations
 * - Improved state management with better race condition handling
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
  onRefreshSuccess?: (session: Session) => void;
}

const DEFAULT_CONFIG: TokenRefreshConfig = {
  warningMinutes: DEFAULT_WARNING_MINUTES,
  maxRetries: DEFAULT_MAX_RETRIES,
  refreshBeforeMs: DEFAULT_REFRESH_BEFORE_MS,
};

/**
 * Token Refresh Service class
 * 
 * SECURITY: Implements request coalescing to prevent race conditions
 * and duplicate refresh requests.
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
  
  // SECURITY: Request coalescing - prevents duplicate refresh requests
  private inflightRefreshPromise: Promise<Session | null> | null = null;
  
  // Track last successful session for scheduling
  private lastSession: Session | null = null;

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
   * 
   * SECURITY FIX: Request coalescing prevents duplicate refresh requests.
   * If a refresh is already in progress, returns the same promise to all callers.
   * 
   * Retry mekanizması ile exponential backoff kullanır.
   */
  async refreshAccessToken(): Promise<boolean> {
    // SECURITY: Request coalescing - if refresh is in progress, wait for it
    if (this.inflightRefreshPromise) {
      try {
        const session = await this.inflightRefreshPromise;
        return session !== null;
      } catch {
        return false;
      }
    }

    // Max retry aşıldıysa oturumu kapat
    if (this.state.retryCount >= this.config.maxRetries) {
      this.config.onSessionExpired?.();
      this.resetState();
      return false;
    }

    this.state.isRefreshing = true;
    this.state.lastRefreshAttempt = Date.now();

    // Create the refresh promise
    this.inflightRefreshPromise = this.performRefresh();

    try {
      const session = await this.inflightRefreshPromise;
      
      if (session) {
        // Başarılı yenileme - state'i sıfırla
        this.resetState();
        this.lastSession = session;
        
        // Yeni timer başlat
        this.scheduleNextRefresh(session);
        
        this.config.onRefreshSuccess?.(session);
        
        return true;
      } else {
        throw new Error('No session returned after refresh');
      }
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
    } finally {
      // Clear inflight promise after a short delay to prevent immediate retries
      setTimeout(() => {
        this.inflightRefreshPromise = null;
      }, 100);
    }
  }

  /**
   * Performs the actual refresh request
   */
  private async performRefresh(): Promise<Session | null> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  /**
   * Manually triggers a token refresh with request coalescing
   * Use this when user explicitly wants to extend their session
   */
  async extendSession(): Promise<Session | null> {
    // Cancel any scheduled refresh
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Reset retry count for manual extension
    this.state.retryCount = 0;
    
    const success = await this.refreshAccessToken();
    return success ? this.lastSession : null;
  }

  /**
   * Session'a göre otomatik yenileme timer'ını başlatır.
   * 
   * FIX: Properly handles session updates and prevents duplicate timers
   */
  startAutoRefresh(session: Session | null): void {
    // Always stop existing timers first
    this.stopAutoRefresh();

    if (!session?.expires_at) return;

    this.lastSession = session;

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

    // Schedule refresh
    this.refreshTimer = setTimeout(() => {
      void this.refreshAccessToken();
    }, refreshDelay);

    // Her dakika session durumunu kontrol et (for warning display)
    this.checkTimer = setInterval(() => {
      const warning = this.getSessionWarning(this.lastSession);
      if (warning.show) {
        this.config.onSessionExpiring?.(warning.timeUntilExpiry);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Updates the session reference for warning checks
   * Call this when session changes (e.g., after manual refresh)
   */
  updateSession(session: Session | null): void {
    this.lastSession = session;
    
    // Restart auto-refresh with new session
    this.startAutoRefresh(session);
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
    this.inflightRefreshPromise = null;
    this.lastSession = null;
  }

  /**
   * Mevcut state'i döndürür.
   */
  getState(): TokenRefreshState {
    return { ...this.state };
  }
  
  /**
   * Returns whether a refresh is currently in progress
   */
  isRefreshInProgress(): boolean {
    return this.state.isRefreshing || this.inflightRefreshPromise !== null;
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
