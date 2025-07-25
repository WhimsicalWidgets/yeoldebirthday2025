import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/rsvp", async (c) => {
  try {
    const body = await c.req.json();
    
    // Log the RSVP data (in production, you'd save this to a database)
    console.log("RSVP received:", {
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      timestamp: new Date().toISOString()
    });
    
    return c.json({ 
      success: true, 
      message: "RSVP received successfully!" 
    });
  } catch (error) {
    console.error("Error processing RSVP:", error);
    return c.json({ 
      success: false, 
      message: "Failed to process RSVP" 
    }, 500);
  }
});

export default app;
