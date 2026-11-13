import { useEffect } from "react";

let adminMountCount = 0;
let previousSurface: string | null = null;

/**
 * Hook to apply admin-specific body classes for proper CSS isolation
 * Ensures AdminLTE styling doesn't conflict with storefront or POS
 */
export function useAdminTheme() {
  useEffect(() => {
    const body = document.body;
    if (!body) {
      return;
    }

    if (adminMountCount === 0) {
      previousSurface = body.getAttribute("data-surface");
    }

    adminMountCount += 1;
    body.setAttribute("data-surface", "admin");
    body.classList.add("admin-theme");

    // AdminLTE requires specific body classes
    body.classList.add("sidebar-mini", "layout-fixed");

    return () => {
      if (adminMountCount > 0) {
        adminMountCount -= 1;
      }

      if (adminMountCount === 0) {
        if (previousSurface) {
          body.setAttribute("data-surface", previousSurface);
        } else {
          body.removeAttribute("data-surface");
        }

        body.classList.remove("admin-theme");
        body.classList.remove("sidebar-mini", "layout-fixed");
        previousSurface = null;
      }
    };
  }, []);
}
