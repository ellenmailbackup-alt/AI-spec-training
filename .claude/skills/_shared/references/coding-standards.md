# Coding Standards

- **Number formatting**: nl-BE locale (comma as decimal separator)
- **Currency**: Euro symbol with space: `€ 26,40`
- **UI buttons**: Edit = yellow background, Delete = destructive variant
- **Delete confirmations**: Always use shadcn AlertDialog with AlertTriangle icon
- **TypeScript**: No `any` types — use proper generics, utility types, Drizzle `InferSelectModel`/`InferInsertModel`
- **Zod**: Use `createInsertSchema()` from `drizzle-zod` for form validation
- **Error messages**: Descriptive with context — never generic "Failed to X"

## Design Reference
- `docs/design/design_guidelines.md` — full UI/UX design system
