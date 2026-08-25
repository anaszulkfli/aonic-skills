import { describe, expect, test, vi } from 'vitest';

import { PlaneClient } from '../src/plane/client.js';
import { PlaneAmbiguityError, PlaneWorkItems } from '../src/plane/work-items.js';

const config = {
  apiKey: 'secret',
  workspaceSlug: 'acme',
  projectId: 'project-1',
  baseUrl: 'https://api.plane.so',
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function apiWith(...responses: unknown[]): { api: PlaneWorkItems; fetcher: ReturnType<typeof vi.fn> } {
  const fetcher = vi.fn();
  for (const response of responses) fetcher.mockResolvedValueOnce(jsonResponse(response));
  return { api: new PlaneWorkItems(new PlaneClient(config, fetcher), config), fetcher };
}

describe('PlaneWorkItems', () => {
  test('creates a child with parent and type_id', async () => {
    const { api, fetcher } = apiWith({ id: 'child-1' });

    await api.createWorkItem({ name: 'Add audit event', parent: 'story-1', typeId: 'task-1' });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/work-items/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Add audit event', parent: 'story-1', type_id: 'task-1' }),
      }),
    );
  });

  test('escapes descriptions into paragraph HTML before creating a work item', async () => {
    const { api, fetcher } = apiWith({ id: 'child-1' });

    await api.createWorkItem({ name: 'Audit', typeId: 'task-1', description: 'Use <tag> & keep\n\nsecond line' });

    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      body: JSON.stringify({
        name: 'Audit',
        type_id: 'task-1',
        description_html: '<p>Use &lt;tag&gt; &amp; keep</p><p>second line</p>',
      }),
    }));
  });

  test('gets and searches work items with the documented read-only routes', async () => {
    const { api, fetcher } = apiWith({ id: 'item-1' }, { results: [{ id: 'item-2' }] });

    await expect(api.getWorkItem('item-1')).resolves.toEqual({ id: 'item-1' });
    await expect(api.searchWorkItems('audit & log')).resolves.toEqual([{ id: 'item-2' }]);

    expect(fetcher).toHaveBeenNthCalledWith(1,
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/work-items/item-1/',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(2,
      'https://api.plane.so/api/v1/workspaces/acme/work-items/search/?project_id=project-1&search=audit+%26+log',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('follows next_cursor for paginated type and state lists', async () => {
    const { api, fetcher } = apiWith(
      { results: [{ id: 'type-1', name: 'Task' }], next_cursor: 'next-type' },
      { results: [{ id: 'type-2', name: 'User Story' }], next_cursor: null },
      { results: [{ id: 'state-1', name: 'Todo' }], next_cursor: 'next-state' },
      { results: [{ id: 'state-2', name: 'Done' }], next_cursor: null },
    );

    await expect(api.findUserStoryType()).resolves.toMatchObject({ id: 'type-2', name: 'User Story' });
    await expect(api.listStates()).resolves.toEqual([
      { id: 'state-1', name: 'Todo' },
      { id: 'state-2', name: 'Done' },
    ]);

    expect(fetcher).toHaveBeenNthCalledWith(1,
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/work-item-types/', expect.anything());
    expect(fetcher).toHaveBeenNthCalledWith(2,
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/work-item-types/?cursor=next-type', expect.anything());
    expect(fetcher).toHaveBeenNthCalledWith(3,
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/states/', expect.anything());
    expect(fetcher).toHaveBeenNthCalledWith(4,
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/states/?cursor=next-state', expect.anything());
  });

  test('rejects when the exact User Story type is absent', async () => {
    const { api } = apiWith({ results: [{ id: 'type-1', name: 'user story' }] });

    await expect(api.findUserStoryType()).rejects.toThrow('User Story work-item type was not found');
  });

  test('rejects when more than one exact User Story type exists', async () => {
    const { api } = apiWith({ results: [
      { id: 'type-1', name: 'User Story' },
      { id: 'type-2', name: 'User Story' },
    ] });

    await expect(api.findUserStoryType()).rejects.toThrow('User Story work-item type is ambiguous');
  });

  test('returns candidate summaries when resolving a named selection is ambiguous', () => {
    const items = [
      { id: 'item-1', name: 'Audit event', identifier: 'ACME-1' },
      { id: 'item-2', name: 'audit event', identifier: 'ACME-2' },
    ];

    expect(() => apiWith().api.resolveUniqueByName(items, 'Audit Event', 'work item')).toThrow(PlaneAmbiguityError);
    try {
      apiWith().api.resolveUniqueByName(items, 'Audit Event', 'work item');
    } catch (error) {
      expect(error).toMatchObject({ candidates: ['ACME-1 — Audit event', 'ACME-2 — audit event'] });
    }
  });

  test('updates only the state field', async () => {
    const { api, fetcher } = apiWith({ id: 'item-1', state: 'done' });

    await api.updateWorkItemState('item-1', 'done');

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/work-items/item-1/',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ state: 'done' }) }),
    );
  });
});
