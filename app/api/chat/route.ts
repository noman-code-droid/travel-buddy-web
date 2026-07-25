import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';
import { travelKnowledge } from '@/lib/knowledge';

export const runtime = 'edge';

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response('Missing AI API Key', { status: 500 });
  }

  const json = await req.json();

  // Protocol Logic: Handle both 'messages' (Assistant) and 'prompt' (Planner)
  const isCompletion = !!json.prompt;
  const messages = isCompletion
    ? [{ role: 'user', content: json.prompt }]
    : json.messages;

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    messages: isCompletion ? messages : convertToCoreMessages(messages),
    system: `You are the Travel Buddy AI, a specialized travel and safety expert for Pakistan.

    KNOWLEDGE BASE (RAG):
    ${travelKnowledge}

    RESPONSE GUIDELINES:
    - Use the knowledge base above for ALL pricing and safety questions.
    - If planning a trip (Itinerary), include specific Motorway tips (M2/M3) and mention safe rest areas (Bhera, Kalar Kahar).
    - If asked about carpooling, explain our cost-sharing logic (Small cars: 38 PKR/km).
    - Maintain a helpful, "Buddy" persona. Use clear markdown formatting for itineraries.`,
  });

  return result.toDataStreamResponse();
}
