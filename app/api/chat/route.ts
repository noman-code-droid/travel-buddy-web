import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage } from 'ai';
import { createPool } from '@vercel/postgres';

export const runtime = 'nodejs';

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

/**
 * Top 5 models ranked by performance and stability
 */
const MODEL_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

async function getTravelContext(userMessage: string) {
  if (!userMessage || userMessage.length < 2) return "";
  try {
    const { rows } = await pool.query(
      `SELECT content FROM travel_knowledge
       WHERE fts_tokens @@ websearch_to_tsquery('english', $1)
       OR content ILIKE $2
       LIMIT 8`,
      [userMessage, `%${userMessage.split(' ')[0]}%`]
    );
    return rows.map(r => r.content).join("\n\n");
  } catch (e) {
    return "";
  }
}

export async function POST(req: Request) {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_SECONDARY
  ].filter(Boolean) as string[];

  if (keys.length === 0) return new Response('Missing API Configuration', { status: 500 });

  try {
    const body = await req.json();
    const isChat = !!body.messages;

    // Fix: Explicitly type coreMessages as CoreMessage[] to resolve the build error
    const coreMessages: CoreMessage[] = isChat
      ? convertToCoreMessages(body.messages)
      : [{ role: 'user', content: String(body.prompt || "") }];

    const lastUserMessage = isChat
      ? body.messages[body.messages.length - 1].content
      : body.prompt;

    const context = await getTravelContext(lastUserMessage);

    for (const apiKey of keys) {
      const google = createGoogleGenerativeAI({ apiKey });

      for (const modelId of MODEL_PRIORITY) {
        try {
          const result = await streamText({
            model: google(modelId),
            messages: coreMessages,
            system: `You are Travel Buddy AI, an expert travel companion for Pakistan.
            VERIFIED DATA: ${context || "Use general knowledge of Pakistan."}
            BUSINESS RULES:
            - Small Cars (1000cc): 38 PKR/km
            - Large Cars/SUVs: 54 PKR/km
            - Model: Zero-Profit Cost-Sharing.
            - Safety: Suggest sharing live trip with 'Trusted Contacts'.`,
          });

          return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

        } catch (modelErr: any) {
          const errorMsg = modelErr.message || "";
          console.warn(`⚠️ Model ${modelId} failed:`, errorMsg);
          if (errorMsg.includes('429') || errorMsg.includes('limit')) break;
          continue;
        }
      }
    }

    return new Response("All AI accounts and models are currently at capacity.", { status: 503 });

  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
