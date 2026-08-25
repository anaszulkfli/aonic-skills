import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const skillsRoot = join(process.cwd(), 'skills');

function readSkill(skill: string): string {
  return readFileSync(join(skillsRoot, skill, 'SKILL.md'), 'utf8');
}

test.each(['plane-create-subticket', 'plane-create-user-story', 'plane-update-status'])(
  '%s requires confirmation before mutation',
  (skill) => expect(readSkill(skill)).toMatch(/confirm.*immediately before/i),
);

test('search is read-only', () => expect(readSkill('plane-search-tickets')).toMatch(/never changes Plane data/i));

test('subticket uses the CLI-supported User Story child type', () => {
  const skill = readSkill('plane-create-subticket');
  expect(skill).toMatch(/default child type.*exactly `User Story`/i);
  expect(skill).not.toMatch(/requested child/i);
});
