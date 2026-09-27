import { dbStore } from './storage';
import { apiLogger } from './apiLogger';

export interface BuyKeyParams {
  productId: string;
  duration: string;
  androidId?: string;
  apiKey?: string;
  masterKey?: string;
  apiUrl?: string;
}

export interface BuyKeyResult {
  success: boolean;
  key?: string;
  orderId?: string | number;
  message?: string;
  raw?: any;
  error?: string;
  source: 'live_api';
}

export interface ResellerBalanceState {
  success: boolean;
  balance: number;
  currency: string;
  formatted: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
  latencyMs: number;
  lastChecked: string;
  message: string;
  apiUrl: string;
  apiKeyMasked: string;
  raw?: any;
  error?: string;
}

export class BantiResellerService {
  private defaultUrl = 'https://bantibhaiya.to/api/reseller_v1.php';
  private defaultApiKey = '';
  private defaultMasterKey = '';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  private cachedBalance: ResellerBalanceState = {
    success: false,
    balance: 0,
    currency: 'INR',
    formatted: '₹0.00',
    status: 'UNCONFIGURED',
    latencyMs: 0,
    lastChecked: new Date().toISOString(),
    message: 'Reseller API is not yet queried',
    apiUrl: 'https://bantibhaiya.to/api/reseller_v1.php',
    apiKeyMasked: 'Not Set'
  };

  private normalizeUrl(url?: string): string[] {
    let clean = (url || '').trim();
    if (!clean) {
      clean = this.defaultUrl;
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    const candidates: string[] = [clean];

    // If user passed root domain e.g. https://bantibhaiya.to or https://bantibhaiya.to/
    const base = clean.replace(/\/+$/, '');
    if (!base.endsWith('.php') && !base.endsWith('/api')) {
      candidates.push(`${base}/api/reseller_v1.php`);
      candidates.push(`${base}/api/`);
      candidates.push(`${base}/api/reseller.php`);
    } else if (base.endsWith('/api')) {
      candidates.push(`${base}/reseller_v1.php`);
      candidates.push(`${base}/reseller.php`);
    }

    return Array.from(new Set(candidates));
  }

  private getCredentials(overrides?: Partial<BuyKeyParams>) {
    const settings = dbStore.getData().settings;
    const bots = dbStore.getBots();
    const activeBotReseller = bots[0]?.reseller_api;

    const apiKey = (overrides?.apiKey || settings.bantibhaiya_api_key || activeBotReseller?.api_key || '').trim();
    const masterKey = (overrides?.masterKey || settings.bantibhaiya_master_key || activeBotReseller?.master_key || '').trim();
    const rawUrl = (overrides?.apiUrl || settings.bantibhaiya_api_url || activeBotReseller?.api_url || this.defaultUrl).trim();

    return {
      url: rawUrl,
      apiKey,
      masterKey
    };
  }

  public getLatestBalanceState(): ResellerBalanceState {
    const creds = this.getCredentials();
    if (!creds.apiKey) {
      return {
        ...this.cachedBalance,
        status: 'UNCONFIGURED',
        message: 'Reseller API Key not configured in Admin settings',
        apiUrl: creds.url,
        apiKeyMasked: 'Not Set'
      };
    }
    return this.cachedBalance;
  }

  /**
   * Parse and extract exact numeric balance from live API response
   */
  public extractBalance(data: any, rawText: string): number | null {
    if (data === null || data === undefined) {
      if (!rawText) return null;
    }

    if (data && typeof data === 'object') {
      const candidates = [
        data.balance,
        data.wallet,
        data.credits,
        data.credit,
        data.amount,
        data.reseller_balance,
        data.account_balance,
        data.current_balance,
        data.user_balance,
        data.wallet_balance,
        data.available_balance,
        data.fund,
        data.funds,
        data.coins,
        data.data?.balance,
        data.data?.wallet,
        data.data?.credits,
        data.data?.amount,
        data.data?.user_balance,
        data.data?.account_balance,
        data.user?.balance,
        data.user?.wallet,
        data.account?.balance,
        data.result?.balance,
        data.result?.credits
      ];

      for (const val of candidates) {
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
            return val;
          }
          const cleaned = String(val).replace(/[^0-9.-]/g, '');
          const num = parseFloat(cleaned);
          if (!isNaN(num) && isFinite(num)) {
            return num;
          }
        }
      }
    }

