
'use server';
/**
 * @fileOverview An AI flow to process a given URL (article),
 * summarize its content, and generate structured notes.
 *
 * - processUrlFlow - Function to process the URL.
 * - ProcessUrlInput - Input type for the flow.
 * - ProcessUrlOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the article to process.'),
});
export type ProcessUrlInput = z.infer<typeof ProcessUrlInputSchema>;

const ProcessUrlOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the content from the URL.'),
  structuredNotes: z.string().describe('Key information from the URL, structured as notes (e.g., Markdown with headings and bullet points).'),
  error: z.string().optional().describe('Any error message if the URL could not be processed.'),
});
export type ProcessUrlOutput = z.infer<typeof ProcessUrlOutputSchema>;

export async function processUrlFlow(input: ProcessUrlInput): Promise<ProcessUrlOutput> {
  return internalProcessUrlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processUrlPrompt',
  input: { schema: ProcessUrlInputSchema },
  output: { schema: ProcessUrlOutputSchema },
  prompt: `You are an AI assistant integrated into the Notel app. Your task is to process the content from a provided URL, summarize it, and generate structured notes.

**Important:** This feature is designed to work with text-based online articles and blog posts. It may not work correctly with video platforms (like YouTube), social media, complex web applications, or pages behind a paywall.

URL: {{{url}}}

Instructions:
1.  Access the content from the given URL.
2.  Analyze the text to identify the main topic, key arguments, and conclusions.
3.  Generate a concise 'summary' of the content.
4.  Generate 'structuredNotes'. These notes should be well-organized in Markdown format (use headings like ##, ###, and bullet points like - or *). Focus on extracting the most important information for studying.
5.  If you cannot access or process the URL (e.g., it's a video, paywalled, or results in an error), clearly state this in the 'summary'. For example: "Could not process this URL. It may be a video, a paywalled article, or an unsupported content type." In such cases, make 'structuredNotes' an empty string and set the 'error' field with a brief explanation.

Output Format:
Your output must strictly follow the JSON schema with 'summary' and 'structuredNotes' fields. If an error occurs, populate the 'error' field as well.
`,
});

const internalProcessUrlFlow = ai.defineFlow(
  {
    name: 'internalProcessUrlFlow',
    inputSchema: ProcessUrlInputSchema,
    outputSchema: ProcessUrlOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        return {
          summary: "The AI failed to generate a response for the URL. The URL might be inaccessible or the content type is not supported.",
          structuredNotes: "No notes could be generated.",
          error: "AI processing failed to return structured output."
        };
      }
      return {
        summary: output.summary,
        structuredNotes: output.structuredNotes,
        error: output.error || undefined, 
      };
    } catch (e: any) {
      console.error("Error in internalProcessUrlFlow:", e);
      return {
        summary: "An unexpected error occurred while processing the URL. It may be offline or block automated access.",
        structuredNotes: `Error: ${e.message || 'Unknown error'}`,
        error: e.message || 'Unknown error during flow execution.',
      };
    }
  }
);
