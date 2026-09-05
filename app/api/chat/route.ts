import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage, embed } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

// 2026 Update: Using the latest models found in your API list
const SAFE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest'
];

async function getTravelContext(userMessage: string, google: any) {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: userMessage,
    });
    const vector = `[${embedding.join(',')}]`;
    const { rows } = await pool.query(
      `SELECT content FROM travel_knowledge ORDER BY embedding <=> $1::vector LIMIT 3`,
      [vector]
    );
    return rows?.map(r => r.content).join("\n\n") || "";
  } catch (e) {
    console.error("RAG Context Error:", e);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const key = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
    if (!key) return new Response('ERROR: API Key Missing in Vercel settings.', { status: 200 });

    const body = await req.json();
    const lastMsg = body.messages[body.messages.length - 1].content;
    const google = createGoogleGenerativeAI({ apiKey: key });

    // Internal loop to find a working model
    for (const modelId of SAFE_MODELS) {
      try {
        const context = await getTravelContext(lastMsg, google);

        const result = await streamText({
          model: google(modelId),
          messages: convertToCoreMessages(body.messages),
          system: `You are Travel Buddy AI. Context: ${context}. Pricing: Small Cars 38, Large 54 PKR/km.`,
        });

        return result.toDataStreamResponse();
      } catch (modelErr: any) {
        console.warn(`Attempt with ${modelId} failed: ${modelErr.message}`);
        if (modelId === SAFE_MODELS[SAFE_MODELS.length - 1]) throw modelErr;
      }
    }
  } catch (globalErr: any) {
    // This will force the error to show up in your "RAW ERROR" box on the site
    return new Response(`3:"SERVER CRASH: ${globalErr.message}"`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
