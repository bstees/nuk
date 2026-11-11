# Product backlog

Backlog items describe possible future work. They are not commitments, release promises, or
authorization to publish, deploy, ingest third-party source code, or accept generated components.

## NUK-001: Research a more comprehensive component catalog

- **Status:** Backlog
- **Type:** Research and catalog strategy
- **Priority:** Normal; revisit after the v0.1 review
- **Owner:** Unassigned

### Problem

The initial catalog deliberately proves the system architecture with 25 representative elements, but
it is too small to cover many recurring application patterns. Before adding components ad hoc,
compare mature design systems and standards-based libraries to identify common, reusable behaviors
and meaningful gaps in nuk.

### Research boundaries

- Review only public component inventories, API/behavior documentation, accessibility guidance, and
  applicable standards. Do not copy, ingest, or translate third-party implementation source.
- Create a versioned source manifest recording the system, canonical documentation URL, material
  reviewed, access date/version, license or terms notes, and provenance decision.
- Sample at least 12 independently maintained systems across enterprise, public-sector,
  consumer-product, headless/accessibility-primitives, and web-component ecosystems.
- Normalize aliases before counting prevalence—for example, tag/chip/badge and toast/notification
  may overlap without representing identical behavior.
- Treat frequency as evidence, not an automatic requirement. Prefer semantic HTML and platform
  primitives; reject abstractions that add little behavior or weaken accessibility.

### Deliverables

1. A comparison matrix covering each system's documented components and behavior families.
2. A gap analysis against nuk's existing 25-element catalog.
3. A ranked shortlist grouped into **next**, **later**, and **do not add**, with rationale.
4. For every shortlisted component: semantic baseline, expected keyboard and focus behavior,
   accessible-name/state requirements, responsive/container considerations, likely native or
   progressive-enhancement strategy, and estimated testing complexity.
5. Proposed delivery waves that keep related foundations together rather than creating many shallow
   components.
6. A normalized Forge-ready specification and acceptance-test outline for each component approved
   for implementation.

### Prioritization rubric

Score candidates using documented cross-system prevalence, user-task value, semantic fit,
accessibility risk, interaction complexity, composability, maintenance burden, and overlap with
native HTML. Flag specialized domain components separately from broadly useful primitives.

### Acceptance criteria

- The source manifest and comparison matrix are reviewable and reproducible.
- "Common" components are supported by evidence from at least three independent systems, while any
  exception has an explicit product rationale.
- Synonyms and materially different interaction models are not collapsed without explanation.
- No third-party source code or source-derived implementation structure enters the research output.
- Accessibility and semantic requirements are considered before visual variants.
- Brent approves the ranked shortlist and delivery waves before implementation begins.
- Each accepted component follows the normal specification, tests, provenance, and human-review
  gates; the research itself cannot promote generated code.

### Out of scope

- Implementing every component found during the scan.
- Treating popularity as proof of usability, accessibility, or fit for nuk.
- Fabricating adoption data or making security/accessibility guarantees from documentation review.
- Changing the v0.1 catalog before the current owner review is complete.
