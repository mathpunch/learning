// Serverless function for Vercel (api/discord.js)
// Triggers BotGhost webhook with custom events
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Environment variables from Vercel
  const botghostWebhook = process.env.BOTGHOST_WEBHOOK_URL;
  const apiKey = process.env.BOTGHOST_API_KEY;

  if (!botghostWebhook) {
    return res.status(500).json({ error: "BotGhost webhook URL is not configured" });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "BotGhost API key is not configured" });
  }

  try {
    const body = req.body || {};
    
    // Format payload for BotGhost webhook
    const botghostPayload = {
      variables: [
        {
          name: "message",
          variable: "{event_message}",
          value: body.content || body.message || JSON.stringify(body, null, 2)
        }
      ]
    };

    // Add any additional variables from the request
    if (body.variables && Array.isArray(body.variables)) {
      botghostPayload.variables = body.variables;
    }

    const r = await fetch(botghostWebhook, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(botghostPayload),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({ 
        error: "BotGhost returned an error", 
        status: r.status, 
        body: text 
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
