import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage, embed } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

async function getTravelContext(userMessage: string, google: any) {
  if (!userMessage || userMessage.length < 3) return "";
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: userMessage,
    });
    const vector = `[${embedding.join(',')}]`;
    const { rows: vectorRows } = await pool.query(
      `SELECT content FROM travel_knowledge ORDER BY embedding <=> $1::vector LIMIT 5`,
      [vector]
    );
    if (vectorRows && vectorRows.length > 0) {
      return vectorRows.map(r => r.content).join("\n\n");
    }
  } catch (e: any) {
    console.error("RAG SEARCH FAILED:", e.message);
  }
  return "";
}

export async function POST(req: Request) {
  console.log("🚀 CHAT REQUEST STARTED");

  const key = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
  if (!key) return new Response('Missing API Key', { status: 500 });

  try {
    const body = await req.json();
    const coreMessages: CoreMessage[] = convertToCoreMessages(body.messages || []);
    const lastMsg = body.messages[body.messages.length - 1].content;

    const google = createGoogleGenerativeAI({ apiKey: key });

    // Test Trigger
    if (lastMsg === "TEST_API_ONLY") {
        const result = await streamText({
            model: google('gemini-1.5-flash'),
            prompt: "Say: 'Production API is Online!'"
        });
        return result.toTextStreamResponse();
    }

    const context = await getTravelContext(lastMsg, google);

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: coreMessages,
      system: `You are Travel Buddy AI. Use this context: ${context || "General knowledge."}. Rules: Small Cars 38 PKR/km, Large Cars 54 PKR/km.`,
    });

    return result.toDataStreamResponse();

  } catch (err: any) {
    console.error("CRITICAL API ERROR:", err.message);
    return new Response(err.message, { status: 500 });
  }
}
