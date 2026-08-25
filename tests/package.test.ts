import pkg from '../package.json';
import { expect, test } from 'vitest';

test('publishes an executable CLI and quality scripts', () => {
  expect(pkg.name).toBe('@aonic/plane-skills');
  expect(pkg.bin).toEqual({ 'plane-skills': './dist/cli.js' });
  expect(pkg.scripts).toMatchObject({ test: 'vitest run', typecheck: 'tsc --noEmit' });
});
