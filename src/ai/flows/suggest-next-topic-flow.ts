
'use server';
/**
 * @fileOverview An AI flow to suggest the next study topic based on user's
 * study history and upcoming deadlines.
 *
 * - suggestNextTopicFlow - A function that suggests a topic.
 * - SuggestNextTopicInput - The input type for the function.
 * - SuggestNextTopicOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SessionInfoSchema = z.object({
  subject: z.string().describe('The subject of the study session.'),
  startTime: z.number().describe('The Unix timestamp (in milliseconds) when the session started.'),
  actualDuration: z.number().optional().describe('The actual duration of the session in seconds.'),
});

const DeadlineInfoSchema = z.object({
  title: z.string().describe('The title of the deadline, which may contain the subject name.'),
  dueDate: z.string().describe('The due date of the assignment (YYYY-MM-DD format).'),
});

const SuggestNextTopicInputSchema = z.object({
  historicalSessions: z.array(SessionInfoSchema).describe('An array of past study sessions.'),
  upcomingDeadlines: z.array(DeadlineInfoSchema).describe('An array of upcoming deadlines.'),
  subjects: z.array(z.string()).describe('A list of all unique subjects the user has studied.'),
});
export type SuggestNextTopicInput = z.infer<typeof SuggestNextTopicInputSchema>;

const SuggestNextTopicOutputSchema = z.object({
  suggestedSubject: z.string().describe('The subject the AI suggests the user study next. Must be one of the subjects from the input list.'),
  reasoning: z.string().describe('A brief, encouraging explanation for why this subject is suggested (e.g., upcoming deadline, topic not studied recently).'),
});
export type SuggestNextTopicOutput = z.infer<typeof SuggestNextTopicOutputSchema>;

export async function suggestNextTopicFlow(input: SuggestNextTopicInput): Promise<SuggestNextTopicOutput> {
  return internalSuggestNextTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextTopicPrompt',
  input: { schema: SuggestNextTopicInputSchema },
  output: { schema: SuggestNextTopicOutputSchema },
  prompt: `You are an expert academic advisor AI for the LearnLog app. Your goal is to help a student decide what to study next.

Analyze the student's study history and upcoming deadlines to provide a smart recommendation.

Here is the data you have:
- Today's Date: ${new Date().toDateString()}
- All subjects the user has ever studied: {{{json subjects}}}

Upcoming Deadlines:
{{#if upcomingDeadlines}}
{{#each upcomingDeadlines}}
- "{{this.title}}" is due on {{this.dueDate}}.
{{/each}}
{{else}}
- No upcoming deadlines.
{{/if}}

Recent Study Sessions (most recent first):
{{#if historicalSessions}}
{{#each historicalSessions}}
- Studied "{{this.subject}}" on {{#intlDateTimeFormat this.startTime timeZone="UTC" day="numeric" month="long" year="numeric"}}{{/intlDateTimeFormat}}{{#if this.actualDuration}} for {{#round (divide this.actualDuration 60)}}{{/round}} minutes{{/if}}.
{{/each}}
{{else}}
- No study history available.
{{/if}}

Your Task:
1.  Identify which subject needs the most attention. Consider these factors in order of importance:
    a. Upcoming deadlines. If a deadline's title mentions a subject, prioritize that subject, especially if the deadline is soon.
    b. Subjects that have not been studied recently. Encourage spaced repetition.
    c. Subjects that have been studied for less total time.
2.  Choose ONE subject from the list of available subjects. Your 'suggestedSubject' MUST EXACTLY match one of the strings in the provided 'subjects' array.
3.  Provide a concise, one-to-two sentence 'reasoning' for your suggestion. Be encouraging and clear. For example: "Calculus has a deadline coming up soon, it's a good time to prepare!" or "You haven't studied Physics in a while. Revisiting it now will help with long-term memory."

If there's no data, suggest they start a new session on any topic they're interested in.
`,
});

const internalSuggestNextTopicFlow = ai.defineFlow(
  {
    name: 'internalSuggestNextTopicFlow',
    inputSchema: SuggestNextTopicInputSchema,
    outputSchema: SuggestNextTopicOutputSchema,
  },
  async (input) => {
    if (input.subjects.length === 0) {
        return {
            suggestedSubject: "A New Topic",
            reasoning: "You have no study history yet. Start a session on any subject you're interested in to begin your journey!"
        }
    }
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a suggestion.");
    }
    // Ensure the suggested subject is valid
    if (!input.subjects.includes(output.suggestedSubject)) {
        // Fallback if AI hallucinates a subject
        return {
            suggestedSubject: input.subjects[0],
            reasoning: `Let's start by reviewing ${input.subjects[0]}. It's always a good idea to reinforce what you've learned.`
        }
    }

    return output;
  }
);
