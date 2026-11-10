import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { createPendingApproval, promoteApprovedCandidate } from './approval.ts';
import { checkConformance } from './conformance.ts';
import { generateCandidate } from './generator.ts';
import { evaluateIntake, parseIntakeRecord, parseSourcePolicy } from './intake.ts';
import { runBehaviorParity } from './parity.ts';
import { createProvenanceReport, renderProvenanceMarkdown } from './provenance.ts';
import { parseComponentSpec } from './spec.ts';
import { analyzeSource } from './static-analysis.ts';
import type { ArtifactBinding, JsonValue } from './types.ts';
import { asJsonValue, readJson, sha256, stableJson, writeJson, writeText } from './util.ts';

const executeFile = promisify(execFile);
export const FORGE_PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_ROOT = resolve(FORGE_PACKAGE_ROOT, '../..');

export interface ProofResult {
  readonly workDirectory: string;
  readonly candidate: string;
  readonly provenance: string;
  readonly sbom: string;
  readonly approvalRequest: string;
  readonly automatedGatesPassed: true;
  readonly promotionDeniedPendingHumanReview: true;
}

export async function runProof(workDirectory: string): Promise<ProofResult> {
  const outputRoot = resolve(workDirectory);
  assertSafeOutputDirectory(outputRoot);
  const policyPath = resolve(FORGE_PACKAGE_ROOT, 'policies/v1/source-policy.json');
  const intakePath = resolve(FORGE_PACKAGE_ROOT, 'intake/nuk-dismissible-alert.v1.json');
  const specPath = resolve(FORGE_PACKAGE_ROOT, 'specs/nuk-dismissible-alert.v1.json');
  const templatePath = resolve(FORGE_PACKAGE_ROOT, 'templates/v1/dismissible-alert.ts.tpl');
  const promptPath = resolve(FORGE_PACKAGE_ROOT, 'prompts/v1/system.md');
  const skillPath = resolve(FORGE_PACKAGE_ROOT, 'skills/v1/clean-room-component.md');

  const policy = parseSourcePolicy(await readJson(policyPath));
  const intake = parseIntakeRecord(await readJson(intakePath));
  const spec = parseComponentSpec(await readJson(specPath));
  const template = await readFile(templatePath, 'utf8');
  const prompt = await readFile(promptPath, 'utf8');
  const skill = await readFile(skillPath, 'utf8');
  const policyContents = await readFile(policyPath, 'utf8');
  const intakeDecision = evaluateIntake(intake, policy);
  if (!intakeDecision.allowed) {
    throw new Error(`Proof intake was denied: ${JSON.stringify(intakeDecision.findings)}`);
  }
  if (intake.componentId !== spec.id) {
    throw new Error('Proof intake and normalized spec identify different components.');
  }

  const canonicalSpec = stableJson(asJsonValue(spec));
  const generated = generateCandidate(spec, template);
  const candidateRelative = `candidate/${generated.manifest.sourceFile}`;
  const candidatePath = resolve(outputRoot, candidateRelative);
  const specRelative = 'inputs/normalized-spec.json';
  const specSnapshotPath = resolve(outputRoot, specRelative);
  const analysis = analyzeSource({
    fileName: generated.manifest.sourceFile,
    source: generated.source,
  });
  if (!analysis.passed) {
    throw new Error(
      `Generated candidate failed static analysis: ${JSON.stringify(analysis.findings)}`,
    );
  }
  const conformance = checkConformance(spec, generated.source);
  if (!conformance.passed) {
    throw new Error(
      `Generated candidate failed conformance: ${JSON.stringify(conformance.findings)}`,
    );
  }
  const parity = await runBehaviorParity(spec, generated.source);
  if (!parity.passed) {
    throw new Error(
      `Generated candidate failed public-behavior parity: ${JSON.stringify(parity.cases)}`,
    );
  }

  await writeText(candidatePath, generated.source);
  await writeText(specSnapshotPath, canonicalSpec);
  await writeJson(resolve(outputRoot, 'candidate/manifest.json'), asJsonValue(generated.manifest));
  await writeJson(resolve(outputRoot, 'reports/intake-decision.json'), asJsonValue(intakeDecision));
  const analysisContents = stableJson(asJsonValue(analysis));
  const conformanceContents = stableJson(asJsonValue(conformance));
  const parityContents = stableJson(asJsonValue(parity));
  await writeText(resolve(outputRoot, 'reports/static-analysis.json'), analysisContents);
  await writeText(resolve(outputRoot, 'reports/conformance.json'), conformanceContents);
  await writeText(resolve(outputRoot, 'reports/behavioral-parity.json'), parityContents);

  const sbomRelative = 'reports/sbom.cdx.json';
  const sbomPath = resolve(outputRoot, sbomRelative);
  await executeFile(process.execPath, [
    resolve(WORKSPACE_ROOT, 'tooling/supply-chain/generate-sbom.mjs'),
    '--root',
    FORGE_PACKAGE_ROOT,
    '--output',
    sbomPath,
    '--timestamp',
    intake.recordedAt,
  ]);
  const sbomContents = await readFile(sbomPath, 'utf8');

  const provenance = createProvenanceReport({
    spec,
    intake,
    intakeDecision,
    manifest: generated.manifest,
    candidate: artifact(candidateRelative, generated.source),
    policy: artifact(relative(outputRoot, policyPath), policyContents),
    normalizedSpec: artifact(specRelative, canonicalSpec),
    template: artifact(relative(outputRoot, templatePath), template),
    prompt: artifact(relative(outputRoot, promptPath), prompt),
    skill: artifact(relative(outputRoot, skillPath), skill),
    analysis,
    analysisArtifact: artifact('reports/static-analysis.json', analysisContents),
    conformance,
    conformanceArtifact: artifact('reports/conformance.json', conformanceContents),
    parityPassed: parity.passed,
    parityArtifact: artifact('reports/behavioral-parity.json', parityContents),
    sbomArtifact: artifact(sbomRelative, sbomContents),
  });
  const provenanceContents = stableJson(asJsonValue(provenance));
  const provenanceRelative = 'reports/provenance.json';
  const provenancePath = resolve(outputRoot, provenanceRelative);
  await writeText(provenancePath, provenanceContents);
  await writeText(
    resolve(outputRoot, 'reports/provenance.md'),
    renderProvenanceMarkdown(provenance),
  );

  const approval = createPendingApproval({
    requestId: intake.requestId,
    componentId: spec.id,
    candidate: binding(candidateRelative, generated.source),
    spec: binding(specRelative, canonicalSpec),
    analysisReport: binding('reports/static-analysis.json', analysisContents),
    conformanceReport: binding('reports/conformance.json', conformanceContents),
    provenanceReport: binding(provenanceRelative, provenanceContents),
  });
  const approvalPath = resolve(outputRoot, 'approval.pending.json');
  await writeJson(approvalPath, asJsonValue(approval));

  let denied = false;
  try {
    await promoteApprovedCandidate(
      approvalPath,
      resolve(outputRoot, 'promoted/should-not-exist.ts'),
    );
  } catch (error) {
    denied = error instanceof Error && error.message.includes('status is "pending"');
  }
  if (!denied) {
    throw new Error('Fail-closed proof failed: a pending approval was not explicitly denied.');
  }

  const result: ProofResult = {
    workDirectory: outputRoot,
    candidate: candidatePath,
    provenance: provenancePath,
    sbom: sbomPath,
    approvalRequest: approvalPath,
    automatedGatesPassed: true,
    promotionDeniedPendingHumanReview: true,
  };
  await writeJson(resolve(outputRoot, 'proof-summary.json'), result as unknown as JsonValue);
  return result;
}

function artifact(
  path: string,
  contents: string,
): { readonly path: string; readonly contents: string } {
  return { path, contents };
}

function binding(path: string, contents: string): ArtifactBinding {
  return { path, sha256: sha256(contents) };
}

function assertSafeOutputDirectory(path: string): void {
  const parsed = new URL(`file://${path.endsWith('/') ? path : `${path}/`}`);
  if (parsed.pathname === '/' || path === FORGE_PACKAGE_ROOT || path === WORKSPACE_ROOT) {
    throw new Error(`Refusing unsafe proof output directory: ${path}`);
  }
}
