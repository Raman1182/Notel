
'use server';
/**
 * @fileOverview An AI flow to find and suggest connections between the current note
 * and other historical notes based on shared concepts.
 *
 * - findNoteConnectionsFlow - A function that suggests connections.
 * - FindNoteConnectionsInput - The input type for the function.
 * - FindNoteConnectionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HistoricalNoteInfoSchema = z.object({
  noteId: z.string().describe('The unique ID of the historical note.'),
  subject: z.string().optional().describe('The subject of the historical note.'),
  title: z.string().describe('The title or name of the historical note.'),
  contentSnippet: z.string().min(10).describe('A brief snippet or summary of the historical note\'s content.'),
});

const FindNoteConnectionsInputSchema = z.object({
  currentNoteId: z.string().describe('The ID of the note currently being analyzed.'),
  currentNoteContent: z.string().min(20).describe('The full content of the current note being analyzed.'),
  currentNoteSubject: z.string().optional().describe('The subject of the current note, for context.'),
  historicalNotes: z.array(HistoricalNoteInfoSchema).min(1).describe('An array of historical notes, each with an ID, title, subject, and content snippet, to find connections with.'),
});
export type FindNoteConnectionsInput = z.infer<typeof FindNoteConnectionsInputSchema>;

const ConnectionSuggestionSchema = z.object({
  connectedNoteId: z.string().describe('The ID of the historical note that is suggested to be connected.'),
  connectedNoteTitle: z.string().describe('The title of the connected historical note.'),
  connectedNoteSubject: z.string().optional().describe('The subject of the connected historical note.'),
  connectingConcept: z.string().describe('The key concept or topic that links the current note with the suggested historical note.'),
  explanation: z.string().describe('A brief explanation of why these two notes are considered connected based on the concept.'),
});

const FindNoteConnectionsOutputSchema = z.object({
  suggestions: z.array(ConnectionSuggestionSchema).describe('An array of suggested connections to other notes.'),
});
export type FindNoteConnectionsOutput = z.infer<typeof FindNoteConnectionsOutputSchema>;

export async function findNoteConnectionsFlow(input: FindNoteConnectionsInput): Promise<FindNoteConnectionsOutput> {
  return internalFindNoteConnectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findNoteConnectionsPrompt',
  input: { schema: FindNoteConnectionsInputSchema },
  output: { schema: FindNoteConnectionsOutputSchema },
  prompt: `You are an AI assistant integrated into a note-taking application called Notel. Your task is to help users discover connections between their current study note and their past notes.

The user is currently working on a note (ID: {{{currentNoteId}}})
{{#if currentNoteSubject}}
Subject: {{{currentNoteSubject}}}
{{/if}}
Current Note Content:
"""
{{{currentNoteContent}}}
"""

You have been provided with a list of snippets from their historical notes:
{{#each historicalNotes}}
---
Historical Note ID: {{this.noteId}}
Historical Note Title: "{{this.title}}"
{{#if this.subject}}
Historical Note Subject: "{{this.subject}}"
{{/if}}
Historical Note Content Snippet:
"""
{{this.contentSnippet}}
"""
---
{{/each}}

Analyze the "Current Note Content". Identify its main themes, key terms, and concepts.
Then, for each "Historical Note Content Snippet", determine if it shares any significant themes, terms, or concepts with the "Current Note Content".

Generate a list of connection suggestions. For each suggestion:
1.  Specify the 'connectedNoteId', 'connectedNoteTitle', and 'connectedNoteSubject' (if available) of the historical note.
2.  Identify the 'connectingConcept' - the specific idea, term, or theme that links the two notes. Be concise and specific.
3.  Provide a brief 'explanation' (1-2 sentences) of how or why these notes are connected through that concept, and why it might be relevant for the user to revisit the historical note.

Focus on meaningful connections that could enhance understanding or reveal relationships between different topics the user has studied.
Do not suggest connecting the current note to itself if its ID appears in the historicalNotes list.
If no strong connections are found, return an empty array for 'suggestions'.
Prioritize quality over quantity. Aim for 2-4 strong suggestions if possible.
`,
});

const internalFindNoteConnectionsFlow = ai.defineFlow(
  {
    name: 'internalFindNoteConnectionsFlow',
    inputSchema: FindNoteConnectionsInputSchema,
    outputSchema: FindNoteConnectionsOutputSchema,
  },
  async (input) => {
    if (input.currentNoteContent.length < 20 || input.historicalNotes.length === 0) {
      return { suggestions: [] };
    }
    // Filter out the current note from historical notes if it somehow got included
    const filteredHistoricalNotes = input.historicalNotes.filter(hn => hn.noteId !== input.currentNoteId);
    if (filteredHistoricalNotes.length === 0) {
        return { suggestions: [] };
    }

    const { output } = await prompt({ ...input, historicalNotes: filteredHistoricalNotes });
    if (!output) {
      throw new Error("AI failed to generate connection suggestions.");
    }
    return output;
  }
);
