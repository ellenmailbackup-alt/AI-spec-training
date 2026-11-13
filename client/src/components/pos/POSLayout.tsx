import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Coffee } from "lucide-react";
import { usePOSTheme } from "@/hooks/usePOSTheme";

interface POSLayoutProps {
  children: React.ReactNode;
}

export function POSLayout({ children }: POSLayoutProps) {
  // Apply POS-specific body classes for proper CSS isolation
  usePOSTheme();

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F1F2ED' }}>
      {/* Header - Kruze Brown #8A6959 */}
      <header className="px-6 py-4 flex items-center justify-between border-b-2 shadow-sm pointer-events-none" style={{ backgroundColor: '#8A6959', color: '#F1F2ED' }}>
        <div className="flex items-center gap-4">
          <Coffee className="w-8 h-8" />
          <h1 className="text-3xl font-serif font-bold tracking-tight" data-testid="text-brand-name">Kruze</h1>
          <div className="h-8 w-px" style={{ backgroundColor: 'rgba(241, 242, 237, 0.3)' }}></div>
          <span className="text-sm font-medium opacity-90 tracking-wide italic" data-testid="text-brand-tagline">Meesterschap in smaak, beleving en begeleiding</span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white/10"
              style={{ color: 'rgba(241, 242, 237, 0.7)' }}
              data-testid="link-admin"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Admin
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-white/10"
            style={{ color: 'rgba(241, 242, 237, 0.7)' }}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content - Zen & Focused */}
      <main className="flex-1 overflow-hidden" style={{ backgroundColor: '#F1F2ED' }}>
        {children}
      </main>
    </div>
  );
}
