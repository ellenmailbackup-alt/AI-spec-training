---
name: scaffold-dialog
description: Scaffold a CRUD dialog component with form validation following existing patterns.
user-invocable: true
argument-hint: "[entity-name]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: react
---

Scaffold a CRUD dialog component for `$ARGUMENTS`.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1: Read design guidelines
Read `docs/design/design_guidelines.md` for brand colors and component standards.

### Step 2: Read reference dialog
Read an existing dialog as pattern reference. Look for `*Dialog.tsx` files in `client/src/`.

### Step 3: Find the schema
Read `shared/schema.ts` to find the table and Zod schema for `$ARGUMENTS`.

### Step 4: Create the dialog component
Create `client/src/components/$ARGUMENTSDialog.tsx` following the pattern below.

## Formatting Rules (MANDATORY)
- Numbers: nl-BE locale (comma as decimal separator)
- Currency: `€ 26,40` (euro symbol, space, amount)
- Edit buttons: yellow background
- Delete buttons: destructive variant

## Dialog Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EntityType, InsertEntityType } from "@shared/schema";

// Use the Zod schema from shared/schema.ts or define form-specific one
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // ... other fields
});

type FormValues = z.infer<typeof formSchema>;

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: EntityType | null; // null = create mode, object = edit mode
}

export function EntityDialog({ open, onOpenChange, editItem }: EntityDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!editItem;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editItem ? {
      name: editItem.name,
      // ... map existing values
    } : {
      name: "",
      // ... empty defaults
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      isEditing
        ? apiRequest("PATCH", `/api/entities/${editItem!.id}`, data)
        : apiRequest("POST", "/api/entities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entities"] });
      toast({
        title: isEditing ? "Updated" : "Created",
        description: `Entity ${isEditing ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Entity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* ... more form fields */}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEditing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

## Key Points
- Always support both **create** and **edit** modes via the `editItem` prop
- Use `zodResolver` for form validation
- Invalidate the correct query key on success
- Show toast notifications for success and error
- Disable submit button while mutation is pending
- Reset form on close

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
