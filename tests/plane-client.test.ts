import { describe, expect, test, vi } from 'vitest';

import { readPlaneConfig } from '../src/plane/config.js';
import { PlaneApiError, PlaneClient } from '../src/plane/client.js';

const config = {
  apiKey: 'secret',
  workspaceSlug: 'acme',
  projectId: 'project-1',
  baseUrl: 'https://api.plane.so',
};

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('readPlaneConfig', () => {
  test('rejects an empty required variable without exposing the API key', () => {
    const env = {
      PLANE_API_KEY: 'secret',
      PLANE_WORKSPACE_SLUG: ' ',
      PLANE_PROJECT_ID: 'project-1',
    };

    expect(() => readPlaneConfig(env)).toThrow('PLANE_WORKSPACE_SLUG');
    expect(() => readPlaneConfig(env)).not.toThrow('secret');
  });

  test('defaults and normalizes the Plane API base URL', () => {
    expect(readPlaneConfig({
      PLANE_API_KEY: 'secret',
      PLANE_WORKSPACE_SLUG: 'acme',
      PLANE_PROJECT_ID: 'project-1',
    })).toEqual(config);

    expect(readPlaneConfig({
      PLANE_API_KEY: 'secret',
      PLANE_WORKSPACE_SLUG: 'acme',
      PLANE_PROJECT_ID: 'project-1',
      PLANE_API_BASE_URL: 'https://plane.example.test///',
    })).toEqual({ ...config, baseUrl: 'https://plane.example.test' });
  });
});

describe('PlaneClient', () => {
  test('uses X-API-Key and decodes JSON responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));

    await expect(new PlaneClient(config, fetcher).request('/health', { method: 'GET' }, { retryRead: true }))
      .resolves.toEqual({ results: [] });
    expect(fetcher).toHaveBeenCalledWith('https://api.plane.so/health', expect.objectContaining({
      headers: expect.objectContaining({ 'X-API-Key': 'secret' }),
    }));
  });

  test('retries a rate-limited GET at most twice', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'busy' }, 429, { 'Retry-After': '0' }))
      .mockResolvedValueOnce(jsonResponse({ results: ['ready'] }));

    await expect(new PlaneClient(config, fetcher).request('/items', { method: 'GET' }, { retryRead: true }))
      .resolves.toEqual({ results: ['ready'] });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('does not retry a POST and redacts credentials from errors', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ detail: 'busy secret' }, 503));
    const client = new PlaneClient(config, fetcher);

    await expect(client.request('/items', { method: 'POST' })).rejects.toMatchObject({
      name: 'PlaneApiError',
      message: 'Plane request failed: 503: busy [REDACTED]',
      status: 503,
    } satisfies Partial<PlaneApiError>);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
