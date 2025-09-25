import { Hono } from "hono";
import { Resend } from "resend";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/rsvp", async (c) => {
  try {
    const body = await c.req.json();
    const resend = new Resend(c.env.RESEND_API_KEY);
    
    const rsvpData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      accommodation: body.accommodation,
      message: body.message,
      timestamp: new Date().toISOString()
    };
    
    // Store in KV
    const rsvpId = `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.RSVPS.put(rsvpId, JSON.stringify(rsvpData));
    
    // Send email notification
    await resend.emails.send({
      from: 'Birthday RSVP <noreply@webwisdom.ai>',
      to: 'ye-olde-libras@googlegroups.com',
      subject: `New RSVP from ${rsvpData.name}`,
      html: `
        <h2>New RSVP Received</h2>
        <p><strong>Name:</strong> ${rsvpData.name}</p>
        <p><strong>Email:</strong> ${rsvpData.email}</p>
        <p><strong>Phone:</strong> ${rsvpData.phone || 'Not provided'}</p>
        <p><strong>Accommodation:</strong> ${rsvpData.accommodation || 'Not specified'}</p>
        <p><strong>Message:</strong> ${rsvpData.message || 'No message'}</p>
        <p><strong>Timestamp:</strong> ${rsvpData.timestamp}</p>
      `
    });
    
    console.log("RSVP processed and email sent:", rsvpData);
    
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
