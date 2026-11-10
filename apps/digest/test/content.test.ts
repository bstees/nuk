import { describe, expect, it } from 'vitest';

import { entriesForTopic, getIssues, getTopics } from '../src/lib/content';

describe('digest content', () => {
  it('ships only approved issues by default', () => {
    const issues = getIssues(false);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => issue.reviewStatus === 'approved')).toBe(true);
  });

  it('provides a non-empty index for every topic', () => {
    for (const topic of getTopics()) expect(entriesForTopic(topic).length).toBeGreaterThan(0);
  });
});
