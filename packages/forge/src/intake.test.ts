import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { evaluateIntake, parseIntakeRecord, parseSourcePolicy } from './intake.ts';
import { FORGE_PACKAGE_ROOT } from './proof.ts';

void test('v1 intake policy allows documented facts with explicit clean-room declarations', async () => {
  const policy = parseSourcePolicy(await fixtureJson('policies/v1/source-policy.json'));
  const record = parseIntakeRecord(await fixtureJson('fixtures/intake/allowed.json'));
  const decision = evaluateIntake(record, policy);
  assert.equal(decision.allowed, true);
  assert.equal(decision.findings.length, 0);
  assert.match(decision.recordDigest, /^[a-f0-9]{64}$/u);
});

void test('v1 intake policy fails closed for source, license, URI, material, and declaration violations', async () => {
  const policy = parseSourcePolicy(await fixtureJson('policies/v1/source-policy.json'));
  const record = parseIntakeRecord(await fixtureJson('fixtures/intake/denied-source.json'));
  const decision = evaluateIntake(record, policy);
  const codes = new Set(decision.findings.map((finding) => finding.code));
  assert.equal(decision.allowed, false);
  assert.ok(codes.has('INTAKE_DECLARATION_FAILED'));
  assert.ok(codes.has('INTAKE_SOURCE_KIND_DENIED'));
  assert.ok(codes.has('INTAKE_LICENSE_DENIED'));
  assert.ok(codes.has('INTAKE_MATERIAL_DENIED'));
  assert.ok(codes.has('INTAKE_COPIED_EXCERPT'));
  assert.ok(codes.has('INTAKE_URI_SCHEME_DENIED'));
});

async function fixtureJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(FORGE_PACKAGE_ROOT, path), 'utf8')) as unknown;
}
