import type { CandidateManifest, ComponentSpec } from './types.ts';
import { asJsonValue, sha256, stableJson } from './util.ts';

export const GENERATOR_VERSION = '1.0.0';

export interface GeneratedCandidate {
  readonly source: string;
  readonly manifest: CandidateManifest;
}

export function generateCandidate(spec: ComponentSpec, template: string): GeneratedCandidate {
  if (spec.generation.generatorVersion !== GENERATOR_VERSION) {
    throw new Error(
      `Spec generator ${spec.generation.generatorVersion} is incompatible with ${GENERATOR_VERSION}.`,
    );
  }
  if (spec.generation.templateId !== 'dismissible-alert.v1') {
    throw new Error(`Unsupported template "${spec.generation.templateId}".`);
  }
  const className = toPascalCase(spec.id);
  const specDigest = sha256(stableJson(asJsonValue(spec)));
  const templateDigest = sha256(template);
  const replacements: Readonly<Record<string, string>> = {
    CLASS_NAME: className,
    COMPONENT_ID: spec.id,
    COMPONENT_VERSION: spec.version,
    EVENT_PREFIX: spec.namespace.slice(0, -1),
    GENERATOR_VERSION,
    SPEC_DIGEST: specDigest,
    TAG_NAME: spec.semantics.hostElement,
    TEMPLATE_DIGEST: templateDigest,
    TEMPLATE_ID: spec.generation.templateId,
  };
  let source = template;
  for (const [token, replacement] of Object.entries(replacements)) {
    source = source.replaceAll(`{{${token}}}`, replacement);
  }
  const unresolved = source.match(/[{][{][A-Z_]+[}][}]/gu);
  if (unresolved) {
    throw new Error(`Template contains unresolved tokens: ${unresolved.join(', ')}`);
  }
  if (!source.endsWith('\n')) {
    source += '\n';
  }
  const sourceFile = `${spec.id}.ts`;
  const manifest: CandidateManifest = {
    schemaVersion: '1.0.0',
    componentId: spec.id,
    componentVersion: spec.version,
    generatorVersion: GENERATOR_VERSION,
    templateId: spec.generation.templateId,
    promptVersion: spec.generation.promptVersion,
    skillVersion: spec.generation.skillVersion,
    specDigest,
    templateDigest,
    sourceDigest: sha256(source),
    sourceFile,
  };
  return { source, manifest };
}

function toPascalCase(componentId: string): string {
  return componentId
    .split('-')
    .filter((part) => part !== '')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('');
}
