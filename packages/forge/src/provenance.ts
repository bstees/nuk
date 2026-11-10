import type {
  AnalysisReport,
  ArtifactBinding,
  CandidateManifest,
  ComponentSpec,
  ConformanceReport,
  IntakeDecision,
  IntakeRecord,
} from './types.ts';
import { asJsonValue, sha256, stableJson } from './util.ts';

export interface ProvenanceArtifactInput {
  readonly path: string;
  readonly contents: string;
}

export interface ProvenanceReport {
  readonly schemaVersion: '1.0.0';
  readonly reportType: 'nuk-clean-room-component-provenance';
  readonly component: {
    readonly id: string;
    readonly version: string;
    readonly namespace: string;
  };
  readonly createdAt: string;
  readonly sourceIntake: {
    readonly decision: 'allowed';
    readonly policyVersion: string;
    readonly recordDigest: string;
    readonly sourceIds: readonly string[];
    readonly sources: readonly {
      readonly id: string;
      readonly uri: string;
      readonly licenseExpression: string;
      readonly sourceKind: string;
      readonly materialKinds: readonly string[];
      readonly excerptsCopied: false;
    }[];
  };
  readonly generation: {
    readonly generatorVersion: string;
    readonly templateId: string;
    readonly promptVersion: string;
    readonly skillVersion: string;
    readonly artifacts: readonly (ArtifactBinding & { readonly kind: string })[];
    readonly deterministic: true;
    readonly modelInvoked: false;
  };
  readonly candidate: ArtifactBinding & {
    readonly manifest: CandidateManifest;
  };
  readonly checks: {
    readonly staticAnalysis: ArtifactBinding & { readonly passed: true };
    readonly conformance: ArtifactBinding & { readonly passed: true };
    readonly behavioralParity: ArtifactBinding & { readonly passed: true };
  };
  readonly sbom: ArtifactBinding;
  readonly humanGate: {
    readonly required: true;
    readonly status: 'awaiting-human-approval';
    readonly promotionAllowed: false;
  };
  readonly limitations: readonly string[];
}

export interface CreateProvenanceOptions {
  readonly spec: ComponentSpec;
  readonly intake: IntakeRecord;
  readonly intakeDecision: IntakeDecision;
  readonly manifest: CandidateManifest;
  readonly candidate: ProvenanceArtifactInput;
  readonly policy: ProvenanceArtifactInput;
  readonly normalizedSpec: ProvenanceArtifactInput;
  readonly template: ProvenanceArtifactInput;
  readonly prompt: ProvenanceArtifactInput;
  readonly skill: ProvenanceArtifactInput;
  readonly analysis: AnalysisReport;
  readonly analysisArtifact: ProvenanceArtifactInput;
  readonly conformance: ConformanceReport;
  readonly conformanceArtifact: ProvenanceArtifactInput;
  readonly parityPassed: boolean;
  readonly parityArtifact: ProvenanceArtifactInput;
  readonly sbomArtifact: ProvenanceArtifactInput;
}

