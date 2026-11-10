import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { promoteApprovedCandidate } from './approval.ts';
import { runProof } from './proof.ts';
import type { ApprovalRecord } from './types.ts';
import { APPROVAL_ATTESTATION, asJsonValue, stableJson } from './util.ts';

void test('proof passes automated gates but promotion fails closed until an artifact-bound human approval', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuk-forge-proof-'));
  const proof = await runProof(join(root, 'proof'));
  assert.equal(proof.automatedGatesPassed, true);
  assert.equal(proof.promotionDeniedPendingHumanReview, true);
  await assert.rejects(
    promoteApprovedCandidate(proof.approvalRequest, join(root, 'denied.ts')),
    /status is "pending"/u,
  );

  const pending = JSON.parse(await readFile(proof.approvalRequest, 'utf8')) as ApprovalRecord;
  const approved: ApprovalRecord = {
    ...pending,
    status: 'approved',
    reviewer: 'Human Review Fixture',
    reviewedAt: '2026-11-02T12:00:00.000Z',
    rationale: 'Reviewed the exact candidate and every bound report for the promotion test.',
    attestation: APPROVAL_ATTESTATION,
  };
  await writeFile(proof.approvalRequest, stableJson(asJsonValue(approved)), 'utf8');
  const destination = join(root, 'promoted', 'nuk-dismissible-alert.ts');
  const result = await promoteApprovedCandidate(proof.approvalRequest, destination);
  assert.equal(result.reviewer, 'Human Review Fixture');
  assert.equal(await readFile(destination, 'utf8'), await readFile(proof.candidate, 'utf8'));

  await writeFile(
    proof.candidate,
    `${await readFile(proof.candidate, 'utf8')}\n// tampered\n`,
    'utf8',
  );
  await assert.rejects(
    promoteApprovedCandidate(proof.approvalRequest, join(root, 'tampered.ts')),
    /does not match/u,
  );
});
