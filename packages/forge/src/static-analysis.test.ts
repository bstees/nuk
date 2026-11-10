import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { FORGE_PACKAGE_ROOT } from './proof.ts';
import { analyzeSource } from './static-analysis.ts';

void test('accepts the safe DOM-only fixture', async () => {
  const path = resolve(FORGE_PACKAGE_ROOT, 'fixtures/source/safe-component.ts');
  const report = analyzeSource({ fileName: path, source: await readFile(path, 'utf8') });
  assert.equal(report.passed, true);
  assert.deepEqual(report.findings, []);
});

void test('rejects network and storage access', async () => {
  const report = await analyzeFixture('unsafe-network-storage.ts');
  const categories = new Set(report.findings.map((finding) => finding.category));
  assert.equal(report.passed, false);
  assert.ok(categories.has('network-access'));
  assert.ok(categories.has('storage-access'));
});

void test('rejects dynamic execution and inline injection', async () => {
  const report = await analyzeFixture('unsafe-dynamic-injection.ts');
  const categories = new Set(report.findings.map((finding) => finding.category));
  assert.equal(report.passed, false);
  assert.ok(categories.has('dynamic-execution'));
  assert.ok(categories.has('inline-script-injection'));
  assert.ok(report.findings.length >= 7);
});

void test('rejects undeclared bare imports and accepts explicitly declared packages', async () => {
  const path = resolve(FORGE_PACKAGE_ROOT, 'fixtures/source/unsafe-undeclared-import.ts');
  const source = await readFile(path, 'utf8');
  assert.ok(
    analyzeSource({ fileName: path, source }).findings.some(
      (finding) => finding.category === 'undeclared-dependency',
    ),
  );
  assert.equal(
    analyzeSource({ fileName: path, source, declaredDependencies: ['left-pad'] }).passed,
    true,
  );
});

async function analyzeFixture(file: string) {
  const path = resolve(FORGE_PACKAGE_ROOT, 'fixtures/source', file);
  return analyzeSource({ fileName: path, source: await readFile(path, 'utf8') });
}
