import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage, embed } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const MODEL_PRIORITY = [
  'gemini-2.0-flash', // Keep for future
  'gemini-1.5-flash', // Common stable
  'gemini-2.5-flash', // Your key has this
  'gemini-3.1-flash-lite-preview', // Your key has this
  'gemini-flash-latest' // Safe fallback
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
    const { rows: vectorRows } = await pool.query(
      `SELECT content FROM travel_knowledge
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [vector]
    );

    if (vectorRows.length > 0) {
      return vectorRows.map(r => r.content).join("\n\n");
    }
  } catch (e: any) {
    console.error("RAG SEARCH CRASHED:", e.message);
    return ""; // Return empty context instead of crashing the whole API
  }

  // 3. Fallback to Full-Text Search
  try {
    const { rows: ftsRows } = await pool.query(
      `SELECT content FROM travel_knowledge
       WHERE fts_tokens @@ websearch_to_tsquery('english', $1)
       OR content ILIKE $2
       LIMIT 3`,
      [userMessage, `%${userMessage.split(' ')[0]}%`]
    );
    return ftsRows.map(r => r.content).join("\n\n");
  } catch (e) {
    return "";
  }
}

export async function POST(req: Request) {
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

    // Try each API Key
    for (const key of apiKeys) {
      const google = createGoogleGenerativeAI({ apiKey: key });

      // Fetch context once per key if needed
      let context = "";
      try {
        context = await getTravelContext(lastMsg, google);
      } catch (ctxErr) {
        console.warn("Context retrieval failed for key.");
      }

      for (const modelId of MODEL_PRIORITY) {
        try {
          const result = await streamText({
            model: google(modelId),
            messages: coreMessages,
            system: `You are Travel Buddy AI, an expert travel guide for Pakistan.

            REAL-WORLD DATA FROM DATABASE:
            ${context || "No specific matches found. Use general expert knowledge."}

            STRICT RULES:
            - Pricing: Small Cars 38 PKR/km, Large Cars 54 PKR/km.
            - Purpose: Cost-sharing carpool, zero-profit model.
            - Safety: Recommend 'Trusted Contacts' for location sharing.
            - Style: Friendly, professional, and detailed using Markdown.`,
          });

          return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

        } catch (modelErr: any) {
          const msg = modelErr.message || "";
          console.warn(`⚠️ Model ${modelId} failed: ${msg}`);
          if (msg.includes('429') || msg.includes('limit')) break;
          continue;
        }
      }
    }

    return new Response("AI Capacity reached. Please try again later.", { status: 503 });

  } catch (err: any) {
    console.error("Global AI Route Error:", err.message);
    return new Response(err.message, { status: 500 });
  }
}
