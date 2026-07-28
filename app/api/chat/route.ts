import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, CoreMessage } from 'ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MODEL_PRIORITY = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

export async function POST(req: Request) {
  // Use primary and secondary keys for fallback
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

    // Convert to unified CoreMessage format
    const coreMessages: CoreMessage[] = isChat
      ? convertToCoreMessages(body.messages)
      : [{ role: 'user', content: String(body.prompt || "") }];

    // Try each API Key, then each Model
    for (const key of apiKeys) {
      const google = createGoogleGenerativeAI({ apiKey: key });

      for (const modelId of MODEL_PRIORITY) {
        try {
          const result = await streamText({
            model: google(modelId),
            messages: coreMessages,
            system: `You are Travel Buddy AI, an expert travel guide for Pakistan.

            RULES:
            - Small Cars: 38 PKR/km, Large Cars: 54 PKR/km.
            - Purpose: Cost-sharing carpool.
            - Safety: Recommend 'Trusted Contacts' for location sharing.
            - Style: Professional, encouraging, and detailed.`,
          });

          // Match the response format to the UI hook (useChat vs useCompletion)
          return isChat ? result.toDataStreamResponse() : result.toTextStreamResponse();

        } catch (modelErr: any) {
          console.warn(`⚠️ Model ${modelId} failed with key ending in ...${key.slice(-4)}: ${modelErr.message}`);

          // If it's a rate limit error, switch to the next API key
          if (modelErr.message?.includes('429') || modelErr.message?.includes('limit')) break;

          // Otherwise, try the next model with the same key
          continue;
        }
      }
    }

    return new Response("All AI accounts and models are currently at capacity. Please try again in 60 seconds.", { status: 503 });

  } catch (err: any) {
    console.error("AI Route Error:", err.message);
    return new Response(err.message, { status: 500 });
  }
}
