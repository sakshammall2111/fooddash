// Vercel serverless function: GET /api/health
// Reports whether the server-side API key is configured.
module.exports = async (req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, api_key_configured: Boolean(process.env.GROQ_API_KEY) }));
};