export function createProvenanceReport(options: CreateProvenanceOptions): ProvenanceReport {
  if (!options.intakeDecision.allowed) {
    throw new Error('Cannot create provenance for a denied source intake.');
  }
  if (!options.analysis.passed || !options.conformance.passed || !options.parityPassed) {
    throw new Error('Cannot create passing provenance before every automated gate passes.');
  }
  if (
    options.spec.id !== options.intake.componentId ||
    options.spec.id !== options.manifest.componentId
  ) {
    throw new Error('Component identity differs across intake, spec, or candidate manifest.');
  }
  const intakeSourceIds = new Set(options.intake.sources.map((source) => source.id));
  if (options.spec.provenance.sourceIds.some((id) => !intakeSourceIds.has(id))) {
    throw new Error('The normalized spec refers to a source absent from the intake record.');
  }
  const specDigest = sha256(options.normalizedSpec.contents);
  if (specDigest !== options.manifest.specDigest) {
    throw new Error('Candidate manifest spec digest does not bind the supplied normalized spec.');
  }
  const candidateDigest = sha256(options.candidate.contents);
  if (
    candidateDigest !== options.manifest.sourceDigest ||
    candidateDigest !== options.analysis.sourceDigest ||
    candidateDigest !== options.conformance.sourceDigest
  ) {
    throw new Error('Candidate digest differs across generation, analysis, or conformance.');
  }

  return {
    schemaVersion: '1.0.0',
    reportType: 'nuk-clean-room-component-provenance',
    component: {
      id: options.spec.id,
      version: options.spec.version,
      namespace: options.spec.namespace,
    },
    createdAt: options.intake.recordedAt,
    sourceIntake: {
      decision: 'allowed',
      policyVersion: options.intakeDecision.policyVersion,
      recordDigest: options.intakeDecision.recordDigest,
      sourceIds: [...options.spec.provenance.sourceIds],
      sources: options.intake.sources.map((source) => ({
        id: source.id,
        uri: source.uri,
        licenseExpression: source.licenseExpression,
        sourceKind: source.sourceKind,
        materialKinds: [...source.materialKinds],
        excerptsCopied: source.excerptsCopied,
      })),
    },
    generation: {
      generatorVersion: options.manifest.generatorVersion,
      templateId: options.manifest.templateId,
      promptVersion: options.manifest.promptVersion,
      skillVersion: options.manifest.skillVersion,
      artifacts: [
        bind('source-policy', options.policy),
        bind('normalized-spec', options.normalizedSpec),
        bind('template', options.template),
        bind('prompt', options.prompt),
        bind('workflow-skill', options.skill),
      ],
      deterministic: true,
      modelInvoked: false,
    },
    candidate: {
      ...bindArtifact(options.candidate),
      manifest: options.manifest,
    },
    checks: {
      staticAnalysis: { ...bindArtifact(options.analysisArtifact), passed: true },
      conformance: { ...bindArtifact(options.conformanceArtifact), passed: true },
      behavioralParity: { ...bindArtifact(options.parityArtifact), passed: true },
    },
    sbom: bindArtifact(options.sbomArtifact),
    humanGate: {
      required: true,
      status: 'awaiting-human-approval',
      promotionAllowed: false,
    },
    limitations: [
      'Static checks reduce known risks but do not prove that a candidate is secure.',
      'Behavior tests cover the normalized public contract, not every browser or assistive technology.',
      'License classification and factual source notes require human review.',
      'The local proof harness is not a hardened sandbox.',
    ],
  };
}

export function renderProvenanceMarkdown(report: ProvenanceReport): string {
  const sources = report.sourceIntake.sources
    .map(
      (source) =>
        `- \`${source.id}\` — ${source.uri} (${source.licenseExpression}; ${source.sourceKind})`,
    )
    .join('\n');
  const artifacts = report.generation.artifacts
    .map((artifact) => `- ${artifact.kind}: \`${artifact.path}\` — \`${artifact.sha256}\``)
    .join('\n');
  const limitations = report.limitations.map((limitation) => `- ${limitation}`).join('\n');
  return `# Clean-room provenance: ${report.component.id}@${report.component.version}

Status: **awaiting human approval**. Automated checks cannot promote this candidate.

## Source intake

Policy ${report.sourceIntake.policyVersion} allowed the recorded behavior-only inputs. No excerpts were
copied according to the bound intake declarations.

${sources}

## Bound generation artifacts

${artifacts}

Candidate: \`${report.candidate.path}\` — \`${report.candidate.sha256}\`

## Automated gates

- Static analysis: passed — \`${report.checks.staticAnalysis.sha256}\`
- Semantic/accessibility conformance: passed — \`${report.checks.conformance.sha256}\`
- Public-behavior parity: passed — \`${report.checks.behavioralParity.sha256}\`
- CycloneDX SBOM: \`${report.sbom.sha256}\`

## Limitations

${limitations}
`;
}

export function provenanceDigest(report: ProvenanceReport): string {
  return sha256(stableJson(asJsonValue(report)));
}

function bind(kind: string, artifact: ProvenanceArtifactInput): ArtifactBinding & { kind: string } {
  return { kind, ...bindArtifact(artifact) };
}

function bindArtifact(artifact: ProvenanceArtifactInput): ArtifactBinding {
  return { path: artifact.path, sha256: sha256(artifact.contents) };
}
