# Supply-chain and GitHub Actions policy

The repository treats provenance as review evidence, not proof that code is secure. Maintainers
remain responsible for source, generated changes, licenses, dependency behavior, build output, cloud
boundaries, and release decisions.

## Dependency controls

- Commit `pnpm-lock.yaml`, use exact direct dependency versions, and install with
  `--frozen-lockfile` in CI.
- pnpm's minimum release age reduces exposure to just-published packages. Exceptions require a
  reviewed reason; they are not routine update shortcuts.
- Permit install scripts only for explicitly listed packages. Review any new native binary,
  postinstall script, network client, parser, or transitive license before merging.
- Dependency Review blocks high-severity known vulnerabilities and the listed AGPL licenses on pull
  requests. A lower-severity result can still block release based on reachability and impact.
- CodeQL, lint, tests, the Forge static policy, and human review cover different failure modes; none
  substitutes for the others.

## Action pinning and updates

Every external `uses:` reference is pinned to a 40-character commit SHA. The trailing version
comment is informational and is never the executed reference. Local reusable workflows may use a
relative path.

To update an action:

1. Read the upstream changelog, security advisories, runtime/runner requirements, and permission
   changes from the action's official repository.
2. Resolve the intended immutable release tag to its commit through the upstream Git repository. For
   annotated tags, verify the peeled commit and tag signature when the project supplies one.
3. Review the diff between old and new commits, including bundled JavaScript, new subprocesses,
   network destinations, inputs, outputs, and artifact behavior.
4. Replace the SHA and version comment together. Never pin a major tag, branch, pull-request ref, or
   fork solely to make CI pass.
5. Run pull-request, browser, Terraform, dependency, and CodeQL checks as applicable. Record any new
   permission in the workflow and this policy.

The pull-request workflow independently scans all workflow files and rejects nonlocal action
references that are not full SHAs.

## Workflow permissions and untrusted input

Workflow-level permissions default to the minimum each job needs. Ordinary checks and artifact
builds have only `contents: read`. CodeQL alone receives `security-events: write`. The weekly digest
job receives repository and pull-request write access solely to push its generated branch and open a
draft PR. No workflow uses `pull_request_target` or executes pull-request code with write tokens.

Feed entries, issue metadata, branch names, workflow inputs, and generated specifications are
untrusted data. They must not be interpolated into shell commands without fixed boundaries. Weekly
automation stages only the generated issue directory and never changes approval state.

## SBOM and provenance evidence

`pnpm sbom:generate` writes a CycloneDX inventory for the locked workspace. The supply-chain
workflow also creates deterministic archives, SHA-256 checksums, and an in-toto statement using the
GitHub source commit and workflow run. The release candidate includes package tarballs, its SBOM,
and checksums.

These records are unsigned retained workflow artifacts, not a hosted transparency log or a SLSA
level claim. They describe the runner's output but do not prove the runner, action, dependency, or
source was benign. Verify checksums after download and compare subjects before any future promotion.

## Secrets, OIDC, and incident response

Current checks, candidate builds, fixture generation, and Terraform tests require no credentials.
The scheduled feed reader needs network access but no API key. Future model integrations must use a
clearly named secret, constrained output schema, and deterministic no-secret fallback; model output
cannot approve content.

Terraform describes a future GitHub OIDC upload role rather than an access key. The current
production candidate workflow intentionally lacks `id-token: write` and performs no upload. A future
deployer must be a separate, protected-Environment job with exact bucket/distribution targets and a
rollback plan.

On a suspected compromise, disable the affected workflow or Environment, revoke sessions or trust,
preserve logs and artifacts, identify affected commits/releases, rotate any exposed secret, and
publish a factual advisory. Regenerate SBOM/provenance only after the build boundary is understood;
do not overwrite evidence from the affected run.
