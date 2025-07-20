
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
  prompt: `You are Notel AI, a friendly, encouraging, and highly knowledgeable study buddy. Your primary goal is to help students understand concepts, plan their studies, and answer their questions effectively across ALL academic subjects.

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
