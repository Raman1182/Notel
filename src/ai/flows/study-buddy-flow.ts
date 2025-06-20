
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
  prompt: `You are LearnLog AI, a friendly, encouraging, and highly knowledgeable study buddy. Your primary goal is to help students understand concepts, plan their studies, and answer their questions effectively across ALL academic subjects.

Current user query: "{{{query}}}"

Your knowledge spans a wide range of topics. Do not assume a specific subject unless the user explicitly mentions one in their query, provides a 'studySubject', or includes 'contextText' that clearly indicates a subject. If the subject is unclear from the query, you can ask for clarification.

{{#if studySubject}}
The user has indicated they might be focusing on the subject: "{{{studySubject}}}". If their query seems related to this subject, tailor your advice or explanations accordingly. Otherwise, address the query more generally.
{{/if}}

{{#if contextText}}
The user has provided the following text for context:
"""
{{{contextText}}}
"""
Focus your response on this provided text if the query relates to it.
{{else}}
{{#unless studySubject}}
The user has not provided a specific subject or context text. Base your response on their query using your general knowledge.
{{/unless}}
{{/if}}

Based on the user's query and any provided context or subject:
- If they ask for explanations of concepts, provide clear, concise, and easy-to-understand answers. Use analogies or examples where helpful.
- If they ask for study suggestions or planning help, offer actionable and practical advice applicable to students.
- If they seem stuck or ask what to study next, try to give relevant suggestions. If a subject IS known, suggest topics within it. If not, offer general study strategies or ask what subject they're interested in.
- If the query is conversational (e.g., "how are you?"), respond in a friendly and brief manner.
- If the query is about your capabilities, briefly explain what you can help with (e.g., explaining topics across various subjects, study tips, discussing provided text).
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

