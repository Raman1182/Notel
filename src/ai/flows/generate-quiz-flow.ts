
'use server';
/**
 * @fileOverview An AI flow to generate a quiz from note content.
 *
 * - generateQuizFlow - A function that generates quiz questions.
 * - GenerateQuizInput - The input type for the function.
 * - GenerateQuizOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question text.'),
  options: z.array(z.string()).optional().describe('For multiple-choice questions, an array of 2-4 option strings. One of these must be the correctAnswer.'),
  correctAnswer: z.string().describe('The correct answer to the question. If multiple-choice, this must exactly match one of the strings in the options array.'),
  type: z.enum(['multiple-choice', 'open-ended']).describe('The type of question.'),
  explanation: z.string().optional().describe('A brief explanation for the correct answer, especially for tricky questions.'),
});

const GenerateQuizInputSchema = z.object({
  noteContent: z.string().min(50).describe('The content of the note from which to generate a quiz. Should be substantial enough for meaningful questions.'),
  subject: z.string().optional().describe('The subject of the note, to provide context for the quiz.'),
  numQuestions: z.number().min(1).max(10).optional().default(3).describe('The desired number of quiz questions to generate.'),
  quizType: z.enum(['multiple-choice', 'open-ended', 'mixed']).optional().default('mixed').describe("Preferred type of questions. 'mixed' will try for a variety."),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
  quizTitle: z.string().optional().describe('A suggested title for the quiz, e.g., "Quiz on Photosynthesis Notes".'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuizFlow(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return internalGenerateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an AI assistant tasked with creating a quiz for a student based on their study notes.
The student is studying the subject: {{{subject}}}.
The note content is:
"""
{{{noteContent}}}
"""

Please generate {{{numQuestions}}} quiz questions from this note content.
The preferred question type is: {{{quizType}}}. If 'mixed', include a variety if possible.
- For 'multiple-choice' questions, provide 3-4 distinct options, and ensure one of them is the 'correctAnswer'. The 'correctAnswer' string must exactly match one of the 'options' strings.
- For 'open-ended' questions, the 'correctAnswer' should be a concise, ideal answer. No 'options' array is needed.
- Include a brief 'explanation' for the correct answer if it clarifies a complex point or common misconception.

Focus on important concepts from the notes. The questions should test understanding, not just recall of trivial facts.
Provide a \\\`quizTitle\\\` related to the notes.
Ensure the output is an object containing an array of question objects and an optional quizTitle string.
`,
});

const internalGenerateQuizFlow = ai.defineFlow(
  {
    name: 'internalGenerateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    if (input.noteContent.length < 50) {
        return { questions: [{question: "Note too short", correctAnswer: "-", type: 'open-ended', explanation: "Please provide more content to generate a quiz."}], quizTitle: "Content Too Short" };
    }
    const { output } = await prompt(input);
    if (!output || !output.questions) {
      throw new Error("AI failed to generate quiz questions.");
    }
    return output;
  }
);

