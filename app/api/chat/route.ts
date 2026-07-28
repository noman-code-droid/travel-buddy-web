import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30; // Max Vercel timeout

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return new Response('Missing API Key in Vercel settings', { status: 500 });

  try {
    const body = await req.json();
    const isChat = !!body.messages;
    const lastUserMessage = isChat ? body.messages[body.messages.length - 1].content : body.prompt;

    // 1. Safe Database Search (RAG)
    let context = "";
    if (process.env.POSTGRES_URL && lastUserMessage && lastUserMessage.length > 2) {
      try {
        const pool = createPool({ connectionString: process.env.POSTGRES_URL });
        const { rows } = await pool.query(
          `SELECT content FROM travel_knowledge
           WHERE fts_tokens @@ websearch_to_tsquery('english', $1)
           OR content ILIKE $2
           LIMIT 5`,
          [lastUserMessage, `%${lastUserMessage.trim().split(' ')[0]}%`]
        );
        context = rows.map(r => r.content).join("\n\n");
      } catch (dbErr) {
        console.error("Postgres Query Failed - Continuing without context.");
      }
    }

    // 2. AI Initialization
    const google = createGoogleGenerativeAI({ apiKey });
    const coreMessages: CoreMessage[] = isChat
      ? convertToCoreMessages(body.messages)
      : [{ role: 'user', content: String(body.prompt || "") }];

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: coreMessages,
      system: `You are Travel Buddy AI, an expert guide for Pakistan.
      Verified Context: ${context || "Not available. Use general expert knowledge."}
      Rules: Small Cars 38 PKR/km, Large Cars 54 PKR/km. Be concise and friendly.`,
    });

    // 3. Return correct stream for frontend (useChat vs useCompletion)
    return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

  } catch (err: any) {
    console.error("AI Route Crash:", err.message);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
