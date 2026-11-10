import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';

const WORKSPACE_DIRECTORIES = ['apps', 'packages', 'tooling'];

/** @typedef {{name: string, version?: string, license?: string, description?: string, dependencies?: Record<string, string>, optionalDependencies?: Record<string, string>, peerDependencies?: Record<string, string>, devDependencies?: Record<string, string>}} PackageManifest */

/**
 * Build a deterministic CycloneDX 1.6 document from package manifests. This intentionally does not
 * contact a registry or infer vulnerability status.
 *
 * @param {{rootDirectory: string, includeDev?: boolean, timestamp?: string}} options
 */
export async function generateSbom(options) {
  const rootDirectory = resolve(options.rootDirectory);
  const timestamp = normalizeTimestamp(options.timestamp ?? '1970-01-01T00:00:00.000Z');
  const records = await discoverManifests(rootDirectory);
  const rootRecord = records.find((record) => record.path === join(rootDirectory, 'package.json'));
  if (!rootRecord) {
    throw new Error(`No package.json exists at SBOM root ${rootDirectory}.`);
  }
  const workspaceByName = new Map(records.map((record) => [record.manifest.name, record]));
  const componentByName = new Map();

  for (const record of records) {
    if (record === rootRecord) continue;
    componentByName.set(record.manifest.name, workspaceComponent(record, rootDirectory));
  }
  for (const record of records) {
    for (const [name, version] of dependencyEntries(record.manifest, options.includeDev ?? false)) {
      if (!workspaceByName.has(name) && !componentByName.has(name)) {
        componentByName.set(name, dependencyComponent(name, version));
      }
    }
  }

  const components = [...componentByName.values()].sort((left, right) =>
    left['bom-ref'].localeCompare(right['bom-ref']),
  );
  const rootComponent = workspaceComponent(rootRecord, rootDirectory, 'application');
  const dependencies = [];
  for (const record of records) {
    const component =
      record === rootRecord ? rootComponent : componentByName.get(record.manifest.name);
    if (!component) continue;
    const refs = dependencyEntries(record.manifest, options.includeDev ?? false)
      .map(([name]) => componentByName.get(name)?.['bom-ref'])
      .filter((value) => typeof value === 'string');
    if (record === rootRecord) {
      refs.push(
        ...records
          .filter((candidate) => candidate !== rootRecord)
          .map((candidate) => componentByName.get(candidate.manifest.name)?.['bom-ref'])
          .filter((value) => typeof value === 'string'),
      );
    }
    dependencies.push({ ref: component['bom-ref'], dependsOn: [...new Set(refs)].sort() });
  }
  for (const component of components) {
    if (!dependencies.some((entry) => entry.ref === component['bom-ref'])) {
      dependencies.push({ ref: component['bom-ref'], dependsOn: [] });
    }
  }
  dependencies.sort((left, right) => left.ref.localeCompare(right.ref));

  const serialSeed = JSON.stringify({ root: rootComponent, components, dependencies });
  return {
    $schema: 'https://cyclonedx.org/schema/bom-1.6.schema.json',
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: digestUuid(serialSeed),
    version: 1,
    metadata: {
      timestamp,
      tools: {
        components: [
          {
            type: 'application',
            name: '@nuk-ui/supply-chain',
            version: '0.1.0',
            supplier: { name: 'nuk project' },
          },
        ],
      },
      component: rootComponent,
      properties: [
        { name: 'nuk:reproducible', value: 'true' },
        { name: 'nuk:networkAccess', value: 'none' },
        { name: 'nuk:developmentDependenciesIncluded', value: String(options.includeDev ?? false) },
      ],
    },
    components,
    dependencies,
  };
}

