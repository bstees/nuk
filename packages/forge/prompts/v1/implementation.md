# Candidate implementation task v1

Given one validated normalized component specification:

1. Restate its externally observable states, events, semantic requirements, and acceptance tests.
2. Select the simplest native behavior compatible with the specification.
3. Generate a fresh custom-element implementation under the specification's prefix without
   consulting source code from another component library.
4. Generate behavior tests from the acceptance tests, not from implementation structure.
5. Identify any behavior that remains ambiguous rather than silently guessing.
6. Return a machine-readable list of used capabilities and declared imports.

The deterministic proof uses the reviewed template in `templates/v1`; this prompt is versioned for a
future constrained model-assisted adapter. Model output must pass the same fail-closed pipeline and
has no direct promotion authority.
