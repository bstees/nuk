import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';

import { checkConformance } from './conformance.ts';
import { runBehaviorParity } from './parity.ts';
import { parseComponentSpec } from './spec.ts';
import { analyzeSource } from './static-analysis.ts';
import type { ApprovalRecord, ArtifactBinding } from './types.ts';
import {
  APPROVAL_ATTESTATION,
  assertRecord,
  assertString,
  readJson,
  sha256,
  writeText,
} from './util.ts';

const SHA256 = /^[a-f0-9]{64}$/u;
const AUTOMATION_REVIEWER = /(?:^|\b)(?:automation|bot|ci|forge)(?:\b|$)/iu;

export interface ApprovalRequestInput {
  readonly requestId: string;
  readonly componentId: string;
  readonly candidate: ArtifactBinding;
  readonly spec: ArtifactBinding;
  readonly analysisReport: ArtifactBinding;
  readonly conformanceReport: ArtifactBinding;
  readonly provenanceReport: ArtifactBinding;
}

export interface PromotionResult {
  readonly componentId: string;
  readonly destination: string;
  readonly candidateDigest: string;
  readonly reviewer: string;
  readonly reviewedAt: string;
}

export function createPendingApproval(input: ApprovalRequestInput): ApprovalRecord {
  return {
    schemaVersion: '1.0.0',
    requestId: input.requestId,
    componentId: input.componentId,
    candidate: input.candidate,
    spec: input.spec,
    analysisReport: input.analysisReport,
    conformanceReport: input.conformanceReport,
    provenanceReport: input.provenanceReport,
    status: 'pending',
    reviewer: null,
    reviewedAt: null,
    rationale: null,
    attestation: null,
  };
}

export function parseApprovalRecord(value: unknown): ApprovalRecord {
  assertRecord(value, 'approval record');
  if (value.schemaVersion !== '1.0.0') {
    throw new TypeError('approval record.schemaVersion must be "1.0.0".');
  }
  assertString(value.requestId, 'approval record.requestId');
  assertString(value.componentId, 'approval record.componentId');
  for (const field of [
    'candidate',
    'spec',
    'analysisReport',
    'conformanceReport',
    'provenanceReport',
  ] as const) {
    assertBinding(value[field], `approval record.${field}`);
  }
  if (!['approved', 'pending', 'rejected'].includes(String(value.status))) {
    throw new TypeError('approval record.status is invalid.');
  }
  for (const field of ['reviewer', 'reviewedAt', 'rationale', 'attestation'] as const) {
    if (value[field] !== null && typeof value[field] !== 'string') {
      throw new TypeError(`approval record.${field} must be a string or null.`);
    }
  }
  return value as unknown as ApprovalRecord;
}

export async function promoteApprovedCandidate(
  approvalPath: string,
  destination: string,
): Promise<PromotionResult> {
  const approval = parseApprovalRecord(await readJson(approvalPath));
  assertHumanApproval(approval);
  const baseDirectory = dirname(resolve(approvalPath));
  const artifactBindings = [
    ['candidate', approval.candidate],
    ['spec', approval.spec],
    ['analysisReport', approval.analysisReport],
    ['conformanceReport', approval.conformanceReport],
    ['provenanceReport', approval.provenanceReport],
  ] as const;
  const artifacts = await Promise.all(
    artifactBindings.map(async ([name, binding]) => {
      const path = isAbsolute(binding.path) ? binding.path : resolve(baseDirectory, binding.path);
      const contents = await readFile(path, 'utf8');
      if (sha256(contents) !== binding.sha256) {
        throw new Error(`Approval binding for ${name} does not match ${path}.`);
      }
      return [name, { path, contents }] as const;
    }),
  );
  const byName = Object.fromEntries(artifacts) as Record<
    string,
    { readonly path: string; readonly contents: string }
  >;
  const candidate = requireArtifact(byName, 'candidate');
  const specArtifact = requireArtifact(byName, 'spec');
  const analysisArtifact = requireArtifact(byName, 'analysisReport');
  const conformanceArtifact = requireArtifact(byName, 'conformanceReport');
  const provenanceArtifact = requireArtifact(byName, 'provenanceReport');

  const spec = parseComponentSpec(JSON.parse(specArtifact.contents) as unknown);
  if (spec.id !== approval.componentId) {
    throw new Error('Approval component id does not match the normalized spec.');
  }
  const storedAnalysis = parsePassedReport(analysisArtifact.contents, 'analysis report');
  const storedConformance = parsePassedReport(conformanceArtifact.contents, 'conformance report');
  const provenance = parseProvenance(provenanceArtifact.contents);
  const candidateDigest = sha256(candidate.contents);
  if (
    storedAnalysis.sourceDigest !== candidateDigest ||
    storedConformance.sourceDigest !== candidateDigest ||
    provenance.candidateDigest !== candidateDigest
  ) {
    throw new Error('Stored gate reports do not bind the approved candidate digest.');
  }
  if (storedConformance.specDigest !== sha256(specArtifact.contents)) {
    throw new Error('Stored conformance report does not bind the approved spec.');
  }

  const freshAnalysis = analyzeSource({
    fileName: candidate.path,
    source: candidate.contents,
    declaredDependencies: storedAnalysis.declaredDependencies,
  });
  if (!freshAnalysis.passed) {
    throw new Error('Fresh static analysis failed during promotion.');
  }
  const freshConformance = checkConformance(spec, candidate.contents);
  if (!freshConformance.passed) {
    throw new Error('Fresh conformance checks failed during promotion.');
  }
  const freshParity = await runBehaviorParity(spec, candidate.contents);
  if (!freshParity.passed) {
    throw new Error('Fresh public-behavior parity checks failed during promotion.');
  }

  await writeText(destination, candidate.contents);
  return {
    componentId: approval.componentId,
    destination: resolve(destination),
    candidateDigest,
    reviewer: approval.reviewer ?? '',
    reviewedAt: approval.reviewedAt ?? '',
  };
}

