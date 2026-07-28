import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return new Response('Missing API Key', { status: 500 });

    const google = createGoogleGenerativeAI({ apiKey });
    const body = await req.json();
    const isChat = !!body.messages;

    const coreMessages = isChat ? convertToCoreMessages(body.messages) : [{ role: 'user', content: body.prompt }];
    const lastUserMessage = isChat ? body.messages[body.messages.length - 1].content : body.prompt;

    // 1. RAG Search
    let context = "";
    if (lastUserMessage && lastUserMessage.length > 2) {
      try {
        const { rows } = await pool.query(
          `SELECT content FROM travel_knowledge
           WHERE fts_tokens @@ plainto_tsquery('english', $1)
           OR content ILIKE $2
           LIMIT 5`,
          [lastUserMessage, `%${lastUserMessage.split(' ')[0]}%`]
        );
        context = rows.map(r => r.content).join("\n\n");
      } catch (e) { console.error("DB Error:", e); }
    }

    // 2. Generate using gemini-2.0-flash (verified available in your list)
    const result = await streamText({
      model: google('gemini-2.0-flash'),
      messages: coreMessages,
      system: `You are Travel Buddy AI, an expert travel companion for Pakistan.
      VERIFIED DATA: ${context || "Use general knowledge."}
      RULES: Small Cars 38 PKR/km, Large Cars 54 PKR/km.`,
    });

    return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

  } catch (err: any) {
    console.error("AI Route Error:", err);
    return new Response(err.message, { status: 500 });
  }
}
