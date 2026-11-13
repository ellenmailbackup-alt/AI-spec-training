// Admin route protection - requires admin role
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Coffee } from "lucide-react";

export function AdminProtected({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/shop";
      }, 1500);
    }
  }, [isLoading, user, isAdmin, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Coffee className="w-16 h-16 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User not admin - show access denied
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Coffee className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  // User is admin - render children
  return <>{children}</>;
}
