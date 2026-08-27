import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Runtime = 'codex' | 'claude';
export type Scope = 'global' | 'project';

export interface InstallOptions {
  runtime: Runtime;
  scope: Scope;
  cwd: string;
  home: string;
  packageRoot?: string;
  packageName?: string;
  version?: string;
  force?: boolean;
}

export interface InstallResult {
  target: string;
  priorVersion?: string;
  version: string;
}

interface Manifest {
  packageName: string;
  version: string;
  runtime: Runtime;
  files: Record<string, string>;
}

const skillNames = [
  'plane-create-subticket',
  'plane-search-tickets',
  'plane-create-user-story',
  'plane-update-status',
] as const;
const manifestName = '.plane-skills-manifest.json';

export function resolveTarget(runtime: Runtime, scope: Scope, cwd: string, home: string): string {
  if (scope === 'global') return join(home, runtime === 'codex' ? '.codex/skills' : '.claude/skills');
  return join(cwd, runtime === 'codex' ? '.agents/skills' : '.claude/skills');
}

export async function installPackage(options: InstallOptions): Promise<InstallResult> {
  return writePackage(options, false);
}

export async function updatePackage(options: InstallOptions): Promise<InstallResult> {
  return writePackage(options, true);
}

async function writePackage(options: InstallOptions, updating: boolean): Promise<InstallResult> {
  const target = resolveTarget(options.runtime, options.scope, options.cwd, options.home);
  const packageRoot = options.packageRoot ?? packageRootForModule();
  const packageName = options.packageName ?? '@anaszulkfli/plane-skills';
  const version = options.version ?? await packageVersion(packageRoot);
  const files = await packagedFiles(join(packageRoot, 'skills'), options.runtime, version);
  const existing = await readManifest(join(target, manifestName), packageName, options.runtime);

  if (updating) {
    if (!existing && !options.force && await hasExistingSkillDirectory(target)) {
      throw new Error('No valid Plane Skills manifest; use install or update --force');
    }
    if (existing) {
      const modified = await changedFiles(target, existing.files);
      if (modified.length > 0 && !options.force) {
        throw new Error(`Installed files modified since installation: ${modified.join(', ')}`);
      }
    }
  }

  for (const [path, content] of files) {
    const destination = join(target, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }

  const manifest: Manifest = {
    packageName,
    version,
    runtime: options.runtime,
    files: Object.fromEntries([...files].map(([path, content]) => [path, hash(content)])),
  };
  await replaceManifest(join(target, manifestName), manifest);
  return { target, priorVersion: existing?.version, version };
}

async function packagedFiles(skillsRoot: string, runtime: Runtime, version: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  for (const skill of skillNames) {
    const source = join(skillsRoot, skill);
    const entries = await listFiles(source);
    for (const path of entries) {
      const relativePath = relative(skillsRoot, path);
      if (runtime === 'claude' && relativePath.endsWith('/agents/openai.yaml')) continue;
      const content = await readFile(path);
      files.set(relativePath, relativePath.endsWith('SKILL.md') ? renderVersion(content, version) : content);
    }
  }
  return files;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function renderVersion(content: Buffer, version: string): Buffer {
  return Buffer.from(content.toString('utf8')
    .replaceAll('{{PACKAGE_VERSION}}', version)
    .replaceAll('@anaszulkfli/plane-skills@latest', `@anaszulkfli/plane-skills@${version}`));
}

async function changedFiles(target: string, files: Record<string, string>): Promise<string[]> {
  const changed: string[] = [];
  for (const [path, expected] of Object.entries(files)) {
    try {
      if (hash(await readFile(join(target, path))) !== expected) changed.push(path);
    } catch {
      changed.push(path);
    }
  }
  return changed.sort();
}

async function readManifest(path: string, packageName: string, runtime: Runtime): Promise<Manifest | undefined> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
    return isManifest(parsed, packageName, runtime) ? parsed : undefined;
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
}

async function hasExistingSkillDirectory(target: string): Promise<boolean> {
  for (const skill of skillNames) {
    try {
      if ((await stat(join(target, skill))).isDirectory()) return true;
    } catch (error: unknown) {
      if (!isMissing(error)) throw error;
    }
  }
  return false;
}

function isManifest(value: unknown, packageName: string, runtime: Runtime): value is Manifest {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Manifest>;
  return candidate.packageName === packageName
    && typeof candidate.version === 'string'
    && candidate.runtime === runtime
    && typeof candidate.files === 'object'
    && candidate.files !== null
    && Object.values(candidate.files).every((hashValue) => typeof hashValue === 'string');
}

async function replaceManifest(path: string, manifest: Manifest): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(temporary, path);
}

function hash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function isMissing(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function packageRootForModule(): string {
  return join(fileURLToPath(new URL('.', import.meta.url)), '..');
}

async function packageVersion(packageRoot: string): Promise<string> {
  const parsed: unknown = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && typeof parsed.version === 'string') {
    return parsed.version;
  }
  throw new Error('Package version is missing from package.json');
}
