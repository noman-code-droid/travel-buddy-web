import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage, embed } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

async function getTravelContext(userMessage: string, google: any) {
  console.log("🔍 RAG: Starting context search...");
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: userMessage,
    });
    console.log("🔍 RAG: Embedding generated, dims:", embedding.length);

    const vector = `[${embedding.join(',')}]`;
    const { rows: vectorRows } = await pool.query(
      `SELECT content FROM travel_knowledge ORDER BY embedding <=> $1::vector LIMIT 3`,
      [vector]
    );
    console.log("🔍 RAG: DB query finished, rows found:", vectorRows?.length || 0);

    return vectorRows?.map(r => r.content).join("\n\n") || "";
  } catch (e: any) {
    console.error("❌ RAG ERROR:", e.message);
    return "";
  }
}

export async function POST(req: Request) {
  console.log("🚀 --- NEW REQUEST RECEIVED ---");

  const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const key = rawKey.trim();

  if (!key) {
    console.error("❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY is empty in Vercel!");
    return new Response('Config Error: Missing Key', { status: 500 });
  }

  try {
    const body = await req.json();
    const lastMsg = body.messages[body.messages.length - 1].content;
    console.log("💬 User Message:", lastMsg);

    const google = createGoogleGenerativeAI({ apiKey: key });

    // We saw this model in your curl list!
    const modelId = 'gemini-2.5-flash';
    console.log("🤖 Attempting model:", modelId);

    if (lastMsg === "TEST_API_ONLY") {
        console.log("🛠️ TEST_API_ONLY mode active");
        const result = await streamText({
            model: google(modelId),
            prompt: "Say: 'Production AI is LIVE!'"
        });
        return result.toTextStreamResponse();
    }

    const context = await getTravelContext(lastMsg, google);

    const result = await streamText({
      model: google(modelId),
      messages: convertToCoreMessages(body.messages),
      system: `You are Travel Buddy AI. Context: ${context || "None"}. Rules: Small Cars 38, Large 54 PKR/km.`,
    });

    console.log("✅ Stream starting successfully");
    return result.toDataStreamResponse();

  } catch (err: any) {
    console.error("💥 CRITICAL CRASH:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
