# brentstees.com component inventory

Every atomic component on brentstees.com (2026-11-12), mapped to nuk. Brand styling stays in the
site; anything reusable goes back to nuk through the backlog.

| Site component                    | Where                  | nuk match                                    | Status                                                               |
| --------------------------------- | ---------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Digest header navigation          | digest pages           | `nuk-nav`                                    | Adopted                                                              |
| Findings table of contents        | issue pages            | `nuk-nav`                                    | Adopted (scroll-spy stays site code)                                 |
| Breadcrumb trail                  | digest pages           | `nuk-breadcrumbs`                            | Adopted                                                              |
| Section scroll-spy rail           | homepage               | `nuk-nav`                                    | Partial: spy behavior is a gap (NUK-007)                             |
| Primary call-to-action link       | homepage, 404          | `nuk-link` / `nuk-button`                    | Partial: a link styled as a pill button; needs a link-button variant |
| Text link                         | everywhere             | `nuk-link`                                   | Partial: no-JS gap (NUK-002)                                         |
| Theme switch (auto/light/dark)    | every page             | `nuk-radio`                                  | Gap: segmented control (NUK-007)                                     |
| Leader/Builder lens switch        | homepage               | `nuk-radio`                                  | Gap: segmented control                                               |
| Digest issue card                 | digest index, topics   | `nuk-card`                                   | Partial: whole-card link and topic list are site code                |
| Topic tag list                    | cards, issues          | none                                         | Gap: tag list (NUK-007)                                              |
| Stats (issues, findings)          | digest index           | none                                         | Site-only; a `<dl>`                                                  |
| Archive note                      | issue pages            | `nuk-alert`/`nuk-status`                     | No: static note, not a live region                                   |
| Previous/next issue pager         | issue pages            | none                                         | Gap: pager (NUK-007)                                                 |
| Long-form prose                   | issue pages            | none                                         | Gap: prose container (NUK-007)                                       |
| System map (nodes and edges)      | homepage               | none                                         | Site-only                                                            |
| Principles and capabilities lists | homepage               | `nuk-stack`                                  | Site-only; plain lists                                               |
| Skip link                         | every page             | none                                         | Gap (NUK-007)                                                        |
| Ask-the-agent console             | homepage (feature off) | `nuk-text-field`, `nuk-button`, `nuk-status` | Candidate when the console ships                                     |
| Layout: rail plus column          | homepage, issue pages  | `nuk-grid`                                   | Site-only                                                            |

## Brand on nuk tokens

The brand (light-dark() colors, Manrope and IBM Plex Mono, clamp() type) can be expressed by
assigning nuk's semantic properties from the site's tokens without `@nuk-ui/theme`; see the site's
`src/styles/nuk-bridge.css`. One token was missing (text-safe accent, now added). Theme-switch
integration and fluid type are logged as NUK-005 and NUK-006.
