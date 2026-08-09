// Proxies the Anthropic API so the key never reaches the browser.
// Set ANTHROPIC_API_KEY in Netlify → Site configuration → Environment variables.

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  const key = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    return json({ error: "ANTHROPIC_API_KEY is not set on this site." }, 500);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Request body was not valid JSON." }, 400);
  }

  const { system, section } = payload;
  if (!system || !section) {
    return json({ error: "Both 'system' and 'section' are required." }, 400);
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4000,
        system,
        messages: [
          { role: "user", content: "Questionnaire section:\n\n" + section }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return json(
        { error: (data.error && data.error.message) || "The model API returned an error." },
        res.status
      );
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return json({ text });
  } catch (err) {
    return json({ error: "Could not reach the model API: " + err.message }, 502);
  }
};

export const config = { path: "/api/answer" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
