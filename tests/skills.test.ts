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
