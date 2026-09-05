import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage, embed } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const MODEL_PRIORITY = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest'
];

async function getTravelContext(userMessage: string, google: any) {
  if (!userMessage || userMessage.length < 3) return "";

  try {
    // 1. Generate semantic embedding
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: userMessage,
    });

    const vector = `[${embedding.join(',')}]`;

    // 2. Vector Similarity Search
    // We use a try-catch for the specific SQL query to prevent dimensions crashing the whole API
    const { rows: vectorRows } = await pool.query(
      `SELECT content FROM travel_knowledge
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [vector]
    );

    if (vectorRows && vectorRows.length > 0) {
      return vectorRows.map(r => r.content).join("\n\n");
    }
  } catch (e: any) {
    console.error("RAG VECTOR SEARCH FAILED:", e.message);
  }

  // 3. Fallback to Keyword Search (Very Robust)
  try {
    const { rows: ftsRows } = await pool.query(
      `SELECT content FROM travel_knowledge
       WHERE content ILIKE $1
       LIMIT 3`,
      [`%${userMessage.split(' ')[0]}%`]
    );
    return ftsRows.map(r => r.content).join("\n\n");
  } catch (e: any) {
    console.error("RAG KEYWORD SEARCH FAILED:", e.message);
    return "";
  }
}

export async function POST(req: Request) {
  console.log("🚀 API CHAT REQUEST RECEIVED!");

  const apiKeys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_SECONDARY
  ].filter(Boolean) as string[];

  if (apiKeys.length === 0) {
    return new Response('AI Configuration Error: No API keys found in Vercel settings.', { status: 500 });
  }

  try {
    const body = await req.json();
    const isChat = !!body.messages;
    const coreMessages: CoreMessage[] = isChat
      ? convertToCoreMessages(body.messages)
      : [{ role: 'user', content: String(body.prompt || "") }];

    const lastMsg = isChat ? body.messages[body.messages.length - 1].content : body.prompt;

    for (const key of apiKeys) {
      try {
        const cleanKey = key.trim();
        console.log(`🔑 Attempting AI with key starting: ${cleanKey.substring(0, 5)}...`);

        const google = createGoogleGenerativeAI({ apiKey: cleanKey });

        // Fetch context
        let context = "";
        try {
          context = await getTravelContext(lastMsg, google);
        } catch (ragErr: any) {
          console.error("⚠️ RAG Context failed:", ragErr.message);
        }

      for (const modelId of MODEL_PRIORITY) {
        try {
          const result = await streamText({
            model: google(modelId),
            messages: coreMessages,
            system: `You are Travel Buddy AI, an expert travel guide for Pakistan.

            KNOWLEDGE BASE CONTEXT:
            ${context || "No specific matches found. Use general expert knowledge about Pakistani travel, routes (M2, M3), and safety numbers (15, 1122)."}

            STRICT RULES:
            - Pricing: Small Cars 38 PKR/km, Large Cars 54 PKR/km.
            - Model: This is a carpooling network, not a taxi service.
            - Style: Professional, friendly, and helpful. Format with Markdown.`,
          });

          return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

        } catch (modelErr: any) {
          console.warn(`⚠️ Model ${modelId} failed: ${modelErr.message}`);
          if (modelErr.message.includes('429')) break;
          continue;
        }
      }
    }

    return new Response("AI Capacity reached. Please try again later.", { status: 503 });

  } catch (err: any) {
    console.error("GLOBAL API ERROR:", err.message);
    return new Response(err.message, { status: 500 });
  }
}
