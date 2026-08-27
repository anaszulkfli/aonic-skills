import pkg from '../package.json';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';

test('publishes an executable CLI and quality scripts', () => {
  expect(pkg.name).toBe('@anaszulkfli/plane-skills');
  expect(pkg.bin).toEqual({ 'plane-skills': './dist/cli.js' });
  expect(pkg.scripts).toMatchObject({ test: 'npm run build && vitest run', typecheck: 'tsc --noEmit' });
});

test('documents installation, Plane configuration, safety, and maintainer release steps', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');

  for (const command of [
    'npx @anaszulkfli/plane-skills@latest install --runtime codex --global',
    'npx @anaszulkfli/plane-skills@latest install --runtime codex --project',
    'npx @anaszulkfli/plane-skills@latest install --runtime claude --global',
    'npx @anaszulkfli/plane-skills@latest install --runtime claude --project',
  ]) expect(readme).toContain(command);

  expect(readme).toMatch(/npx @anaszulkfli\/plane-skills@latest update --runtime (codex|claude) --(global|project)/);
  for (const variable of ['PLANE_API_KEY', 'PLANE_WORKSPACE_SLUG', 'PLANE_PROJECT_ID', 'PLANE_API_BASE_URL']) {
    expect(readme).toContain(variable);
  }
  expect(readme).toMatch(/User Story/);
  expect(readme).toMatch(/confirm/i);
  expect(readme).toMatch(/self-hosted/i);
  expect(readme).toMatch(/npm version (patch|minor|major)/);
  expect(readme).toMatch(/npm publish/);
  expect(readme).toMatch(/not publish|publishing.*not performed|maintainer-authorized/i);
});
