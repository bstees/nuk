import type { DigestIssue, Topic } from '@nuk-ui/editorial';

const modules = import.meta.glob<{ default: DigestIssue }>('../content/issues/**/*.json', {
  eager: true,
});

function isIncluded(issue: DigestIssue, includeDrafts: boolean): boolean {
  return issue.reviewStatus === 'approved' || includeDrafts;
}

export function getIssues(
  includeDrafts = import.meta.env.INCLUDE_DRAFTS === '1',
): readonly DigestIssue[] {
  return Object.values(modules)
    .map((module) => module.default)
    .filter((issue) => isIncluded(issue, includeDrafts))
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getIssue(slug: string): DigestIssue | undefined {
  return getIssues().find((issue) => issue.slug === slug);
}

export function getTopics(): readonly Topic[] {
  return [
    ...new Set(getIssues().flatMap((issue) => issue.entries.flatMap((entry) => entry.topics))),
  ].sort();
}

export function entriesForTopic(topic: Topic) {
  return getIssues().flatMap((issue) =>
    issue.entries
      .filter((entry) => entry.topics.includes(topic))
      .map((entry) => ({ entry, issue })),
  );
}

export function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value));
}

export function topicLabel(topic: string): string {
  return topic
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
