import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { installPackage, resolveTarget, updatePackage } from '../src/install.js';

const temporaryDirectories: string[] = [];

async function packageFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'plane-skills-package-'));
  temporaryDirectories.push(root);
  for (const skill of ['plane-create-subticket', 'plane-search-tickets', 'plane-create-user-story', 'plane-update-status']) {
    await mkdir(join(root, 'skills', skill, 'agents'), { recursive: true });
    await writeFile(join(root, 'skills', skill, 'SKILL.md'), `Run npx @anaszulkfli/plane-skills@latest plane ${skill}.\n`);
    await writeFile(join(root, 'skills', skill, 'agents', 'openai.yaml'), 'interface: openai\n');
  }
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('installer', () => {
  test('maps runtime and scope to the documented directory', () => {
    expect(resolveTarget('claude', 'global', '/repo', '/home/a')).toBe('/home/a/.claude/skills');
    expect(resolveTarget('codex', 'project', '/repo', '/home/a')).toBe('/repo/.agents/skills');
    expect(resolveTarget('codex', 'global', '/repo', '/home/a')).toBe('/home/a/.codex/skills');
    expect(resolveTarget('claude', 'project', '/repo', '/home/a')).toBe('/repo/.claude/skills');
  });

  test('installs exactly the packaged skills and records their rendered hashes', async () => {
    const source = await packageFixture();
    const home = await mkdtemp(join(tmpdir(), 'plane-skills-home-'));
    temporaryDirectories.push(home);

    const result = await installPackage({ runtime: 'codex', scope: 'global', cwd: '/repo', home, packageRoot: source, version: '1.2.3' });
    const manifest = JSON.parse(await readFile(join(result.target, '.plane-skills-manifest.json'), 'utf8')) as {
      packageName: string;
      version: string;
      runtime: string;
      files: Record<string, string>;
    };

    expect(result).toMatchObject({ target: join(home, '.codex', 'skills'), priorVersion: undefined, version: '1.2.3' });
    expect(manifest).toMatchObject({ packageName: '@anaszulkfli/plane-skills', version: '1.2.3', runtime: 'codex' });
    expect(Object.keys(manifest.files)).toHaveLength(8);
    await expect(readFile(join(result.target, 'plane-create-subticket', 'agents', 'openai.yaml'), 'utf8')).resolves.toContain('openai');
    await expect(readFile(join(result.target, 'plane-create-subticket', 'SKILL.md'), 'utf8')).resolves.toContain('@anaszulkfli/plane-skills@1.2.3');
  });

  test('omits OpenAI metadata for Claude without omitting the skill instructions', async () => {
    const source = await packageFixture();
    const home = await mkdtemp(join(tmpdir(), 'plane-skills-home-'));
    temporaryDirectories.push(home);

    const result = await installPackage({ runtime: 'claude', scope: 'global', cwd: '/repo', home, packageRoot: source, version: '1.2.3' });

    await expect(readFile(join(result.target, 'plane-create-subticket', 'SKILL.md'), 'utf8')).resolves.toContain('plane-create-subticket');
    await expect(readFile(join(result.target, 'plane-create-subticket', 'agents', 'openai.yaml'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('update preserves a manually changed packaged file without --force', async () => {
    const source = await packageFixture();
    const home = await mkdtemp(join(tmpdir(), 'plane-skills-home-'));
    temporaryDirectories.push(home);
    const options = { runtime: 'codex' as const, scope: 'global' as const, cwd: '/repo', home, packageRoot: source, version: '1.2.3' };
    const installed = await installPackage(options);
    await writeFile(join(installed.target, 'plane-create-subticket', 'SKILL.md'), 'manual change\n');

    await expect(updatePackage({ ...options, version: '1.2.4' })).rejects.toThrow('modified since installation: plane-create-subticket/SKILL.md');
  });

  test('update without a manifest refuses to overwrite an existing skill without --force', async () => {
    const source = await packageFixture();
    const home = await mkdtemp(join(tmpdir(), 'plane-skills-home-'));
    temporaryDirectories.push(home);
    const target = join(home, '.codex', 'skills', 'plane-create-subticket');
    await mkdir(target, { recursive: true });
    await writeFile(join(target, 'SKILL.md'), 'manually maintained\n');
    const options = { runtime: 'codex' as const, scope: 'global' as const, cwd: '/repo', home, packageRoot: source, version: '1.2.4' };

    await expect(updatePackage(options)).rejects.toThrow('No valid Plane Skills manifest; use install or update --force');
    await expect(readFile(join(target, 'SKILL.md'), 'utf8')).resolves.toBe('manually maintained\n');
  });

  test('force update replaces changed packaged files and leaves unrelated files untouched', async () => {
    const source = await packageFixture();
    const home = await mkdtemp(join(tmpdir(), 'plane-skills-home-'));
    temporaryDirectories.push(home);
    const options = { runtime: 'codex' as const, scope: 'global' as const, cwd: '/repo', home, packageRoot: source, version: '1.2.3' };
    const installed = await installPackage(options);
    await writeFile(join(installed.target, 'plane-create-subticket', 'SKILL.md'), 'manual change\n');
    await writeFile(join(installed.target, 'unrelated.md'), 'preserve me\n');

    const updated = await updatePackage({ ...options, version: '1.2.4', force: true });

    expect(updated).toMatchObject({ priorVersion: '1.2.3', version: '1.2.4' });
    await expect(readFile(join(updated.target, 'plane-create-subticket', 'SKILL.md'), 'utf8')).resolves.toContain('@anaszulkfli/plane-skills@1.2.4');
    await expect(readFile(join(updated.target, 'unrelated.md'), 'utf8')).resolves.toBe('preserve me\n');
  });
});
