import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const countingSessionFormSchema = z.object({
  sessionName: z.string().min(1, "Session name is required").max(255, "Session name is too long"),
  notes: z.string().optional(),
});

type CountingSessionFormValues = z.infer<typeof countingSessionFormSchema>;

interface CountingSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CountingSessionFormValues) => void;
  defaultValues?: Partial<CountingSessionFormValues>;
  title: string;
  description: string;
  isSubmitting?: boolean;
}

export function CountingSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
  description,
  isSubmitting = false,
}: CountingSessionDialogProps) {
  const form = useForm<CountingSessionFormValues>({
    resolver: zodResolver(countingSessionFormSchema),
    defaultValues: {
      sessionName: defaultValues?.sessionName || "",
      notes: defaultValues?.notes || "",
    },
  });

  // Reset form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        sessionName: defaultValues.sessionName || "",
        notes: defaultValues.notes || "",
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (values: CountingSessionFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sessionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Name*</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g., "Bar Area" or "Monthly Count - Shelf A"'
                      autoFocus
                      data-testid="input-session-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this counting session..."
                      rows={3}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
