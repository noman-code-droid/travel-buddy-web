import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

export async function POST(req: Request) {
  console.log("🚀 AI Route Started");

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("❌ CRITICAL: Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return new Response('Missing API Key', { status: 500 });
    }

    const body = await req.json();
    const isChat = !!body.messages;
    console.log(`Type: ${isChat ? 'Chat' : 'Planner'}`);

    const coreMessages: CoreMessage[] = isChat
      ? convertToCoreMessages(body.messages)
      : [{ role: 'user', content: String(body.prompt || "") }];

    const lastUserMessage = isChat
      ? body.messages[body.messages.length - 1].content
      : body.prompt;

    // 1. Database Search
    let context = "";
    if (lastUserMessage && lastUserMessage.length > 2) {
      try {
        console.log("🔍 Searching Postgres...");
        const { rows } = await pool.query(
          `SELECT content FROM travel_knowledge
           WHERE fts_tokens @@ plainto_tsquery('english', $1)
           OR content ILIKE $2
           LIMIT 5`,
          [lastUserMessage, `%${lastUserMessage.split(' ')[0]}%`]
        );
        context = rows.map(r => r.content).join("\n\n");
        console.log(`✅ Found ${rows.length} context matches`);
      } catch (dbErr: any) {
        console.error("❌ Database Error:", dbErr.message);
        // Continue anyway so the AI still responds with general knowledge
      }
    }

    // 2. Generate Stream
    const google = createGoogleGenerativeAI({ apiKey });
    console.log("🧠 Calling Gemini...");

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: coreMessages,
      system: `You are Travel Buddy AI, expert for Pakistan.
      VERIFIED DATA: ${context || "No database match. Use general knowledge."}
      RULES: Small Cars 38 PKR/km, Large Cars 54 PKR/km.`,
    });

    console.log("📡 Streaming response...");
    return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

  } catch (err: any) {
    console.error("❌ Global Route Error:", err.message);
    return new Response(err.message, { status: 500 });
  }
}