    if (rawText && typeof rawText === 'string') {
      const cleanRaw = rawText.trim();
      // Match patterns like "Balance: 1500", "₹1,500.00", "wallet = 1500", "INR 1500"
      const match = cleanRaw.match(/(?:balance|wallet|credits?|amount|fund|inr|₹|rs\.?)["'\s:=]+([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && isFinite(parsed)) {
          return parsed;
        }
      }

      // If raw text is clean numeric value
      if (/^[0-9]+(?:\.[0-9]{1,2})?$/.test(cleanRaw)) {
        const num = parseFloat(cleanRaw);
        if (!isNaN(num)) return num;
      }
    }

    return null;
  }

  /**
   * Real-Time Live Balance Fetcher from BantiBhaiya Gateway
   */
  public async fetchLiveBalance(apiKeyOverride?: string, masterKeyOverride?: string, urlOverride?: string): Promise<ResellerBalanceState> {
    const creds = this.getCredentials({
      apiKey: apiKeyOverride,
      masterKey: masterKeyOverride,
      apiUrl: urlOverride
    });

    const maskedKey = creds.apiKey
      ? (creds.apiKey.length > 8 ? `${creds.apiKey.substring(0, 4)}...${creds.apiKey.substring(creds.apiKey.length - 4)}` : '****')
      : 'Not Set';

    if (!creds.apiKey) {
      this.cachedBalance = {
        success: false,
        balance: 0,
        currency: 'INR',
        formatted: '₹0.00',
        status: 'UNCONFIGURED',
        latencyMs: 0,
        lastChecked: new Date().toISOString(),
        message: 'No API Key configured. Please add your BantiBhaiya API Key.',
        apiUrl: creds.url,
        apiKeyMasked: 'Not Set'
      };
      return this.cachedBalance;
    }

    const candidateUrls = this.normalizeUrl(creds.url);
    const startTime = Date.now();
    let lastError = '';
    let lastRawText = '';
    let lastParsed: any = null;
    let lastHttpStatus = 0;

    for (const testUrl of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Try POST with urlencoded body (standard BantiBhaiya format)
        const postParams = new URLSearchParams();
        postParams.append('api_key', creds.apiKey);
        postParams.append('action', 'balance');
        if (creds.masterKey) {
          postParams.append('master_key', creds.masterKey);
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
          'Accept': 'application/json, text/plain, */*'
        };
        if (creds.masterKey) {
          headers['x-master-key'] = creds.masterKey;
        }

        let response = await fetch(testUrl, {
          method: 'POST',
          headers,
          body: postParams.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        lastHttpStatus = response.status;
        let latencyMs = Date.now() - startTime;
        let rawText = await response.text();
        lastRawText = rawText;

        try {
          lastParsed = JSON.parse(rawText);
        } catch {
          lastParsed = { raw: rawText.trim() };
        }

        let extractedBalance = this.extractBalance(lastParsed, rawText);

        // If endpoint returned "Invalid Action", it uses action=buy for key generation gateway
        if (lastParsed && (lastParsed.msg === 'Invalid Action' || lastParsed.message === 'Invalid Action' || lastParsed.error === 'Invalid Action')) {
          try {
            const probeController = new AbortController();
            const probeTimeout = setTimeout(() => probeController.abort(), 8000);
            const probeParams = new URLSearchParams();
            probeParams.append('api_key', creds.apiKey);
            probeParams.append('action', 'buy');
            probeParams.append('product_id', 'probe_check');
            probeParams.append('duration', '1 Day');
            if (creds.masterKey) {
              probeParams.append('master_key', creds.masterKey);
            }

            const probeRes = await fetch(testUrl, {
              method: 'POST',
              headers,
              body: probeParams.toString(),
              signal: probeController.signal
            });
            clearTimeout(probeTimeout);
            const probeRaw = await probeRes.text();
            let probeParsed: any = null;
            try { probeParsed = JSON.parse(probeRaw); } catch { probeParsed = { raw: probeRaw }; }

            // If API responded with "Invalid Product ID or Duration", the API key is 100% valid and connected
            const isKeyValid = probeParsed && (
              probeParsed.msg?.toLowerCase().includes('product') ||
              probeParsed.message?.toLowerCase().includes('product') ||
              probeParsed.msg?.toLowerCase().includes('duration') ||
              probeParsed.message?.toLowerCase().includes('duration') ||
              probeParsed.status === 'success' ||
              probeParsed.key
            );

            if (isKeyValid) {
              latencyMs = Date.now() - startTime;
              this.cachedBalance = {
                success: true,
                balance: 0,
                currency: 'INR',
                formatted: '⚡ Live API Gateway Connected',
                status: 'CONNECTED',
                latencyMs,
                lastChecked: new Date().toISOString(),
                message: `Live Connected to BantiBhaiya Gateway (${latencyMs}ms)`,
                apiUrl: testUrl,
                apiKeyMasked: maskedKey,
                raw: probeParsed
              };

              apiLogger.log({
                service: 'RESELLER_API',
                endpoint: testUrl,
                method: 'POST',
                status: 'SUCCESS',
                http_code: probeRes.status,
                duration_ms: latencyMs,
                message: `BantiBhaiya Live API Gateway Verified & Connected (${latencyMs}ms)`
              });

              return this.cachedBalance;
            } else if (probeParsed && (probeParsed.msg?.toLowerCase().includes('invalid api key') || probeParsed.msg?.toLowerCase().includes('access denied'))) {
              const errMsg = probeParsed.msg || 'Invalid API Key or Access Denied';
              apiLogger.log({
                service: 'RESELLER_API',
                endpoint: testUrl,
                method: 'POST',
                status: 'ERROR',
                http_code: probeRes.status,
                duration_ms: latencyMs,
                message: `BantiBhaiya Reseller API Error: ${errMsg}`,
                payload: probeParsed
              });

              this.cachedBalance = {
                success: false,
                balance: 0,
                currency: 'INR',
                formatted: '₹0.00',
                status: 'ERROR',
                latencyMs,
                lastChecked: new Date().toISOString(),
                message: errMsg,
                apiUrl: testUrl,
                apiKeyMasked: maskedKey,
                raw: probeParsed,
                error: errMsg
              };
              return this.cachedBalance;
            }
          } catch (probeErr: any) {
            console.warn('[BantiBhaiya] Probe check warning:', probeErr.message);
          }
        }

        // Check for explicit error response from provider API
        const isExplicitError = Boolean(
          (lastParsed && (lastParsed.status === 'error' || lastParsed.success === false || lastParsed.error)) ||
          (response.status >= 400 && response.status !== 404)
        );

        if (isExplicitError && extractedBalance === null) {
          const errMsg = lastParsed?.message || lastParsed?.error || lastParsed?.msg || `HTTP ${response.status} Provider Error`;
          lastError = errMsg;

          apiLogger.log({
            service: 'RESELLER_API',
            endpoint: testUrl,
            method: 'POST',
            status: 'ERROR',
            http_code: response.status,
            duration_ms: latencyMs,
            message: `BantiBhaiya Live Balance Error: ${errMsg}`,
            payload: { url: testUrl, response: lastParsed }
          });

          this.cachedBalance = {
            success: false,
            balance: 0,
            currency: 'INR',
            formatted: '₹0.00',
            status: 'ERROR',
            latencyMs,
            lastChecked: new Date().toISOString(),
            message: errMsg,
            apiUrl: testUrl,
            apiKeyMasked: maskedKey,
            raw: lastParsed,
            error: errMsg
          };
          return this.cachedBalance;
        }

        if (extractedBalance !== null) {
          const formatted = `₹${extractedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          const currency = lastParsed?.currency || 'INR';

          this.cachedBalance = {
            success: true,
            balance: extractedBalance,
            currency,
            formatted,
            status: 'CONNECTED',
            latencyMs,
            lastChecked: new Date().toISOString(),
            message: `Connected (${latencyMs}ms)`,
            apiUrl: testUrl,
            apiKeyMasked: maskedKey,
            raw: lastParsed
          };

          apiLogger.log({
            service: 'RESELLER_API',
            endpoint: testUrl,
            method: 'POST',
            status: 'SUCCESS',
            http_code: response.status,
            duration_ms: latencyMs,
            message: `BantiBhaiya Live Balance: ${formatted} (${latencyMs}ms)`
          });

          return this.cachedBalance;
        }

        // If response was 404 on current URL, continue to next candidate
        if (response.status === 404 && candidateUrls.indexOf(testUrl) < candidateUrls.length - 1) {
          continue;
        }

        // If provider responded 200 with OK status object
        if (response.ok && lastParsed && (lastParsed.status === 'success' || lastParsed.success === true)) {
          this.cachedBalance = {
            success: true,
            balance: 0,
            currency: 'INR',
            formatted: '₹0.00',
            status: 'CONNECTED',
            latencyMs,
            lastChecked: new Date().toISOString(),
            message: `Connected (${latencyMs}ms)`,
            apiUrl: testUrl,
            apiKeyMasked: maskedKey,
            raw: lastParsed
          };
          return this.cachedBalance;
        }

      } catch (err: any) {
        lastError = err.name === 'AbortError' ? 'Connection timed out (10s)' : (err.message || 'Network exception connecting to API');
      }
    }

    const latencyMs = Date.now() - startTime;
    const finalErrMsg = lastError || `Could not retrieve balance from provider (HTTP ${lastHttpStatus || 'N/A'})`;

    apiLogger.log({
      service: 'RESELLER_API',
      endpoint: creds.url,
      method: 'POST',
      status: 'ERROR',
      http_code: lastHttpStatus || 500,
      duration_ms: latencyMs,
      message: `BantiBhaiya Balance Check Failed: ${finalErrMsg}`,
      payload: { raw: lastRawText ? lastRawText.substring(0, 300) : undefined }
    });

    this.cachedBalance = {
      success: false,
      balance: 0,
      currency: 'INR',
      formatted: '₹0.00',
      status: 'ERROR',
      latencyMs,
      lastChecked: new Date().toISOString(),
      message: finalErrMsg,
      apiUrl: creds.url,
      apiKeyMasked: maskedKey,
      raw: lastParsed || { error: finalErrMsg, raw: lastRawText },
      error: finalErrMsg
    };

    return this.cachedBalance;
  }

  /**
   * Real-Time Key Purchase / Generation through live BantiBhaiya Provider API
   */
  public async buyKey(params: BuyKeyParams): Promise<BuyKeyResult> {
    const creds = this.getCredentials(params);

    if (!creds.apiKey) {
      return {
        success: false,
        error: 'Reseller API Key not configured. Please set your BantiBhaiya API key.',
        source: 'live_api'
      };
    }

    let cleanDuration = (params.duration || '').trim();
    const durLower = cleanDuration.toLowerCase();
    if (durLower.includes('1 day') || durLower.includes('24 hour') || durLower.includes('1day')) {
      cleanDuration = '1 Day';
    } else if (durLower.includes('7 day') || durLower.includes('week') || durLower.includes('7days')) {
      cleanDuration = '7 Days';
    } else if (durLower.includes('30 day') || durLower.includes('month') || durLower.includes('30days')) {
      cleanDuration = '30 Days';
    }

    const candidateUrls = this.normalizeUrl(creds.url);
    const startTime = Date.now();
    let lastError = '';
    let lastRawText = '';
    let lastData: any = null;

    for (const targetUrl of candidateUrls) {
      try {
        const postData = new URLSearchParams();
        postData.append('api_key', creds.apiKey);
        postData.append('action', 'buy');
        postData.append('product_id', params.productId);
        postData.append('duration', cleanDuration);

        if (params.androidId && params.androidId.trim()) {
          postData.append('android_id', params.androidId.trim());
          postData.append('hwid', params.androidId.trim());
        }
        if (creds.masterKey) {
          postData.append('master_key', creds.masterKey);
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
          'Accept': 'application/json, text/plain, */*'
        };
        if (creds.masterKey) {
          headers['x-master-key'] = creds.masterKey;
        }

        console.log(`[BantiBhaiya] Dispatching real-time key purchase to ${targetUrl}:`, {
          product_id: params.productId,
          duration: cleanDuration,
          has_android_id: Boolean(params.androidId)
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: postData.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;
        const rawText = await response.text();
        lastRawText = rawText;

        try {
          lastData = JSON.parse(rawText);
        } catch {
          lastData = { text: rawText.trim() };
        }

        console.log('[BantiBhaiya] Live Provider Raw Response:', rawText);

        // Update real-time balance if present in purchase response
        const updatedBal = this.extractBalance(lastData, rawText);
        if (updatedBal !== null) {
          this.cachedBalance.balance = updatedBal;
          this.cachedBalance.formatted = `₹${updatedBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          this.cachedBalance.lastChecked = new Date().toISOString();
        }

        const extractedKey = this.extractKeyFromResponse(lastData, rawText);

        if (extractedKey) {
          apiLogger.log({
            service: 'RESELLER_API',
            endpoint: targetUrl,
            method: 'POST',
            status: 'SUCCESS',
            http_code: response.status,
            duration_ms: latencyMs,
            message: `Key Generated: ${extractedKey.substring(0, 8)}... (${cleanDuration})`,
            payload: { product_id: params.productId, duration: cleanDuration, orderId: lastData.order_id || lastData.id }
          });

          return {
            success: true,
            key: extractedKey,
            orderId: lastData.order_id || lastData.id || lastData.orderId || `BANTI_${Date.now()}`,
            message: lastData.message || lastData.msg || 'Live key generated successfully from provider',
            raw: lastData,
            source: 'live_api'
          };
        }

        // If response is 404, try next candidate URL
        if (response.status === 404 && candidateUrls.indexOf(targetUrl) < candidateUrls.length - 1) {
          continue;
        }

        // If API returned explicit error message
        if (lastData && (lastData.status === 'error' || lastData.success === false || lastData.error || lastData.message)) {
          const errorMsg = lastData.message || lastData.error || lastData.msg || lastData.reason || `Provider Error (HTTP ${response.status})`;
          lastError = errorMsg;

          apiLogger.log({
            service: 'RESELLER_API',
            endpoint: targetUrl,
            method: 'POST',
            status: 'ERROR',
            http_code: response.status,
            duration_ms: latencyMs,
            message: `Key generation failed: ${errorMsg}`,
            payload: lastData
          });

          return {
            success: false,
            error: errorMsg,
            raw: lastData,
            source: 'live_api'
          };
        }

      } catch (err: any) {
        lastError = err.name === 'AbortError' ? 'Key generation timed out after 15s' : err.message;
      }
    }

    const latencyMs = Date.now() - startTime;
    const finalErr = lastError || `Unexpected provider response: ${lastRawText ? lastRawText.substring(0, 150) : 'No response'}`;

    apiLogger.log({
      service: 'RESELLER_API',
      endpoint: creds.url,
      method: 'POST',
      status: 'ERROR',
      http_code: 500,
      duration_ms: latencyMs,
      message: `Key purchase exception: ${finalErr}`,
      payload: { raw: lastRawText }
    });

    return {
      success: false,
      error: finalErr,
      raw: lastData || { error: finalErr, raw: lastRawText },
      source: 'live_api'
    };
  }

  /**
   * Helper to parse and extract license key from various provider JSON formats
   */
  private extractKeyFromResponse(data: any, rawText: string): string | null {
    if (!data) return null;

    if (typeof data.key === 'string' && data.key.trim().length > 3) return data.key.trim();
    if (typeof data.license === 'string' && data.license.trim().length > 3) return data.license.trim();
    if (typeof data.serial === 'string' && data.serial.trim().length > 3) return data.serial.trim();
    if (typeof data.license_key === 'string' && data.license_key.trim().length > 3) return data.license_key.trim();
    if (typeof data.product_key === 'string' && data.product_key.trim().length > 3) return data.product_key.trim();
    if (typeof data.code === 'string' && data.code.trim().length > 3) return data.code.trim();
    if (typeof data.key_text === 'string' && data.key_text.trim().length > 3) return data.key_text.trim();
    if (typeof data.key_string === 'string' && data.key_string.trim().length > 3) return data.key_string.trim();

    if (data.data) {
      if (typeof data.data.key === 'string') return data.data.key.trim();
      if (typeof data.data.license === 'string') return data.data.license.trim();
      if (typeof data.data.license_key === 'string') return data.data.license_key.trim();
      if (typeof data.data.code === 'string') return data.data.code.trim();
      if (typeof data.data === 'string' && data.data.trim().length > 3 && !data.data.includes('<')) return data.data.trim();
    }

    if (data.result) {
      if (typeof data.result.key === 'string') return data.result.key.trim();
      if (typeof data.result.license === 'string') return data.result.license.trim();
    }

    if (rawText) {
      const trimmed = rawText.trim();
      // Match key pattern like "BANTI-XXXX-XXXX" or "XXXX-XXXX-XXXX-XXXX"
      const keyPatternMatch = trimmed.match(/[A-Za-z0-9]{4,8}-[A-Za-z0-9]{4,8}-[A-Za-z0-9]{4,8}(?:-[A-Za-z0-9]{4,8})?/);
      if (keyPatternMatch) {
        return keyPatternMatch[0];
      }

      if (
        trimmed.length >= 8 &&
        trimmed.length <= 80 &&
        !trimmed.startsWith('<') &&
        !trimmed.includes(' ') &&
        !trimmed.toLowerCase().includes('error') &&
        !trimmed.toLowerCase().includes('failed')
      ) {
        return trimmed;
      }
    }

    return null;
  }

  /**
   * Real-time Test Connection & Sync Provider Balance
   */
  public async testConnection(apiKeyOverride?: string, masterKeyOverride?: string, urlOverride?: string): Promise<{ success: boolean; message: string; balance?: number; formatted?: string; raw?: any; latencyMs?: number; error?: string }> {
    const balState = await this.fetchLiveBalance(apiKeyOverride, masterKeyOverride, urlOverride);
    return {
      success: balState.success,
      message: balState.message,
      balance: balState.balance,
      formatted: balState.formatted,
      latencyMs: balState.latencyMs,
      raw: balState.raw,
      error: balState.error
    };
  }
}

export const bantiResellerService = new BantiResellerService();
