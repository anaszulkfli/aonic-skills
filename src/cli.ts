#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { installPackage, type Runtime, type Scope, updatePackage } from './install.js';
import { redactError, runPlaneCommand } from './plane-cli.js';

export async function main(): Promise<void> {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'plane') {
      print(await runPlaneCommand(args));
      return;
    }
    if (command !== 'install' && command !== 'update') throw new Error('Command must be install, update, or plane');
    const options = installationOptions(args);
    const result = command === 'install' ? await installPackage(options) : await updatePackage(options);
    print(result);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: redactError(error) })}\n`);
    process.exitCode = 1;
  }
}

function installationOptions(args: string[]): { runtime: Runtime; scope: Scope; cwd: string; home: string; force: boolean } {
  if (args.filter((arg) => arg === '--runtime').length !== 1) throw new Error('Specify --runtime exactly once');
  const runtimeIndex = args.indexOf('--runtime');
  const runtime = runtimeIndex === -1 ? undefined : args[runtimeIndex + 1];
  if (runtime !== 'codex' && runtime !== 'claude') throw new Error('--runtime must be codex or claude');
  const global = args.includes('--global');
  const project = args.includes('--project');
  if (global === project || args.filter((arg) => arg === '--global').length > 1 || args.filter((arg) => arg === '--project').length > 1) {
    throw new Error('Specify exactly one of --global or --project');
  }
  const known = new Set(['--runtime', runtime, '--global', '--project', '--force']);
  if (args.some((arg) => !known.has(arg))) throw new Error(`Unknown argument: ${args.find((arg) => !known.has(arg))}`);
  return { runtime, scope: global ? 'global' : 'project', cwd: process.cwd(), home: process.env.HOME ?? process.cwd(), force: args.includes('--force') };
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
