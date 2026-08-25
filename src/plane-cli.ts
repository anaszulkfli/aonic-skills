import { PlaneClient } from './plane/client.js';
import { readPlaneConfig } from './plane/config.js';
import { PlaneWorkItems } from './plane/work-items.js';

type Environment = Record<string, string | undefined>;

export async function runPlaneCommand(args: string[], environment: Environment = process.env): Promise<unknown> {
  const [operation, ...rest] = args;
  const config = readPlaneConfig(environment);
  const workItems = new PlaneWorkItems(new PlaneClient(config), config);

  switch (operation) {
    case 'get': return workItems.getWorkItem(required(rest[0], 'work item id'));
    case 'search': return workItems.searchWorkItems(required(rest[0], 'search query'));
    case 'types': return workItems.findUserStoryType();
    case 'states': return workItems.listStates();
    case 'create': return workItems.createWorkItem({
      name: required(option(rest, '--name'), '--name'),
      typeId: required(option(rest, '--type-id'), '--type-id'),
      parent: option(rest, '--parent'),
      description: option(rest, '--description'),
    });
    case 'set-state': return workItems.updateWorkItemState(required(rest[0], 'work item id'), required(rest[1], 'state id'));
    default: throw new Error(`Unknown Plane operation: ${operation ?? '(missing)'}`);
  }
}

export function redactError(error: unknown, environment: Environment = process.env): string {
  const message = error instanceof Error ? error.message : String(error);
  const key = environment.PLANE_API_KEY;
  return key ? message.replaceAll(key, '[REDACTED]') : message;
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function required(value: string | undefined, name: string): string {
  if (!value || value.startsWith('--')) throw new Error(`Missing required argument: ${name}`);
  return value;
}
