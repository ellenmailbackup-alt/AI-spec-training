---
name: scaffold-page
description: Scaffold a new admin page with tabs, data table, CRUD dialogs following existing patterns.
user-invocable: true
argument-hint: "[page-name]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: react
---

Scaffold a new admin page for `$ARGUMENTS`.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1: Read design guidelines
Read `docs/design/design_guidelines.md` for brand colors, typography, spacing.

### Step 2: Read reference page
Read an existing admin page as pattern reference:
- `client/src/pages/admin/Products.tsx` — standard CRUD page
- `client/src/pages/admin/Settings.tsx` — tabbed layout (but note: this is a refactoring target, don't copy its problems)

### Step 3: Create the page component
Create `client/src/pages/admin/$ARGUMENTS.tsx` with the structure below.

### Step 4: Register the route
Add Wouter route in the appropriate router file.

### Step 5: Verify types
Ensure all types come from `shared/schema.ts` (`InferSelectModel`, `InferInsertModel`).

## Formatting Rules (MANDATORY)

- **Numbers**: nl-BE locale (comma as decimal separator)
- **Currency**: `€ 26,40` (euro symbol, space, amount with comma)
- **Edit buttons**: yellow background
- **Delete buttons**: destructive variant
- **Delete confirmations**: Always use shadcn AlertDialog with AlertTriangle icon

## Component Patterns

### Page structure
```tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";

export default function PageName() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<ItemType | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/items"],
  });

  // ... CRUD mutations with queryClient.invalidateQueries

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Page Title</CardTitle>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={items} />
      </CardContent>
    </Card>
  );
}
```

### Delete confirmation pattern
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        Are you sure?
      </AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Data fetching with TanStack Query
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["/api/resource"],
});

const mutation = useMutation({
  mutationFn: (data: InsertType) =>
    apiRequest("POST", "/api/resource", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/resource"] });
    toast({ title: "Success", description: "Item created" });
  },
});
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
