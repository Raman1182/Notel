
'use server';
/**
 * @fileOverview An AI flow for a conversational study buddy.
 *
 * - studyBuddyFlow - A function that handles conversational educational assistance.
 * - StudyBuddyInput - The input type for the studyBuddyFlow function.
 * - StudyBuddyOutput - The return type for the studyBuddyFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudyBuddyInputSchema = z.object({
  query: z.string().min(1).describe('The user\'s question or request to the study buddy.'),
  contextText: z.string().optional().describe('Optional text provided by the user for specific context, e.g., pasted notes.'),
  studySubject: z.string().optional().describe('Optional current study subject for tailored advice.'),
});
export type StudyBuddyInput = z.infer<typeof StudyBuddyInputSchema>;

const StudyBuddyOutputSchema = z.object({
  response: z.string().describe('The AI study buddy\'s response to the user.'),
});
export type StudyBuddyOutput = z.infer<typeof StudyBuddyOutputSchema>;

export async function studyBuddyFlow(input: StudyBuddyInput): Promise<StudyBuddyOutput> {
  return internalStudyBuddyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyBuddyPrompt',
  input: { schema: StudyBuddyInputSchema },
  output: { schema: StudyBuddyOutputSchema },
  prompt: `You are LearnLog AI, a friendly, encouraging, and highly knowledgeable study buddy. Your primary goal is to help students understand concepts, plan their studies, and answer their questions effectively.

Current user query: "{{{query}}}"

{{#if studySubject}}
The user is likely focusing on the subject: "{{{studySubject}}}". Try to tailor your advice or explanations to this subject if relevant.
{{/if}}

{{#if contextText}}
The user has provided the following text for context:
"""
{{{contextText}}}
"""
Focus your response on this provided text if the query relates to it.
{{else}}
The user has not provided specific text. Base your response on their query and general knowledge, or the study subject if provided.
{{/if}}

Based on the user's query and any provided context or subject:
- If they ask for explanations of concepts, provide clear, concise, and easy-to-understand answers. Use analogies or examples where helpful.
- If they ask for study suggestions or planning help, offer actionable and practical advice.
- If they seem stuck or ask what to study next, try to give relevant suggestions. If a subject is known, suggest topics within it.
- If the query is conversational (e.g., "how are you?"), respond in a friendly and brief manner.
- If the query is about your capabilities, briefly explain what you can help with (e.g., explaining topics, study tips, discussing provided text).
- Maintain an encouraging and supportive tone.
- Your response should be directly addressing the user.
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
