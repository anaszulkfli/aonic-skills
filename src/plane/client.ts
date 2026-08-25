import type { PlaneConfig } from './config.js';

export interface PlaneRequestOptions {
  retryRead?: boolean;
}

type Fetcher = typeof fetch;

const retryableStatuses = new Set([429, 500, 502, 503, 504]);
const maxReadRetries = 2;
const maxRetryDelayMs = 1_000;

export class PlaneApiError extends Error {
  constructor(
    readonly status: number,
    detail?: string,
  ) {
    super(detail ? `Plane request failed: ${status}: ${detail}` : `Plane request failed: ${status}`);
    this.name = 'PlaneApiError';
  }
}

export class PlaneClient {
  constructor(
    private readonly config: PlaneConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async request<T>(path: string, init: RequestInit = {}, options: PlaneRequestOptions = {}): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase();
    const shouldRetry = method === 'GET' && options.retryRead === true;

    for (let attempt = 0; ; attempt += 1) {
      const response = await this.fetcher(this.urlFor(path), this.requestInit(init));
      if (response.ok) {
        return this.readJson<T>(response);
      }

      if (!shouldRetry || !retryableStatuses.has(response.status) || attempt === maxReadRetries) {
        throw new PlaneApiError(response.status, this.redact(await responseDetail(response)));
      }

      await delay(retryDelay(response, attempt));
    }
  }

  private urlFor(path: string): string {
    return `${this.config.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private requestInit(init: RequestInit): RequestInit {
    const headers = new Headers(init.headers);
    headers.set('X-API-Key', this.config.apiKey);
    if (init.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return { ...init, headers };
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    return (text === '' ? undefined : JSON.parse(text)) as T;
  }

  private redact(value: string | undefined): string | undefined {
    if (!value) return value;
    return value.replace(new RegExp(escapeRegExp(this.config.apiKey), 'g'), '[REDACTED]');
  }
}

async function responseDetail(response: Response): Promise<string | undefined> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    const body: unknown = JSON.parse(text);
    if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
      return body.detail;
    }
  } catch {
    // Plain-text errors are also useful to callers.
  }
  return text;
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get('Retry-After');
  const retryAfterSeconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1_000, maxRetryDelayMs);
  }
  return Math.min(100 * 2 ** attempt, maxRetryDelayMs);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
