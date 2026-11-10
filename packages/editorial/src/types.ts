export type Topic = 'accessibility' | 'ai' | 'css' | 'design-systems' | 'research' | 'tools';

export interface SourceDefinition {
  readonly id: string;
  readonly name: string;
  readonly feedUrl: string;
  readonly siteUrl: string;
  readonly enabled: boolean;
  readonly primary: boolean;
  readonly topics: readonly Topic[];
  readonly note: string;
}

export interface SourceManifest {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly sources: readonly SourceDefinition[];
}

export interface FeedItem {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly publishedAt: string;
  readonly description: string;
  readonly topics: readonly Topic[];
}

export interface Citation {
  readonly label: string;
  readonly url: string;
}

export interface DigestEntry {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly canonicalUrl: string;
  readonly source: string;
  readonly publishedAt: string;
  readonly topics: readonly Topic[];
  readonly citations: readonly Citation[];
  readonly quotes: readonly string[];
  readonly reviewFlags: readonly string[];
}

export type ReviewStatus = 'approved' | 'draft';

export interface DigestIssue {
  readonly schemaVersion: 1;
  readonly slug: string;
  readonly issueNumber: number;
  readonly title: string;
  readonly dek: string;
  readonly publishedAt: string;
  readonly generatedAt: string;
  readonly reviewStatus: ReviewStatus;
  readonly promptVersion: string;
  readonly sourceManifestVersion: string;
  readonly entries: readonly DigestEntry[];
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}
