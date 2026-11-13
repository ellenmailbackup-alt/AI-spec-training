import { useEffect, useRef } from "react";

/**
 * Hook to dynamically load AdminLTE CSS and JS only when needed for admin pages
 * This prevents AdminLTE (Bootstrap 4 based) from conflicting with Tailwind CSS in storefront
 */
export function useAdminLTE() {
  const loadedRef = useRef(false);

  useEffect(() => {
    // Only load once
    if (loadedRef.current) {
      return;
    }

    loadedRef.current = true;

    // Load AdminLTE CSS
    const adminLTECSS = document.createElement("link");
    adminLTECSS.rel = "stylesheet";
    adminLTECSS.href = "https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css";
    adminLTECSS.id = "adminlte-css";
    document.head.appendChild(adminLTECSS);

    // Load Font Awesome
    const fontAwesomeCSS = document.createElement("link");
    fontAwesomeCSS.rel = "stylesheet";
    fontAwesomeCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    fontAwesomeCSS.id = "fontawesome-css";
    document.head.appendChild(fontAwesomeCSS);

    // Load jQuery (required for AdminLTE)
    const loadScript = (src: string, id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.id = id;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    // Load scripts in sequence (jQuery -> Bootstrap -> AdminLTE)
    loadScript("https://code.jquery.com/jquery-3.6.0.min.js", "jquery-js")
      .then(() => loadScript("https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js", "bootstrap-js"))
      .then(() => loadScript("https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js", "adminlte-js"))
      .then(() => {
        console.log("AdminLTE loaded successfully");
      })
      .catch((error) => {
        console.error("Failed to load AdminLTE dependencies:", error);
      });

    // Cleanup function to remove AdminLTE when component unmounts
    return () => {
      // Note: We don't remove the scripts/styles as they may be needed for subsequent admin page visits
      // Removing and re-adding them could cause performance issues
    };
  }, []);
}
