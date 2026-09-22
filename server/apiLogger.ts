import { ApiLog } from '../src/types';

export interface FailedTxnDetail {
  order_id: string;
  user_id: number;
  amount_inr: number;
  reason: string;
  error_details?: string;
  timestamp: number;
  status: 'failed' | 'expired' | 'pending' | 'paid' | string;
}

export class ApiLoggerService {
  private logs: ApiLog[] = [];
  private maxLogs = 200;
  private failedTransactions: Map<string, FailedTxnDetail> = new Map();
  private lastTelegramPing: { timestamp: number; latencyMs: number; ok: boolean; error?: string } = {
    timestamp: Date.now(),
    latencyMs: 0,
    ok: true
  };
  private lastGatewayPing: { timestamp: number; latencyMs: number; ok: boolean; statusText?: string; error?: string } = {
    timestamp: Date.now(),
    latencyMs: 0,
    ok: true,
    statusText: 'Active'
  };

  constructor() {
    // Initial boot log
    this.log({
      service: 'DATABASE',
      endpoint: '/system/boot',
      method: 'GET',
      status: 'SUCCESS',
      http_code: 200,
      duration_ms: 1,
      message: 'System logger initialized and monitoring active.'
    });
  }

  public log(entry: Omit<ApiLog, 'id' | 'timestamp'> & { timestamp?: string }): ApiLog {
    const id = 'LOG_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const newLog: ApiLog = {
      id,
      timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      service: entry.service,
      endpoint: entry.endpoint,
      method: entry.method,
      status: entry.status,
      http_code: entry.http_code,
      duration_ms: entry.duration_ms,
      message: entry.message,
      error: entry.error,
      payload: entry.payload
    };

    this.logs.unshift(newLog);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    if (entry.status === 'ERROR') {
      console.warn(`[SYSTEM_HEALTH_ERROR] [${entry.service}] ${entry.endpoint} -> ${entry.message} ${entry.error ? `(${entry.error})` : ''}`);
    }

    return newLog;
  }

  public recordFailedTxn(txn: FailedTxnDetail) {
    this.failedTransactions.set(txn.order_id, txn);
  }

  public resolveFailedTxn(orderId: string) {
    this.failedTransactions.delete(orderId);
  }

  public getFailedTransactions(): FailedTxnDetail[] {
    return Array.from(this.failedTransactions.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public getLogs(limit = 100, service?: string, status?: string): ApiLog[] {
    let filtered = this.logs;
    if (service && service !== 'ALL') {
      filtered = filtered.filter(l => l.service.toUpperCase() === service.toUpperCase());
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter(l => l.status.toUpperCase() === status.toUpperCase());
    }
    return filtered.slice(0, limit);
  }

  public clearLogs() {
    this.logs = [];
    this.log({
      service: 'DATABASE',
      endpoint: '/system/logs/clear',
      method: 'POST',
      status: 'SUCCESS',
      http_code: 200,
      duration_ms: 0,
      message: 'System diagnostics logs cleared by admin.'
    });
  }

  public updateTelegramPing(ok: boolean, latencyMs: number, error?: string) {
    this.lastTelegramPing = {
      timestamp: Date.now(),
      latencyMs,
      ok,
      error
    };
  }

  public updateGatewayPing(ok: boolean, latencyMs: number, statusText?: string, error?: string) {
    this.lastGatewayPing = {
      timestamp: Date.now(),
      latencyMs,
      ok,
      statusText,
      error
    };
  }

  public getHealthSummary() {
    const errorLogsCount = this.logs.filter(l => l.status === 'ERROR').length;
    const warningLogsCount = this.logs.filter(l => l.status === 'WARNING').length;

    return {
      telegramPing: this.lastTelegramPing,
      gatewayPing: this.lastGatewayPing,
      totalLogs: this.logs.length,
      errorLogsCount,
      warningLogsCount,
      failedTransactionsCount: this.failedTransactions.size
    };
  }
}

export const apiLogger = new ApiLoggerService();
