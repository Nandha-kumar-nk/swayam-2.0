// backend/utils/gemini.js
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ||    'gemini-2.5-flash'; 
// ⬆ you can try other names later: 'gemini-1.5-pro', etc.

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY is not set. AI chat will use fallback responses only.');
}

async function getGeminiResponse(message, courseContext = 'General course help', history = []) {
  const fallback = `I'm your SWAYAM 2.0 study assistant.

Right now I can't reach the Gemini API, so this is a simple offline response.

You asked: "${message}"

Try:
- Breaking the question into smaller parts
- Revisiting the relevant course videos/notes
- Writing down what you already understand, and what is confusing.

If this keeps happening, please ask your admin/teacher to check the Gemini API key and model configuration.`;

  // If no API key → just return fallback, no errors
  if (!GEMINI_API_KEY) return fallback;

  try {
    const historyText = (history || [])
      .slice(-4)
      .map(h => `${(h.role || 'user').toUpperCase()}: ${h.content}`)
      .join('\n');

    const prompt = `
You are an AI study assistant for the SWAYAM 2.0 platform.

Course Context: ${courseContext}

Recent conversation:
${historyText || 'None'}

Student question:
${message}

Guidelines:
- Be clear, friendly, and concise.
- Use simple language with small examples.
- For assignments, give hints and explanations, NOT full direct answers.
- Use markdown for code ( \`\`\`code\`\`\` ) and bullet points when helpful.
`;

    const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        params: {
          key: GEMINI_API_KEY,
        },
      }
    );

    const candidates = response.data?.candidates;
    const text = candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('GEMINI ERROR: unexpected response format:', JSON.stringify(response.data, null, 2));
      return fallback;
    }

    return text;
  } catch (err) {
    if (err.response?.data) {
      console.error('GEMINI ERROR:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('GEMINI ERROR:', err.message || err);
    }
    // 🔁 IMPORTANT: we return fallback instead of breaking your app
    return fallback;
  }
}

module.exports = getGeminiResponse;
