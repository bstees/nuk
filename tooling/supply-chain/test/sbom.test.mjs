import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { generateSbom } from '../sbom-lib.mjs';

test('generates a deterministic CycloneDX dependency graph without network access', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuk-sbom-'));
  await mkdir(join(root, 'packages', 'widget'), { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: '@nuk-ui/root', version: '1.0.0', license: 'MIT' }),
  );
  await writeFile(
    join(root, 'packages', 'widget', 'package.json'),
    JSON.stringify({
      name: '@nuk-ui/widget',
      version: '1.2.3',
      license: 'MIT',
      dependencies: { nanoid: '5.1.6' },
      devDependencies: { vitest: '4.0.0' },
    }),
  );

  const first = await generateSbom({ rootDirectory: root });
  const second = await generateSbom({ rootDirectory: root });
  assert.deepEqual(first, second);
  assert.equal(first.bomFormat, 'CycloneDX');
  assert.equal(first.specVersion, '1.6');
  assert.equal(first.metadata.timestamp, '1970-01-01T00:00:00.000Z');
  assert.ok(first.components.some((component) => component.name === 'widget'));
  assert.ok(first.components.some((component) => component.name === 'nanoid'));
  assert.ok(!first.components.some((component) => component.name === 'vitest'));
  assert.ok(first.dependencies.some((dependency) => dependency.dependsOn.length > 0));
});

test('development dependencies are opt-in and timestamps accept SOURCE_DATE_EPOCH form', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuk-sbom-dev-'));
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name: '@nuk-ui/root',
      version: '1.0.0',
      devDependencies: { eslint: '10.0.0' },
    }),
  );
  const sbom = await generateSbom({ rootDirectory: root, includeDev: true, timestamp: '0' });
  assert.equal(sbom.metadata.timestamp, '1970-01-01T00:00:00.000Z');
  assert.ok(sbom.components.some((component) => component.name === 'eslint'));
});
