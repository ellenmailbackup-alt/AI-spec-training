# Use Case Quality Checklist

Verify ALL of the following before saving a use case document:

- [ ] **One capability** per use case — if covering two distinct flows, split into separate use cases
- [ ] **Title** follows Verb + Noun pattern from the actor's perspective (not technical)
- [ ] **Short description** present after title
- [ ] **No technical language** in flows, preconditions, postconditions, or business rules
- [ ] **No UI references** (buttons, dropdowns, modals, tabs, forms)
- [ ] **No infrastructure actors** (databases, libraries, storage services)
- [ ] **Business verbs** used (add/remove/change, not create/delete/update)
- [ ] **Main flow** reads as one continuous story with no sub-headers
- [ ] **Each step** clearly identifies who acts (actor or system)
- [ ] **Technical details** are in Implementation Notes section only
- [ ] **Exception flows** only describe scenarios where the postcondition cannot be achieved — not normal empty-state behaviour
- [ ] **Business rules** are validatable constraints only — no UI formatting, display logic, or presentation rules
- [ ] **Presentation Guidelines** used for page-specific display rules (if applicable) — general rules stay in design_guidelines.md
- [ ] **Implemented By** section has accurate, verified route paths, service files, and component names
- [ ] **Uninterruptible flow** check — if the actor never leaves mid-process, the entire flow is in one UC (not split across multiple)
- [ ] **No "Known Issues" section** — use cases describe what the system does, not what's broken. Bugs and tech debt are reported in review findings and tracked in `docs/product/ISSUES.md`
- [ ] **Every AF specifies branch and rejoin** — each AF states which main flow step it branches from and where it rejoins (or ends the UC)
- [ ] **Every EF specifies detection step** — each EF states at which step the exception is detected
- [ ] **No AFs that duplicate the main flow ending** — if behavior is already described in the final main flow steps, it's not an AF
- [ ] **No EFs for filtered-out conditions** — if preconditions or upfront filtering prevent a condition, it cannot be an EF
- [ ] **Main flow uses one variant per step** — multiple variants (e.g., payment methods) use AFs, not inline branching
