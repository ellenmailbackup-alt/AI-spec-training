import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve the Vite build output
  app.use(express.static(distPath));

  // Also serve uploaded product images from the project root's public directory
  const uploadsPath = path.resolve(process.cwd(), "public");
  app.use(express.static(uploadsPath));

  // fall through to index.html for GET requests only (SPA routing)
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
