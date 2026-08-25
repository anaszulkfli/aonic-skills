import { PlaneClient } from './plane/client.js';
import { readPlaneConfig } from './plane/config.js';
import { PlaneWorkItems } from './plane/work-items.js';

type Environment = Record<string, string | undefined>;

export async function runPlaneCommand(args: string[], environment: Environment = process.env): Promise<unknown> {
  const [operation, ...rest] = args;
  const command = parsePlaneCommand(operation, rest);
  const config = readPlaneConfig(environment);
  const workItems = new PlaneWorkItems(new PlaneClient(config), config);

  switch (command.operation) {
    case 'get': return workItems.getWorkItem(command.id);
    case 'search': return workItems.searchWorkItems(command.query);
    case 'types': return workItems.findUserStoryType();
    case 'states': return workItems.listStates();
    case 'create': return workItems.createWorkItem(command.payload);
    case 'set-state': return workItems.updateWorkItemState(command.id, command.stateId);
  }
}

export function redactError(error: unknown, environment: Environment = process.env): string {
  const message = error instanceof Error ? error.message : String(error);
  const key = environment.PLANE_API_KEY;
  return key ? message.replaceAll(key, '[REDACTED]') : message;
}

function required(value: string | undefined, name: string): string {
  if (!value || value.startsWith('--')) throw new Error(`Missing required argument: ${name}`);
  return value;
}

type ParsedCommand =
  | { operation: 'get'; id: string }
  | { operation: 'search'; query: string }
  | { operation: 'types' | 'states' }
  | { operation: 'create'; payload: { name: string; typeId: string; parent?: string; description?: string } }
  | { operation: 'set-state'; id: string; stateId: string };

function parsePlaneCommand(operation: string | undefined, args: string[]): ParsedCommand {
  switch (operation) {
    case 'get': return { operation, id: exactPositionals(operation, args, 1)[0] };
    case 'search': return { operation, query: exactPositionals(operation, args, 1)[0] };
    case 'types':
    case 'states':
      exactPositionals(operation, args, 0);
      return { operation };
    case 'create': return { operation, payload: parseCreateArguments(args) };
    case 'set-state': {
      const [id, stateId] = exactPositionals(operation, args, 2);
      return { operation, id, stateId };
    }
    default: throw new Error(`Unknown Plane operation: ${operation ?? '(missing)'}`);
  }
}

function exactPositionals(operation: string, args: string[], count: number): string[] {
  if (args.length !== count || args.some((value) => value.startsWith('--'))) {
    throw new Error(`${operation} accepts ${count === 0 ? 'no arguments' : `${count} argument${count === 1 ? '' : 's'}`}`);
  }
  return args;
}

function parseCreateArguments(args: string[]): { name: string; typeId: string; parent?: string; description?: string } {
  const values = new Map<string, string>();
  const allowed = new Set(['--name', '--type-id', '--parent', '--description']);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (!allowed.has(flag)) throw new Error(`Unknown argument: ${flag ?? '(missing)'}`);
    if (values.has(flag)) throw new Error(`Duplicate argument: ${flag}`);
    values.set(flag, required(args[index + 1], flag));
  }
  return {
    name: required(values.get('--name'), '--name'),
    typeId: required(values.get('--type-id'), '--type-id'),
    parent: values.get('--parent'),
    description: values.get('--description'),
  };
}
