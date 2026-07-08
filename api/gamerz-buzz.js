export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.thegamerzhub.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const CACHE_LIFE = 6 * 60 * 60; // 6 hours, in seconds
  res.setHeader('Cache-Control', `s-maxage=${CACHE_LIFE}, stale-while-revalidate`);

  try {
    const prompt = 'Search for the 10 most important gaming news from the past 48 hours. Return ONLY a JSON array (no markdown): [{"tag":"emoji+label","headline":"max 80 chars","meta":"Source date","url":"article URL"}]';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Anthropic API error' });
    }

    const data = await response.json();
    const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const items = JSON.parse(txt.replace(/```json|```/g, '').trim());

    if (Array.isArray(items) && items.length >= 3) {
      return res.status(200).json({ items });
    }
    return res.status(502).json({ error: 'Invalid response format' });

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