/** @param {string} rootDirectory */
async function discoverManifests(rootDirectory) {
  const paths = [join(rootDirectory, 'package.json')];
  for (const directory of WORKSPACE_DIRECTORIES) {
    const absolute = join(rootDirectory, directory);
    let entries;
    try {
      entries = await readdir(absolute, { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        continue;
      throw error;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        paths.push(join(absolute, entry.name, 'package.json'));
      }
    }
  }
  const records = [];
  for (const path of [...new Set(paths)].sort()) {
    let contents;
    try {
      contents = await readFile(path, 'utf8');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        continue;
      throw error;
    }
    const manifest = JSON.parse(contents);
    if (!manifest || typeof manifest !== 'object' || typeof manifest.name !== 'string') {
      throw new Error(`Package manifest ${path} has no name.`);
    }
    records.push({ path, contents, manifest });
  }
  return records;
}

/** @param {{path: string, contents: string, manifest: PackageManifest}} record @param {string} rootDirectory @param {string} [type] */
function workspaceComponent(record, rootDirectory, type = 'library') {
  const version = record.manifest.version ?? '0.0.0';
  return {
    type,
    'bom-ref': npmPurl(record.manifest.name, version),
    group: packageGroup(record.manifest.name),
    name: packageBaseName(record.manifest.name),
    version,
    ...(record.manifest.description ? { description: record.manifest.description } : {}),
    ...(record.manifest.license ? { licenses: [licenseChoice(record.manifest.license)] } : {}),
    hashes: [{ alg: 'SHA-256', content: sha256(record.contents) }],
    purl: npmPurl(record.manifest.name, version),
    properties: [
      {
        name: 'nuk:manifestPath',
        value: relative(rootDirectory, record.path) || basename(record.path),
      },
      { name: 'nuk:workspace', value: 'true' },
    ],
  };
}

/** @param {string} name @param {string} version */
function dependencyComponent(name, version) {
  return {
    type: 'library',
    'bom-ref': npmPurl(name, version),
    group: packageGroup(name),
    name: packageBaseName(name),
    version,
    purl: npmPurl(name, version),
    properties: [
      { name: 'nuk:declaredVersion', value: version },
      { name: 'nuk:workspace', value: 'false' },
    ],
  };
}

/** @param {PackageManifest} manifest @param {boolean} includeDev */
function dependencyEntries(manifest, includeDev) {
  const groups = [manifest.dependencies, manifest.optionalDependencies, manifest.peerDependencies];
  if (includeDev) groups.push(manifest.devDependencies);
  const dependencies = new Map();
  for (const group of groups) {
    for (const [name, version] of Object.entries(group ?? {})) dependencies.set(name, version);
  }
  return [...dependencies].sort(([left], [right]) => left.localeCompare(right));
}

/** @param {string} value */
function normalizeTimestamp(value) {
  const milliseconds = /^\d+$/u.test(value) ? Number(value) * 1000 : Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new Error(`Invalid SBOM timestamp: ${value}`);
  return new Date(milliseconds).toISOString();
}

/** @param {string} value */
function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** @param {string} value */
function digestUuid(value) {
  const digest = sha256(value);
  const hex = `${digest.slice(0, 12)}5${digest.slice(13, 16)}a${digest.slice(17, 32)}`;
  return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** @param {string} name @param {string} version */
function npmPurl(name, version) {
  const encodedName = name.startsWith('@')
    ? `%40${name.slice(1).split('/').map(encodeURIComponent).join('/')}`
    : encodeURIComponent(name);
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}

/** @param {string} name */
function packageGroup(name) {
  return name.startsWith('@') ? (name.split('/')[0] ?? '').slice(1) : '';
}

/** @param {string} name */
function packageBaseName(name) {
  return name.startsWith('@') ? (name.split('/')[1] ?? name) : name;
}

/** @param {string} expression */
function licenseChoice(expression) {
  return /^[A-Za-z0-9-.+]+(?:\s+(?:AND|OR|WITH)\s+[A-Za-z0-9-.+]+)*$/u.test(expression)
    ? { expression }
    : { license: { name: expression } };
}
