
'use server';
/**
 * @fileOverview An AI flow to generate flashcards from note content.
 *
 * - generateFlashcardsFlow - A function that generates flashcards.
 * - GenerateFlashcardsInput - The input type for the function.
 * - GenerateFlashcardsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FlashcardSchema = z.object({
  front: z.string().describe('The front side of the flashcard (e.g., a term, concept, or question).'),
  back: z.string().describe('The back side of the flashcard (e.g., a definition, explanation, or answer).'),
});

export const GenerateFlashcardsInputSchema = z.object({
  noteContent: z.string().min(20).describe('The content of the note from which to generate flashcards. Should be substantial enough for meaningful flashcards.'),
  subject: z.string().optional().describe('The subject of the note, to provide context.'),
  numFlashcards: z.number().min(1).max(20).optional().default(5).describe('The desired number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

export const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcardsFlow(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return internalGenerateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: { schema: GenerateFlashcardsInputSchema },
  output: { schema: GenerateFlashcardsOutputSchema },
  prompt: `You are an AI assistant helping a student create flashcards from their study notes.
The student is studying the subject: {{{subject}}}.
The note content is:
"""
{{{noteContent}}}
"""

Please generate {{{numFlashcards}}} flashcards from this note content. Each flashcard should have a 'front' (a key term, concept, or question) and a 'back' (its definition, explanation, or answer).
Focus on the most important information and create concise, effective flashcards for learning.
The flashcards should be distinct and cover different aspects of the notes if possible.
Ensure the output is an array of flashcard objects, each with a "front" and "back" string field.
`,
});

const internalGenerateFlashcardsFlow = ai.defineFlow(
  {
    name: 'internalGenerateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    if (input.noteContent.length < 20) {
        return { flashcards: [{front: "Note too short", back: "Please provide more content to generate flashcards."}] };
    }
    const { output } = await prompt(input);
    if (!output || !output.flashcards) {
      throw new Error("AI failed to generate flashcards.");
    }
    return output;
  }
);
