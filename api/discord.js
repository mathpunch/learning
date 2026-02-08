// Serverless function for Vercel (api/discord.js)
// Secured with authentication token - triggers BotGhost webhook
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ SECURITY: Check authentication token
  const authToken = req.headers.authorization;
  const validToken = process.env.VERCEL_AUTH_TOKEN;

  if (!validToken) {
    return res.status(500).json({ error: "Server authentication not configured" });
  }

  if (!authToken || authToken !== `Bearer ${validToken}`) {
    return res.status(401).json({ error: "Unauthorized - Invalid or missing token" });
  }

  // Get BotGhost webhook URL
  const botghostWebhook = process.env.BOTGHOST_WEBHOOK_URL;

  if (!botghostWebhook) {
    return res.status(500).json({ error: "BotGhost webhook URL not configured" });
  }

  try {
    const body = req.body || {};
    
    // Format payload for BotGhost webhook
    const botghostPayload = {
      variables: body.variables || [
        {
          name: "message",
          variable: "{event_message}",
          value: body.content || body.message || JSON.stringify(body, null, 2)
        }
      ]
    };

    // Send to BotGhost webhook (no Authorization header needed)
    const r = await fetch(botghostWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(botghostPayload),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({ 
        error: "BotGhost webhook failed", 
        status: r.status, 
        body: text 
      });
    }

    return res.status(200).json({ success: true, message: "Webhook triggered successfully" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
```

## Vercel Environment Variables to Set

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these **2 variables**:

### 1. `BOTGHOST_WEBHOOK_URL`
```
https://api.botghost.com/webhook/1469924100909564088/4c0mcm6sm4c8t01saw9mbu
```

### 2. `VERCEL_AUTH_TOKEN`
Generate a strong random token (copy one of these):
```
a8f7e2d9c4b6a1f3e8d7c2b9a4f6e1d3
