import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { travelKnowledge } from '@/lib/knowledge';

export const runtime = 'edge';

export async function POST(req: Request) {
  // Ensure the API key exists to prevent silent failures on Vercel
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable', { status: 500 });
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-flash'), // Changed to Flash for better speed and stability
    messages,
    system: `You are the Travel Buddy AI Assistant, a helpful and safety-conscious travel companion for users in Pakistan.
    Use the following knowledge base to provide accurate and relevant information.

    Guidelines:
    - If a user asks about pricing, explain our "Cost-Sharing" model (Small vs Large cars).
    - If a user asks about safety, emphasize emergency numbers (15, 1122) and the SOS button.
    - Keep responses concise and mobile-friendly.

    Knowledge Base:
    ${travelKnowledge}`,
  });

  return result.toDataStreamResponse();
}
