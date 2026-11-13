import { useEffect } from "react";

let posMountCount = 0;
let previousSurface: string | null = null;

/**
 * Hook to apply POS-specific body classes for proper CSS isolation
 * Ensures POS styling doesn't conflict with storefront or admin
 * Also disables Bootstrap auto-initialization to prevent DOM conflicts
 */
export function usePOSTheme() {
  useEffect(() => {
    const body = document.body;
    if (!body) {
      return;
    }

    if (posMountCount === 0) {
      previousSurface = body.getAttribute("data-surface");
    }

    posMountCount += 1;
    body.setAttribute("data-surface", "pos");
    body.classList.add("pos-theme");

    // Disable Bootstrap 4 auto-initialization to prevent conflicts with React portals
    // This prevents AdminLTE's Bootstrap JS from interfering with portal DOM manipulation
    if (typeof window !== 'undefined' && (window as any).jQuery) {
      const $ = (window as any).jQuery;
      // Disable Bootstrap's automatic initialization of modals/dropdowns
      $.fn.modal = () => {};
      $.fn.dropdown = () => {};
      $.fn.tooltip = () => {};
      $.fn.popover = () => {};
    }

    return () => {
      if (posMountCount > 0) {
        posMountCount -= 1;
      }

      if (posMountCount === 0) {
        if (previousSurface) {
          body.setAttribute("data-surface", previousSurface);
        } else {
          body.removeAttribute("data-surface");
        }

        body.classList.remove("pos-theme");
        previousSurface = null;
      }
    };
  }, []);
}
