import type { IntakeDecision, IntakeFinding, IntakeRecord, SourcePolicy } from './types.ts';
import {
  asJsonValue,
  assertRecord,
  assertString,
  assertStringArray,
  sha256,
  stableJson,
} from './util.ts';

const DECLARATION_KEYS = [
  'implementationSourceInspected',
  'sourceMapsInspected',
  'decompiledArtifactsInspected',
  'copiedCodeOrStyles',
] as const;
const REQUIRED_POLICY_DECLARATIONS = [
  'implementationSourceInspected=false',
  'sourceMapsInspected=false',
  'decompiledArtifactsInspected=false',
  'copiedCodeOrStyles=false',
  'sources[].excerptsCopied=false',
] as const;
const COMPONENT_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/u;

export function parseSourcePolicy(value: unknown): SourcePolicy {
  assertRecord(value, 'source policy');
  assertString(value.policyVersion, 'source policy.policyVersion');
  if (value.policyVersion !== '1.0.0') {
    throw new TypeError('source policy.policyVersion must be "1.0.0".');
  }
  if (value.defaultDecision !== 'deny') {
    throw new TypeError('source policy.defaultDecision must be "deny".');
  }
  assertStringArray(value.allowedSourceKinds, 'source policy.allowedSourceKinds');
  assertStringArray(value.allowedLicenseExpressions, 'source policy.allowedLicenseExpressions');
  assertStringArray(value.allowedUriSchemes, 'source policy.allowedUriSchemes');
  assertStringArray(value.allowedHttpsHosts, 'source policy.allowedHttpsHosts');
  assertStringArray(value.deniedMaterialKinds, 'source policy.deniedMaterialKinds');
  assertStringArray(value.requiredDeclarations, 'source policy.requiredDeclarations');
  for (const declaration of REQUIRED_POLICY_DECLARATIONS) {
    if (!value.requiredDeclarations.includes(declaration)) {
      throw new TypeError(`source policy.requiredDeclarations must include "${declaration}".`);
    }
  }
  return value as unknown as SourcePolicy;
}

export function parseIntakeRecord(value: unknown): IntakeRecord {
  assertRecord(value, 'intake record');
  if (value.schemaVersion !== '1.0.0') {
    throw new TypeError('intake record.schemaVersion must be "1.0.0".');
  }
  assertString(value.requestId, 'intake record.requestId');
  assertString(value.componentId, 'intake record.componentId');
  if (!COMPONENT_ID.test(value.componentId)) {
    throw new TypeError('intake record.componentId must be a lowercase custom-element name.');
  }
  assertString(value.recordedAt, 'intake record.recordedAt');
  assertString(value.recordedBy, 'intake record.recordedBy');
  if (Number.isNaN(Date.parse(value.recordedAt))) {
    throw new TypeError('intake record.recordedAt must be an ISO date-time.');
  }
  assertRecord(value.cleanRoomDeclaration, 'intake record.cleanRoomDeclaration');
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    throw new TypeError('intake record.sources must contain at least one source.');
  }
  for (const [index, source] of value.sources.entries()) {
    assertRecord(source, `intake record.sources[${String(index)}]`);
    assertString(source.id, `intake record.sources[${String(index)}].id`);
    assertString(source.title, `intake record.sources[${String(index)}].title`);
    assertString(source.uri, `intake record.sources[${String(index)}].uri`);
    assertString(source.sourceKind, `intake record.sources[${String(index)}].sourceKind`);
    assertString(
      source.licenseExpression,
      `intake record.sources[${String(index)}].licenseExpression`,
    );
    assertStringArray(
      source.materialKinds,
      `intake record.sources[${String(index)}].materialKinds`,
    );
    assertStringArray(source.factsUsed, `intake record.sources[${String(index)}].factsUsed`);
  }
  return value as unknown as IntakeRecord;
}

export function evaluateIntake(record: IntakeRecord, policy: SourcePolicy): IntakeDecision {
  const findings: IntakeFinding[] = [];

  for (const key of DECLARATION_KEYS) {
    const declaration: unknown = record.cleanRoomDeclaration[key];
    if (declaration !== false) {
      findings.push({
        code: 'INTAKE_DECLARATION_FAILED',
        message: `${key} must be explicitly false.`,
        path: `cleanRoomDeclaration.${key}`,
      });
    }
  }

  const ids = new Set<string>();
  for (const [index, source] of record.sources.entries()) {
    const path = `sources[${String(index)}]`;
    if (ids.has(source.id)) {
      findings.push({
        code: 'INTAKE_DUPLICATE_SOURCE',
        message: `Source id "${source.id}" is duplicated.`,
        path: `${path}.id`,
      });
    }
    ids.add(source.id);
    if (!policy.allowedSourceKinds.includes(source.sourceKind)) {
      findings.push({
        code: 'INTAKE_SOURCE_KIND_DENIED',
        message: `Source kind "${source.sourceKind}" is not allowed.`,
        path: `${path}.sourceKind`,
      });
    }
    if (!policy.allowedLicenseExpressions.includes(source.licenseExpression)) {
      findings.push({
        code: 'INTAKE_LICENSE_DENIED',
        message: `License expression "${source.licenseExpression}" is not allowed.`,
        path: `${path}.licenseExpression`,
      });
    }
    if (source.materialKinds.length === 0) {
      findings.push({
        code: 'INTAKE_MATERIAL_REQUIRED',
        message: 'At least one material kind is required.',
        path: `${path}.materialKinds`,
      });
    }
    for (const materialKind of source.materialKinds) {
      if (policy.deniedMaterialKinds.includes(materialKind)) {
        findings.push({
          code: 'INTAKE_MATERIAL_DENIED',
          message: `Material kind "${materialKind}" is denied.`,
          path: `${path}.materialKinds`,
        });
      }
    }
    if (source.factsUsed.length === 0) {
      findings.push({
        code: 'INTAKE_FACTS_REQUIRED',
        message: 'At least one factual behavior note is required.',
        path: `${path}.factsUsed`,
      });
    }
    const excerptsCopied: unknown = source.excerptsCopied;
    if (excerptsCopied !== false) {
      findings.push({
        code: 'INTAKE_COPIED_EXCERPT',
        message: 'Copied excerpts are not accepted by the v1 workflow.',
        path: `${path}.excerptsCopied`,
      });
    }
    validateSourceUri(source.uri, path, policy, findings);
  }

  return {
    allowed: findings.length === 0,
    policyVersion: policy.policyVersion,
    recordDigest: sha256(stableJson(asJsonValue(record))),
    findings,
  };
}

function validateSourceUri(
  uri: string,
  path: string,
  policy: SourcePolicy,
  findings: IntakeFinding[],
): void {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    findings.push({
      code: 'INTAKE_INVALID_URI',
      message: `Source URI "${uri}" is invalid.`,
      path: `${path}.uri`,
    });
    return;
  }
  if (!policy.allowedUriSchemes.includes(parsed.protocol)) {
    findings.push({
      code: 'INTAKE_URI_SCHEME_DENIED',
      message: `URI scheme "${parsed.protocol}" is not allowed.`,
      path: `${path}.uri`,
    });
  }
  if (parsed.protocol === 'https:' && !policy.allowedHttpsHosts.includes(parsed.hostname)) {
    findings.push({
      code: 'INTAKE_HOST_DENIED',
      message: `HTTPS host "${parsed.hostname}" is not allowed.`,
      path: `${path}.uri`,
    });
  }
}
