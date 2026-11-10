import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { checkConformance } from './conformance.ts';
import { generateCandidate } from './generator.ts';
import { runBehaviorParity } from './parity.ts';
import { FORGE_PACKAGE_ROOT } from './proof.ts';
import { parseComponentSpec } from './spec.ts';
import { analyzeSource } from './static-analysis.ts';

void test('generation is deterministic and all candidate gates pass', async () => {
  const spec = parseComponentSpec(
    JSON.parse(
      await readFile(resolve(FORGE_PACKAGE_ROOT, 'specs/nuk-dismissible-alert.v1.json'), 'utf8'),
    ) as unknown,
  );
  const template = await readFile(
    resolve(FORGE_PACKAGE_ROOT, 'templates/v1/dismissible-alert.ts.tpl'),
    'utf8',
  );
  const first = generateCandidate(spec, template);
  const second = generateCandidate(spec, template);
  assert.deepEqual(first, second);
  assert.match(first.source, /customElements\.define\(TAG_NAME, NukDismissibleAlert\)/u);
  assert.equal(
    analyzeSource({ fileName: first.manifest.sourceFile, source: first.source }).passed,
    true,
  );
  assert.equal(checkConformance(spec, first.source).passed, true);
  const parity = await runBehaviorParity(spec, first.source);
  assert.equal(parity.passed, true, JSON.stringify(parity.cases));
  assert.deepEqual(
    parity.cases.map((testCase) => testCase.id),
    ['BEH-001', 'BEH-002', 'BEH-003', 'ACC-003'],
  );
});

void test('the normalized namespace is configurable and binds ids and events', async () => {
  const raw = JSON.parse(
    await readFile(resolve(FORGE_PACKAGE_ROOT, 'specs/nuk-dismissible-alert.v1.json'), 'utf8'),
  ) as Record<string, unknown>;
  raw.id = 'acme-dismissible-alert';
  raw.namespace = 'acme-';
  raw.semantics = { ...(raw.semantics as object), hostElement: 'acme-dismissible-alert' };
  raw.events = [
    { name: 'acme-dismiss', bubbles: true, composed: true, detail: { dismissed: 'boolean' } },
    { name: 'acme-config-error', bubbles: true, composed: true, detail: { code: 'string' } },
  ];
  const spec = parseComponentSpec(raw);
  const template = await readFile(
    resolve(FORGE_PACKAGE_ROOT, 'templates/v1/dismissible-alert.ts.tpl'),
    'utf8',
  );
  const candidate = generateCandidate(spec, template);
  assert.match(candidate.source, /'acme-dismissible-alert'/u);
  assert.match(candidate.source, /'acme-dismiss'/u);
  assert.doesNotMatch(candidate.source, /nuk-dismissible-alert/u);
  assert.equal(checkConformance(spec, candidate.source).passed, true);
});

void test('spec parsing rejects a component outside its declared namespace', async () => {
  const raw = JSON.parse(
    await readFile(resolve(FORGE_PACKAGE_ROOT, 'specs/nuk-dismissible-alert.v1.json'), 'utf8'),
  ) as Record<string, unknown>;
  raw.namespace = 'acme-';
  assert.throws(() => parseComponentSpec(raw), /must begin with component spec\.namespace/u);
});
