# Table Quality Checklist

Verify ALL of the following before generating a migration:

- [ ] Primary key is `uuid().defaultRandom().primaryKey()`
- [ ] Money fields use `decimal({ precision: 10, scale: 2 })`
- [ ] Foreign keys reference the correct parent table
- [ ] `.notNull()` on required fields
- [ ] Sensible defaults (`.default(false)`, `.default(0)`, `.defaultNow()`)
- [ ] Relations defined if foreign keys exist
- [ ] Both `InferSelectModel` and `InferInsertModel` types exported
- [ ] `createInsertSchema` exported for Zod validation
