import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';
export const maxDuration = 30;

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

async function getVectorContext(userMessage: string, apiKey: string) {
  if (!userMessage || userMessage.length < 3) return "";

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const embedModel = google.textEmbeddingModel('text-embedding-004');

    // 1. Generate embedding for user query
    const { embedding } = await embedModel.doEmbed({ values: [userMessage] });
    const vector = `[${embedding[0].join(',')}]`;

    // 2. Vector Similarity Search (<=> is Cosine Distance)
    const { rows } = await pool.query(
      `SELECT content FROM travel_knowledge
       ORDER BY embedding <=> $1::vector
       LIMIT 5`,
      [vector]
    );

    return rows.map(r => r.content).join("\n\n");
  } catch (e) {
    console.error("Vector Search Failed, falling back to FTS:", e);
    // Fallback to Full-Text Search if vector fails
    const { rows } = await pool.query(
      `SELECT content FROM travel_knowledge
       WHERE fts_tokens @@ websearch_to_tsquery('english', $1)
       LIMIT 3`,
      [userMessage]
    );
    return rows.map(r => r.content).join("\n\n");
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return new Response('Missing API Key', { status: 500 });

  try {
    const body = await req.json();
    const isChat = !!body.messages;
    const coreMessages: CoreMessage[] = isChat
      ? convertToCoreMessages(body.messages)
      : [{ role: 'user', content: String(body.prompt || "") }];

    const lastMsg = isChat ? body.messages[body.messages.length - 1].content : body.prompt;

    // Get Context using Semantic Search
    const context = await getVectorContext(lastMsg, apiKey);

    const google = createGoogleGenerativeAI({ apiKey });
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: coreMessages,
      system: `You are Travel Buddy AI, an expert for Pakistan.

      REAL-WORLD DATA FROM DATABASE:
      ${context || "No specific matches. Use general knowledge."}

      STRICT RULES:
      - Pricing: Small Cars 38 PKR/km, Large Cars 54 PKR/km.
      - Model: Zero-Profit Cost-Sharing.
      - Format: Professional and friendly. Use Markdown.`,
    });

    return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
