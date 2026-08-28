import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const skillsRoot = join(process.cwd(), 'skills');

function readSkill(skill: string): string {
  return readFileSync(join(skillsRoot, skill, 'SKILL.md'), 'utf8');
}

const skillNames = ['plane-create-subticket', 'plane-create-user-story', 'plane-search-tickets', 'plane-update-status'];

test.each(skillNames)('%s uses the official MCP and individual OAuth instead of local API-key setup', (skill) => {
  const instructions = readSkill(skill);
  expect(instructions).toMatch(/Official Plane MCP/i);
  expect(instructions).toMatch(/individual Plane OAuth/i);
  expect(instructions).not.toMatch(/PLANE_API_KEY|PLANE_WORKSPACE_SLUG|PLANE_PROJECT_ID|npx @anaszulkfli/i);
});

test('search uses MCP to list possible matches and retrieve only a selected work item', () => {
  const skill = readSkill('plane-search-tickets');
  expect(skill).toMatch(/search.*work items/i);
  expect(skill).toMatch(/possible matches/i);
  expect(skill).toMatch(/selected/i);
  expect(skill).toMatch(/never changes Plane data/i);
});

test.each(['plane-create-subticket', 'plane-create-user-story', 'plane-update-status'])(
  '%s requires explicit confirmation immediately before its MCP mutation',
  (skill) => {
    const instructions = readSkill(skill);
    expect(instructions).toMatch(/explicit confirmation immediately before/i);
    expect(instructions).toMatch(/MCP.*(?:create|update|mutation)|(?:create|update|mutation).*MCP/i);
  },
);
