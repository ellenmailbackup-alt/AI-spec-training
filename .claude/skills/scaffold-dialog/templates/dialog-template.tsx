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
