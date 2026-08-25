export interface PlaneConfig {
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
  baseUrl: string;
}

type PlaneEnvironment = Record<string, string | undefined>;

const defaultBaseUrl = 'https://api.plane.so';

export function readPlaneConfig(env: PlaneEnvironment): PlaneConfig {
  const apiKey = required(env, 'PLANE_API_KEY');
  const workspaceSlug = required(env, 'PLANE_WORKSPACE_SLUG');
  const projectId = required(env, 'PLANE_PROJECT_ID');
  const configuredBaseUrl = env.PLANE_API_BASE_URL?.trim() || defaultBaseUrl;

  return {
    apiKey,
    workspaceSlug,
    projectId,
    baseUrl: normalizeBaseUrl(configuredBaseUrl),
  };
}

function required(env: PlaneEnvironment, name: keyof PlaneEnvironment): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required Plane configuration: ${name}`);
  }
  return value;
}

function normalizeBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('PLANE_API_BASE_URL must be a valid URL');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('PLANE_API_BASE_URL must use HTTP or HTTPS');
  }

  return url.toString().replace(/\/+$/, '');
}
