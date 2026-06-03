export async function POST(request) {
  const { name, size } = await request.json()

  if (!name || !size) {
    return Response.json({ error: 'Missing name or size' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  const prompt = `You are a sneaker resale market expert with up-to-date knowledge of StockX, GOAT, and Klekt pricing in Europe.

Give the current retail price in EUR and current European resale market price in EUR for:
Sneaker: "${name}"
EU Size: ${size}

Respond ONLY with valid JSON, no markdown, no backticks:
{"retailPrice":180,"marketPrice":450,"trend":"up","note":"Korte Nederlandse reden max 6 woorden","sellAdvice":"good"}

Rules:
- retailPrice: integer EUR, the official launch/retail price
- marketPrice: integer EUR, current realistic European resale value (lowest ask)
- trend: "up" if price is rising, "down" if falling, "stable" if flat
- note: short Dutch sentence max 6 words explaining market situation
- sellAdvice: "good" if now is a good time to sell, "wait" if better to hold
- ONLY return the JSON object, nothing else`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const raw = data.content?.find((b) => b.type === 'text')?.text || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return Response.json(parsed)
  } catch (err) {
    return Response.json({ error: 'Failed to fetch price data' }, { status: 500 })
  }
}
