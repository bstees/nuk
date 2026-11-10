export type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface SourcePolicy {
  readonly policyVersion: string;
  readonly defaultDecision: 'deny';
  readonly allowedSourceKinds: readonly string[];
  readonly allowedLicenseExpressions: readonly string[];
  readonly allowedUriSchemes: readonly string[];
  readonly allowedHttpsHosts: readonly string[];
  readonly deniedMaterialKinds: readonly string[];
  readonly requiredDeclarations: readonly string[];
}

export interface SourceItem {
  readonly id: string;
  readonly title: string;
  readonly uri: string;
  readonly sourceKind: string;
  readonly licenseExpression: string;
  readonly materialKinds: readonly string[];
  readonly factsUsed: readonly string[];
  readonly excerptsCopied: false;
}

export interface IntakeRecord {
  readonly schemaVersion: '1.0.0';
  readonly requestId: string;
  readonly componentId: string;
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly cleanRoomDeclaration: {
    readonly implementationSourceInspected: false;
    readonly sourceMapsInspected: false;
    readonly decompiledArtifactsInspected: false;
    readonly copiedCodeOrStyles: false;
  };
  readonly sources: readonly SourceItem[];
}

export interface IntakeFinding {
  readonly code: string;
  readonly message: string;
  readonly path: string;
}

export interface IntakeDecision {
  readonly allowed: boolean;
  readonly policyVersion: string;
  readonly recordDigest: string;
  readonly findings: readonly IntakeFinding[];
}

export interface BehaviorRule {
  readonly id: string;
  readonly given: string;
  readonly when: string;
  readonly then: readonly string[];
}

export interface AcceptanceTest {
  readonly id: string;
  readonly level: 'accessibility' | 'behavior' | 'conformance' | 'static';
  readonly assertion: string;
}

export interface ComponentSpec {
  readonly schemaVersion: '1.0.0';
  readonly id: string;
  readonly version: string;
  /** Validated custom-element prefix including its trailing hyphen (`nuk-`, `acme-ui-`). */
  readonly namespace: `${string}-`;
  readonly summary: string;
  readonly provenance: {
    readonly intakeRecord: string;
    readonly sourceIds: readonly string[];
  };
  readonly semantics: {
    readonly hostElement: string;
    readonly permittedRoles: readonly string[];
    readonly requiredParts: readonly {
      readonly name: string;
      readonly selector: string;
      readonly nativeElement: string;
      readonly requirements: readonly string[];
    }[];
  };
  readonly states: readonly {
    readonly name: string;
    readonly values: readonly string[];
    readonly initial: string;
  }[];
  readonly events: readonly {
    readonly name: string;
    readonly bubbles: boolean;
    readonly composed: boolean;
    readonly detail: Readonly<Record<string, string>>;
  }[];
  readonly behavior: readonly BehaviorRule[];
  readonly accessibility: {
    readonly target: 'WCAG 2.2 AA';
    readonly keyboard: readonly string[];
    readonly naming: readonly string[];
    readonly screenReader: readonly string[];
    readonly forcedColors: readonly string[];
    readonly reducedMotion: readonly string[];
  };
  readonly security: {
    readonly allowedCapabilities: readonly string[];
    readonly forbiddenCapabilities: readonly string[];
  };
  readonly acceptanceTests: readonly AcceptanceTest[];
  readonly generation: {
    readonly generatorVersion: string;
    readonly templateId: string;
    readonly promptVersion: string;
    readonly skillVersion: string;
  };
}

export interface CandidateManifest {
  readonly schemaVersion: '1.0.0';
  readonly componentId: string;
  readonly componentVersion: string;
  readonly generatorVersion: string;
  readonly templateId: string;
  readonly promptVersion: string;
  readonly skillVersion: string;
  readonly specDigest: string;
  readonly templateDigest: string;
  readonly sourceDigest: string;
  readonly sourceFile: string;
}

export type AnalysisCategory =
  | 'dynamic-execution'
  | 'inline-script-injection'
  | 'network-access'
  | 'parse-error'
  | 'storage-access'
  | 'undeclared-dependency'
  | 'unsafe-construct';

export interface AnalysisFinding {
  readonly ruleId: string;
  readonly category: AnalysisCategory;
  readonly severity: 'error';
  readonly message: string;
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

export interface AnalysisReport {
  readonly schemaVersion: '1.0.0';
  readonly analyzerVersion: string;
  readonly sourceDigest: string;
  readonly passed: boolean;
  readonly declaredDependencies: readonly string[];
  readonly findings: readonly AnalysisFinding[];
}

export interface ConformanceFinding {
  readonly ruleId: string;
  readonly message: string;
}

export interface ConformanceReport {
  readonly schemaVersion: '1.0.0';
  readonly checkerVersion: string;
  readonly specDigest: string;
  readonly sourceDigest: string;
  readonly passed: boolean;
  readonly checks: Readonly<Record<string, boolean>>;
  readonly findings: readonly ConformanceFinding[];
}

export interface ArtifactBinding {
  readonly path: string;
  readonly sha256: string;
}

export interface ApprovalRecord {
  readonly schemaVersion: '1.0.0';
  readonly requestId: string;
  readonly componentId: string;
  readonly candidate: ArtifactBinding;
  readonly spec: ArtifactBinding;
  readonly analysisReport: ArtifactBinding;
  readonly conformanceReport: ArtifactBinding;
  readonly provenanceReport: ArtifactBinding;
  readonly status: 'approved' | 'pending' | 'rejected';
  readonly reviewer: string | null;
  readonly reviewedAt: string | null;
  readonly rationale: string | null;
  readonly attestation: string | null;
}
