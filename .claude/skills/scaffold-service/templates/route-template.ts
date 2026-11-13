// In server/routes.ts — thin HTTP handler
app.post("/api/resource", isAdmin, async (req, res) => {
  try {
    const validated = insertSchema.parse(req.body);
    const result = await nameService.create(validated);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create resource";
    res.status(error instanceof Error && error.message.includes("not found") ? 404 : 500)
      .json({ error: message });
  }
});
