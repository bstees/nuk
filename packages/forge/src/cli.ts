#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import { createPendingApproval, promoteApprovedCandidate } from './approval.ts';
import { checkConformance } from './conformance.ts';
import { generateCandidate } from './generator.ts';
import { evaluateIntake, parseIntakeRecord, parseSourcePolicy } from './intake.ts';
import { FORGE_PACKAGE_ROOT, runProof } from './proof.ts';
import { parseComponentSpec } from './spec.ts';
import { analyzeSource } from './static-analysis.ts';
import type { ArtifactBinding } from './types.ts';
import { asJsonValue, readJson, sha256, writeJson, writeText } from './util.ts';

try {
  await main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

async function main(arguments_: readonly string[]): Promise<void> {
  const command = arguments_[0] ?? 'help';
  const options = parseOptions(arguments_.slice(1));
  if (command === 'proof') {
    const result = await runProof(resolve(options['work-dir'] ?? 'work/proof'));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === 'fixtures') {
    await verifyFixtures();
    process.stdout.write('Forge intake and static-analysis fixtures passed.\n');
    return;
  }
  if (command === 'intake') {
    const record = parseIntakeRecord(await readJson(required(options, 'record')));
    const policy = parseSourcePolicy(await readJson(required(options, 'policy')));
    const decision = evaluateIntake(record, policy);
    await writeJson(required(options, 'out'), asJsonValue(decision));
    if (!decision.allowed) throw new Error('Source intake was denied.');
    return;
  }
  if (command === 'generate') {
    const spec = parseComponentSpec(await readJson(required(options, 'spec')));
    const generated = generateCandidate(
      spec,
      await readFile(required(options, 'template'), 'utf8'),
    );
    await writeText(required(options, 'out'), generated.source);
    await writeJson(required(options, 'manifest'), asJsonValue(generated.manifest));
    return;
  }
  if (command === 'analyze') {
    const sourcePath = required(options, 'source');
    const source = await readFile(sourcePath, 'utf8');
    const dependencies = options.package
      ? declaredDependencies(await readJson(options.package))
      : [];
    const report = analyzeSource({
      fileName: sourcePath,
      source,
      declaredDependencies: dependencies,
    });
    await writeJson(required(options, 'out'), asJsonValue(report));
    if (!report.passed) throw new Error('Static analysis failed.');
    return;
  }
  if (command === 'conformance') {
    const spec = parseComponentSpec(await readJson(required(options, 'spec')));
    const source = await readFile(required(options, 'source'), 'utf8');
    const report = checkConformance(spec, source);
    await writeJson(required(options, 'out'), asJsonValue(report));
    if (!report.passed) throw new Error('Conformance checks failed.');
    return;
  }
  if (command === 'approval-request') {
    await createApprovalRequest(options);
    return;
  }
  if (command === 'promote') {
    const result = await promoteApprovedCandidate(
      required(options, 'approval'),
      required(options, 'destination'),
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command !== 'help') throw new Error(`Unknown Forge command: ${command}`);
  process.stdout.write(`${usage()}\n`);
}

async function createApprovalRequest(options: Readonly<Record<string, string>>): Promise<void> {
  const output = resolve(required(options, 'out'));
  const base = dirname(output);
  const paths = {
    candidate: resolve(required(options, 'candidate')),
    spec: resolve(required(options, 'spec')),
    analysisReport: resolve(required(options, 'analysis')),
    conformanceReport: resolve(required(options, 'conformance')),
    provenanceReport: resolve(required(options, 'provenance')),
  };
  const entries = await Promise.all(
    Object.entries(paths).map(async ([key, path]) => [key, await bindFile(path, base)] as const),
  );
  const bindings = Object.fromEntries(entries) as Record<string, ArtifactBinding>;
  const approval = createPendingApproval({
    requestId: required(options, 'request-id'),
    componentId: required(options, 'component-id'),
    candidate: requireBinding(bindings, 'candidate'),
    spec: requireBinding(bindings, 'spec'),
    analysisReport: requireBinding(bindings, 'analysisReport'),
    conformanceReport: requireBinding(bindings, 'conformanceReport'),
    provenanceReport: requireBinding(bindings, 'provenanceReport'),
  });
  await writeJson(output, asJsonValue(approval));
}

async function bindFile(path: string, base: string): Promise<ArtifactBinding> {
  const contents = await readFile(path, 'utf8');
  return { path: relative(base, path), sha256: sha256(contents) };
}

function requireBinding(
  bindings: Readonly<Record<string, ArtifactBinding>>,
  key: string,
): ArtifactBinding {
  const binding = bindings[key];
  if (!binding) throw new Error(`Missing approval binding: ${key}`);
  return binding;
}

async function verifyFixtures(): Promise<void> {
  const policy = parseSourcePolicy(
    await readJson(resolve(FORGE_PACKAGE_ROOT, 'policies/v1/source-policy.json')),
  );
  const allowed = evaluateIntake(
    parseIntakeRecord(await readJson(resolve(FORGE_PACKAGE_ROOT, 'fixtures/intake/allowed.json'))),
    policy,
  );
  const denied = evaluateIntake(
    parseIntakeRecord(
      await readJson(resolve(FORGE_PACKAGE_ROOT, 'fixtures/intake/denied-source.json')),
    ),
    policy,
  );
  if (!allowed.allowed || denied.allowed) throw new Error('Intake fixture expectation failed.');
  const safePath = resolve(FORGE_PACKAGE_ROOT, 'fixtures/source/safe-component.ts');
  const safe = analyzeSource({ fileName: safePath, source: await readFile(safePath, 'utf8') });
  if (!safe.passed) throw new Error('Safe source fixture was rejected.');
  for (const file of [
    'unsafe-dynamic-injection.ts',
    'unsafe-network-storage.ts',
    'unsafe-undeclared-import.ts',
  ]) {
    const path = resolve(FORGE_PACKAGE_ROOT, 'fixtures/source', file);
    const report = analyzeSource({ fileName: path, source: await readFile(path, 'utf8') });
    if (report.passed) throw new Error(`Unsafe source fixture was accepted: ${file}`);
  }
}

function declaredDependencies(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const manifest = value as Record<string, unknown>;
  return ['dependencies', 'optionalDependencies', 'peerDependencies'].flatMap((field) => {
    const group = manifest[field];
    return group && typeof group === 'object' && !Array.isArray(group) ? Object.keys(group) : [];
  });
}

function parseOptions(arguments_: readonly string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let index = 0; index < arguments_.length; index += 2) {
    const key = arguments_[index];
    const value = arguments_[index + 1];
    if (!key?.startsWith('--') || !value) throw new Error(`Invalid option near ${key ?? '<end>'}.`);
    options[key.slice(2)] = value;
  }
  return options;
}

function required(options: Readonly<Record<string, string>>, key: string): string {
  const value = options[key];
  if (!value) throw new Error(`--${key} is required.`);
  return value;
}

function usage(): string {
  return `nuk-forge commands:
  proof [--work-dir PATH]
  fixtures
  intake --record FILE --policy FILE --out FILE
  generate --spec FILE --template FILE --out FILE --manifest FILE
  analyze --source FILE [--package FILE] --out FILE
  conformance --spec FILE --source FILE --out FILE
  approval-request --request-id ID --component-id ID --candidate FILE --spec FILE --analysis FILE --conformance FILE --provenance FILE --out FILE
  promote --approval FILE --destination FILE`;
}
