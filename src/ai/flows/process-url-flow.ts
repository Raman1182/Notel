
'use server';
/**
 * @fileOverview An AI flow to process a given URL (article or YouTube video),
 * summarize its content, and generate structured notes.
 *
 * - processUrlFlow - Function to process the URL.
 * - ProcessUrlInput - Input type for the flow.
 * - ProcessUrlOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the article or YouTube video to process.'),
  contentType: z.enum(['article', 'youtube_video']).describe("The type of content at the URL, to guide processing."),
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
  prompt: `You are an AI assistant integrated into the LearnLog app. Your task is to process the content from the provided URL, summarize it, and generate structured notes.

URL: {{{url}}}
Content Type: {{{contentType}}}

Instructions:
1.  Attempt to access and understand the content from the given URL.
2.  Based on the 'Content Type':
    *   If 'article': Identify the main topic, key arguments, evidence, and conclusions.
    *   If 'youtube_video': Identify the main topic, key concepts explained, and any significant takeaways. If you cannot access a transcript, focus on information available from the video's metadata or general knowledge about the topic if identifiable.
3.  Generate a concise 'summary' of the content.
4.  Generate 'structuredNotes'. These notes should be well-organized, using Markdown for formatting (e.g., headings like ##, ###, and bullet points like - or *). Focus on extracting the most important information that would be useful for study purposes.
5.  If you are unable to access or process the URL for any reason (e.g., paywall, private video, network error), set the 'summary' to a message explaining the issue (e.g., "Could not access content at the provided URL."), make 'structuredNotes' an empty string or a similar message, and set the 'error' field with a brief technical reason if possible.

Output Format:
Ensure your output strictly adheres to the JSON schema with 'summary' and 'structuredNotes' fields.
If an error occurs, also populate the 'error' field.
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
          summary: "The AI failed to generate a response for the URL.",
          structuredNotes: "No notes could be generated.",
          error: "AI processing failed to return structured output."
        };
      }
      // Ensure error field is explicitly undefined if no error string is in output,
      // or if output.error is an empty string (which Zod would allow if optional).
      return {
        summary: output.summary,
        structuredNotes: output.structuredNotes,
        error: output.error || undefined, // Ensure error is undefined if not present or empty
      };
    } catch (e: any) {
      console.error("Error in internalProcessUrlFlow:", e);
      return {
        summary: "An unexpected error occurred while processing the URL.",
        structuredNotes: `Error: ${e.message || 'Unknown error'}`,
        error: e.message || 'Unknown error during flow execution.',
      };
    }
  }
);