function assertHumanApproval(approval: ApprovalRecord): void {
  if (approval.status !== 'approved') {
    throw new Error(`Promotion denied: approval status is "${approval.status}".`);
  }
  if (!approval.reviewer || approval.reviewer.trim().length < 2) {
    throw new Error('Promotion denied: a named human reviewer is required.');
  }
  if (AUTOMATION_REVIEWER.test(approval.reviewer)) {
    throw new Error('Promotion denied: automation cannot be the reviewer.');
  }
  if (!approval.reviewedAt || Number.isNaN(Date.parse(approval.reviewedAt))) {
    throw new Error('Promotion denied: reviewedAt must be a valid date-time.');
  }
  if (!approval.rationale || approval.rationale.trim().length < 20) {
    throw new Error('Promotion denied: a substantive review rationale is required.');
  }
  if (approval.attestation !== APPROVAL_ATTESTATION) {
    throw new Error('Promotion denied: the exact human-review attestation is required.');
  }
}

function assertBinding(value: unknown, label: string): asserts value is ArtifactBinding {
  assertRecord(value, label);
  assertString(value.path, `${label}.path`);
  if (typeof value.sha256 !== 'string' || !SHA256.test(value.sha256)) {
    throw new TypeError(`${label}.sha256 must be a lowercase SHA-256 digest.`);
  }
}

function parsePassedReport(
  contents: string,
  label: string,
): {
  readonly sourceDigest: string;
  readonly specDigest?: string;
  readonly declaredDependencies: readonly string[];
} {
  const value = JSON.parse(contents) as unknown;
  assertRecord(value, label);
  if (value.passed !== true) {
    throw new Error(`${label} is not passing.`);
  }
  assertString(value.sourceDigest, `${label}.sourceDigest`);
  const specDigest = typeof value.specDigest === 'string' ? value.specDigest : undefined;
  const dependencies = Array.isArray(value.declaredDependencies)
    ? value.declaredDependencies.filter((entry): entry is string => typeof entry === 'string')
    : [];
  return {
    sourceDigest: value.sourceDigest,
    ...(specDigest === undefined ? {} : { specDigest }),
    declaredDependencies: dependencies,
  };
}

function parseProvenance(contents: string): { readonly candidateDigest: string } {
  const value = JSON.parse(contents) as unknown;
  assertRecord(value, 'provenance report');
  assertRecord(value.candidate, 'provenance report.candidate');
  assertString(value.candidate.sha256, 'provenance report.candidate.sha256');
  assertRecord(value.humanGate, 'provenance report.humanGate');
  if (value.humanGate.required !== true || value.humanGate.status !== 'awaiting-human-approval') {
    throw new Error('Provenance report does not require the human approval gate.');
  }
  return { candidateDigest: value.candidate.sha256 };
}

function requireArtifact(
  artifacts: Readonly<Record<string, { readonly path: string; readonly contents: string }>>,
  name: string,
): { readonly path: string; readonly contents: string } {
  const artifact = artifacts[name];
  if (!artifact) {
    throw new Error(`Missing bound ${name} artifact.`);
  }
  return artifact;
}
