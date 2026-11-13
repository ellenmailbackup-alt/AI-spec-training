import { useEffect } from "react";
import "@/styles/storefront-theme.css";

let storefrontMountCount = 0;
let previousSurface: string | null = null;

export function useStorefrontTheme() {
  useEffect(() => {
    const body = document.body;
    if (!body) {
      return;
    }

    if (storefrontMountCount === 0) {
      previousSurface = body.getAttribute("data-surface");
    }

    storefrontMountCount += 1;
    body.setAttribute("data-surface", "storefront");
    body.classList.add("storefront-theme");

    return () => {
      if (storefrontMountCount > 0) {
        storefrontMountCount -= 1;
      }

      if (storefrontMountCount === 0) {
        if (previousSurface) {
          body.setAttribute("data-surface", previousSurface);
        } else {
          body.removeAttribute("data-surface");
        }

        body.classList.remove("storefront-theme");
        previousSurface = null;
      }
    };
  }, []);
}
