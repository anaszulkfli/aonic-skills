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

test('search resolves complete Plane identifiers before retrieving details', () => {
  const skill = readSkill('plane-search-tickets');
  expect(skill).toMatch(/complete Plane identifier/i);
  expect(skill).toMatch(/exactly matches/i);
  expect(skill).toMatch(/plane get <resolved-uuid>/i);
});

test('search does not present undocumented type or state fields', () => {
  const skill = readSkill('plane-search-tickets');
  expect(skill).toMatch(/only.*fields.*returned/i);
  expect(skill).not.toMatch(/names, types, and states needed to choose/i);
});

test('search reports authentication and transient failures without mutating', () => {
  const skill = readSkill('plane-search-tickets');
  expect(skill).toMatch(/401.*403/i);
  expect(skill).toMatch(/429.*500.*502.*503.*504/i);
});

test('subticket leaves child type to Plane unless the caller supplies a UUID', () => {
  const skill = readSkill('plane-create-subticket');
  expect(skill).toMatch(/type: Plane default/i);
  expect(skill).toMatch(/only if the caller provides a concrete type UUID/i);
  expect(skill).not.toMatch(/run `plane types`/i);
});

test('subticket creation follows Plane work-item creation semantics', () => {
  const skill = readSkill('plane-create-subticket');
  expect(skill).toMatch(/required `name`/i);
  expect(skill).toMatch(/`parent`/i);
  expect(skill).toMatch(/`type_id`/i);
  expect(skill).toMatch(/description_html/i);
  expect(skill).toMatch(/HTTP 201/i);
  expect(skill).toMatch(/401.*403/i);
  expect(skill).toMatch(/429.*500.*502.*503.*504/i);
});

test('User Story creation follows Plane work-item creation semantics', () => {
  const skill = readSkill('plane-create-user-story');
  expect(skill).toMatch(/required `name`/i);
  expect(skill).toMatch(/`type_id`/i);
  expect(skill).toMatch(/description_html/i);
  expect(skill).toMatch(/HTTP 201/i);
  expect(skill).toMatch(/run `plane types`/i);
});
