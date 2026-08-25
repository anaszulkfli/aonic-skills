import type { PlaneConfig } from './config.js';
import { PlaneClient } from './client.js';

export interface PlaneNamedItem {
  id: string;
  name: string;
  identifier?: string;
  [key: string]: unknown;
}

export interface CreateWorkItemPayload {
  name: string;
  typeId: string;
  parent?: string;
  description?: string;
}

export interface PlaneWorkItem extends PlaneNamedItem {
  type?: string | PlaneNamedItem;
  state?: string | PlaneNamedItem;
  parent?: string | PlaneNamedItem | null;
  description_html?: string;
}

interface Page<T> {
  results: T[];
  next_cursor?: string | null;
}

export class PlaneAmbiguityError extends Error {
  constructor(
    readonly candidates: string[],
    subject: string,
  ) {
    super(`Ambiguous ${subject}: ${candidates.join(', ')}`);
    this.name = 'PlaneAmbiguityError';
  }
}

export class PlaneWorkItems {
  constructor(
    private readonly client: PlaneClient,
    private readonly config: PlaneConfig,
  ) {}

  async findUserStoryType(): Promise<PlaneNamedItem> {
    const matches = (await this.listWorkItemTypes()).filter((type) => type.name === 'User Story');
    if (matches.length === 0) {
      throw new Error('User Story work-item type was not found');
    }
    if (matches.length > 1) {
      throw new PlaneAmbiguityError(matches.map(summary), 'User Story work-item type is ambiguous');
    }
    return matches[0];
  }

  async getWorkItem(id: string): Promise<PlaneWorkItem> {
    return this.client.request<PlaneWorkItem>(this.projectPath(`work-items/${encodeURIComponent(id)}/`), { method: 'GET' }, { retryRead: true });
  }

  async createWorkItem(payload: CreateWorkItemPayload): Promise<PlaneWorkItem> {
    const body: Record<string, string> = {
      name: payload.name,
    };
    if (payload.parent !== undefined) body.parent = payload.parent;
    body.type_id = payload.typeId;
    if (payload.description !== undefined) body.description_html = descriptionHtml(payload.description);

    return this.client.request<PlaneWorkItem>(this.projectPath('work-items/'), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async searchWorkItems(query: string): Promise<PlaneWorkItem[]> {
    const parameters = new URLSearchParams({ project_id: this.config.projectId, search: query });
    const page = await this.client.request<Page<PlaneWorkItem>>(
      `${this.workspacePath('work-items/search/')}?${parameters.toString()}`,
      { method: 'GET' },
      { retryRead: true },
    );
    return page.results;
  }

  async listStates(): Promise<PlaneNamedItem[]> {
    return this.listPages<PlaneNamedItem>(this.projectPath('states/'));
  }

  resolveUniqueByName<T extends PlaneNamedItem>(items: T[], name: string, subject: string): T {
    const matches = items.filter((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (matches.length === 0) {
      throw new Error(`No ${subject} named "${name}" was found`);
    }
    if (matches.length > 1) {
      throw new PlaneAmbiguityError(matches.map(summary), `${subject} named "${name}"`);
    }
    return matches[0];
  }

  async updateWorkItemState(id: string, stateId: string): Promise<PlaneWorkItem> {
    return this.client.request<PlaneWorkItem>(this.projectPath(`work-items/${encodeURIComponent(id)}/`), {
      method: 'PATCH',
      body: JSON.stringify({ state: stateId }),
    });
  }

  private async listWorkItemTypes(): Promise<PlaneNamedItem[]> {
    return this.listPages<PlaneNamedItem>(this.projectPath('work-item-types/'));
  }

  private async listPages<T>(path: string): Promise<T[]> {
    const results: T[] = [];
    let nextPath: string | undefined = path;
    const seenCursors = new Set<string>();

    while (nextPath !== undefined) {
      const page: Page<T> = await this.client.request<Page<T>>(nextPath, { method: 'GET' }, { retryRead: true });
      results.push(...page.results);
      const cursor: string | null | undefined = page.next_cursor;
      if (!cursor) break;
      if (seenCursors.has(cursor)) {
        throw new Error('Plane list response repeated a next_cursor');
      }
      seenCursors.add(cursor);
      nextPath = `${path}?${new URLSearchParams({ cursor }).toString()}`;
    }

    return results;
  }

  private workspacePath(path: string): string {
    return `api/v1/workspaces/${encodeURIComponent(this.config.workspaceSlug)}/${path}`;
  }

  private projectPath(path: string): string {
    return this.workspacePath(`projects/${encodeURIComponent(this.config.projectId)}/${path}`);
  }
}

function descriptionHtml(description: string): string {
  return description
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function summary(item: PlaneNamedItem): string {
  return `${item.identifier ?? item.id} — ${item.name}`;
}
