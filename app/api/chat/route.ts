import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'edge';

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const MODEL_PRIORITY = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash'
];

async function getTravelContext(userMessage: string) {
  try {
    const { rows } = await pool.query(
      `SELECT content FROM travel_knowledge
       WHERE fts_tokens @@ websearch_to_tsquery('english', $1)
       OR content ILIKE $2
       ORDER BY ts_rank(fts_tokens, websearch_to_tsquery('english', $1)) DESC
       LIMIT 10`,
      [userMessage, `%${userMessage.split(' ').slice(0, 3).join('%')}%`]
    );

    return rows.map(r => r.content).join("\n\n");
  } catch (e) {
    console.error("❌ RAG Search failed:", e);
    return "";
  }
}

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response('AI Configuration Error: Missing API Key', { status: 500 });
  }

  const body = await req.json();

  // Detect if it's a Chat (messages) or a Planner (prompt)
  const isChat = !!body.messages;
  let lastUserMessage = "";
  let coreMessages: any[] = [];

  if (isChat) {
    coreMessages = convertToCoreMessages(body.messages);
    lastUserMessage = body.messages[body.messages.length - 1].content;
  } else {
    lastUserMessage = body.prompt || "";
    coreMessages = [{ role: 'user', content: lastUserMessage }];
  }

  const context = await getTravelContext(lastUserMessage);

  for (const modelId of MODEL_PRIORITY) {
    try {
      const result = await streamText({
        model: google(modelId),
        messages: coreMessages,
        system: `You are Travel Buddy AI, an expert trip planner and companion for Pakistan.

        CRITICAL: USE THIS REAL DATA FROM OUR DATABASE TO PLAN:
        ${context || "No specific database matches found. Use general knowledge."}

        PLANNING INSTRUCTIONS:
        1. When planning a trip, suggest specific HOTELS and RESTAURANTS from the data above.
        2. Always mention specific safety warnings from the database.
        3. Explain the Cost-Sharing model: Small Cars 38 PKR/km, Large Cars 54 PKR/km.
        4. Be helpful, enthusiastic, and format your response with beautiful Markdown.`,
      });

      // KEY FIX: useChat (ChatView) needs toDataStreamResponse
      // useCompletion (PlannerView) needs toTextStreamResponse
      return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

    } catch (e: any) {
      console.warn(`Model ${modelId} failed:`, e.message);
      continue;
    }
  }

  return new Response("Service Busy", { status: 503 });
}
