
'use server';
/**
 * @fileOverview An AI flow to generate a mind map from a topic.
 *
 * - generateMindmapFlow - A function that generates a mind map.
 * - GenerateMindmapInput - The input type for the function.
 * - GenerateMindmapOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMindmapInputSchema = z.object({
  topic: z.string().min(2).describe('The central topic for the mind map.'),
  details: z.string().optional().describe('Optional specific details or sub-points the user wants to include or focus on.'),
});
export type GenerateMindmapInput = z.infer<typeof GenerateMindmapInputSchema>;

const GenerateMindmapOutputSchema = z.object({
  markdownRepresentation: z.string().describe('A markdown representation of the mind map, using nested lists.'),
});
export type GenerateMindmapOutput = z.infer<typeof GenerateMindmapOutputSchema>;

export async function generateMindmapFlow(input: GenerateMindmapInput): Promise<GenerateMindmapOutput> {
  return internalGenerateMindmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMindmapPrompt',
  input: { schema: GenerateMindmapInputSchema },
  output: { schema: GenerateMindmapOutputSchema },
  prompt: `You are an AI assistant that specializes in creating structured mind maps for students.
Your task is to generate a mind map based on the provided topic.

The central topic is: "{{{topic}}}"

{{#if details}}
The user has provided these specific details to focus on or include:
"""
{{{details}}}
"""
{{/if}}

Generate a hierarchical mind map. The output must be a 'markdownRepresentation' of this mind map.
Use nested bullet points (using hyphens '-') to represent the structure. Start with the main topic at the top level.
Indent sub-topics to show their relationship to the parent topic. Aim for 3-5 main branches from the central topic, each with 2-4 sub-points.

Example Markdown Format:
- Main Topic
  - Main Branch 1
    - Sub-point 1.1
    - Sub-point 1.2
  - Main Branch 2
    - Sub-point 2.1
      - Sub-sub-point 2.1.1
    - Sub-point 2.2
  - Main Branch 3

Create a logical and useful mind map for someone studying this topic.
`,
});

const internalGenerateMindmapFlow = ai.defineFlow(
  {
    name: 'internalGenerateMindmapFlow',
    inputSchema: GenerateMindmapInputSchema,
    outputSchema: GenerateMindmapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a mind map.");
    }
    return output;
  }
);
