import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { runPlaneCommand } from '../src/plane-cli.js';

const execFile = promisify(execFileCallback);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('CLI', () => {
  test('runs when invoked through a symlinked package bin', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'plane-skills-bin-'));
    temporaryDirectories.push(directory);
    const bin = join(directory, 'plane-skills');
    await symlink(join(process.cwd(), 'dist', 'cli.js'), bin);

    await expect(execFile(process.execPath, [bin, 'invalid-command'])).rejects.toMatchObject({
      stderr: expect.stringContaining('Command must be install, update, or plane'),
    });
  });

  test('rejects trailing operands for no-argument Plane operations before reading configuration', async () => {
    await expect(runPlaneCommand(['types', 'extra'], {})).rejects.toThrow('types accepts no arguments');
  });

  test('rejects duplicate create flags before reading configuration', async () => {
    await expect(runPlaneCommand(['create', '--name', 'first', '--name', 'second', '--type-id', 'type-1'], {}))
      .rejects.toThrow('Duplicate argument: --name');
  });

  test('creates with Plane default type when type-id is omitted', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'item-1' }), {
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetcher);

    await expect(runPlaneCommand(['create', '--name', 'Use default type'], {
      PLANE_API_KEY: 'secret',
      PLANE_WORKSPACE_SLUG: 'acme',
      PLANE_PROJECT_ID: 'project-1',
    })).resolves.toEqual({ id: 'item-1' });

    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Use default type' }),
    }));
  });
});
