# Spec Quality Checklist

Verify ALL of the following before saving:

- [ ] **References** link to correct Story ID and UC-NNN
- [ ] **Scope** section clearly states what is and is not included
- [ ] **3-layer architecture** respected — no business logic in routes, no transactions in storage
- [ ] **Every file** to create or modify is listed with its exact path
- [ ] **Schema changes** include table definition, Zod schema, and migration step
- [ ] **Security section** is complete (roles, validation, rate limiting)
- [ ] **Test cases** cover every acceptance criterion
- [ ] **No `any` types** specified — proper TypeScript types throughout
- [ ] **Design guidelines** referenced where frontend changes are specified
- [ ] **Existing patterns** followed — spec references `roastService.ts` or other relevant examples
