
'use server';
/**
 * @fileOverview An AI flow for a conversational study buddy.
 *
 * - studyBuddyFlow - A function that handles conversational educational assistance.
 * - StudyBuddyInput - The input type for the studyBuddyFlow function.
 * - StudyBuddyOutput - The return type for the studyBuddyFlow function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const StudyBuddyInputSchema = z.object({
  query: z.string().min(1).describe('The user\'s question or request to the study buddy.'),
  contextText: z.string().optional().describe('Optional text provided by the user for specific context, e.g., pasted notes.'),
  studySubject: z.string().optional().describe('Optional current study subject for tailored advice.'),
});
export type StudyBuddyInput = z.infer<typeof StudyBuddyInputSchema>;

const CitationSchema = z.object({
  url: z.string().url().describe("The URL of the source."),
  title: z.string().describe("The title of the source page."),
  publication: z.string().optional().describe("The publication or website name."),
});

const StudyBuddyOutputSchema = z.object({
  response: z.string().describe('The AI study buddy\'s response to the user. It may contain citation markers like [1], [2].'),
  citations: z.array(CitationSchema).optional().describe("An array of web sources used to generate the response."),
});
export type StudyBuddyOutput = z.infer<typeof StudyBuddyOutputSchema>;

export async function studyBuddyFlow(input: StudyBuddyInput): Promise<StudyBuddyOutput> {
  return internalStudyBuddyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyBuddyPrompt',
  input: { schema: StudyBuddyInputSchema },
  output: { schema: StudyBuddyOutputSchema },
  tools: [googleAI.googleSearch],
  prompt: `You are LearnLog AI, a friendly, encouraging, and highly knowledgeable study buddy. Your primary goal is to help students understand concepts, plan their studies, and answer their questions effectively across ALL academic subjects.

When the user asks a question that requires factual information or up-to-date knowledge, you **must** use your web search tool to find answers from reliable online sources.

When you use information from a web search, you MUST cite your sources.
- In your 'response' text, add citation markers, like [1], [2], at the end of the sentence or fact that came from a source.
- Populate the 'citations' array with the corresponding sources. For each source, provide the full URL and the title of the page.

Current user query: "{{{query}}}"

{{#if studySubject}}
The user has indicated they might be focusing on the subject: "{{{studySubject}}}". If their query seems related to this subject, tailor your advice or explanations accordingly.
{{/if}}

{{#if contextText}}
The user has provided the following text for context. Prioritize this text for your answer if relevant.
"""
{{{contextText}}}
"""
{{/if}}

Based on the user's query and any provided context:
- If they ask for explanations of concepts, provide clear, concise, and easy-to-understand answers. Use analogies or examples.
- If they ask for study suggestions, offer actionable advice.
- Maintain an encouraging and supportive tone.
`,
});

const internalStudyBuddyFlow = ai.defineFlow(
  {
    name: 'internalStudyBuddyFlow',
    inputSchema: StudyBuddyInputSchema,
    outputSchema: StudyBuddyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("AI Study Buddy failed to generate a response.");
    }
    return output;
  }
);
