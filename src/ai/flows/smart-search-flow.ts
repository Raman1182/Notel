
'use server';
/**
 * @fileOverview An AI-powered search flow for the command palette.
 * It provides suggested actions, and direct AI responses based on user queries and context.
 *
 * - smartSearchFlow - Handles the search logic.
 * - SmartSearchInput - Input type for the flow.
 * - SmartSearchOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { CommandAction } from '@/config/command-palette-actions';

// Define CommandAction schema subset for suggestions
const CommandActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  section: z.string(),
  keywords: z.array(z.string()).optional(),
  href: z.string().optional(),
}).describe('A suggested command or navigation action.');


const SmartSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query or command.'),
  currentPage: z.string().optional().describe('The current page or context the user is in, e.g., "/dashboard" or "/study/math".'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  suggestedActions: z.array(CommandActionSchema).optional().describe('A list of relevant actions or navigation links based on the query and context.'),
  aiResponse: z.string().optional().describe('A direct natural language response from the AI if the query is a question or needs explanation.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;


export async function smartSearchFlow(input: SmartSearchInput): Promise<SmartSearchOutput> {
  if (input.query.length < 3 && !input.query.toLowerCase().includes("help")) {
    if (input.currentPage === '/study') {
      return {
        suggestedActions: [
          { id: 'cmd-pause-timer', name: 'Pause Study Timer', section: 'Study Controls' },
          { id: 'cmd-open-notes', name: 'Open Notes for this session', section: 'Study Controls', href: '/notes' },
        ]
      };
    }
    return { suggestedActions: [], aiResponse: null };
  }
  
  if (input.query.toLowerCase() === "start session") {
    return {
      suggestedActions: [{ id: 'study-session', name: 'Start/View Study Session', section: 'Navigation', href: '/study' }]
    };
  }

  return internalSmartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: { schema: SmartSearchInputSchema },
  output: { schema: SmartSearchOutputSchema },
  prompt: `You are an intelligent command center assistant for the LearnLog app.
Your goal is to understand the user's intent from their query and provide:
1.  Relevant "suggestedActions" (like app commands, navigation links).
2.  A direct "aiResponse" if the query is a question or needs explanation.

User's current page/context: {{{currentPage}}}
User's query: {{{query}}}

Analyze the query.
- If it seems like a command or navigation: provide up to 3 relevant suggestedActions. Do NOT provide an aiResponse.
  - Example actions: { id: 'study-session', name: 'Start Study Session', section: 'Navigation', href: '/study' }, { id: 'new-note', name: 'Create New Note', section: 'Actions' }
- If it's a question, a request for explanation, or a hybrid intent (e.g., "help me study biology"): provide an aiResponse. Do NOT provide suggestedActions.
- If the query is unclear or very short, you can provide a generic aiResponse like "How can I help you with LearnLog today?" or a common suggested action.

Prioritize concise and actionable responses. If providing actions, ensure they are valid within the LearnLog app structure.
If the query is "hello" or "help", provide a welcoming aiResponse with examples of what the user can do.
`,
});

const internalSmartSearchFlow = ai.defineFlow(
  {
    name: 'internalSmartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async (input) => {
    if (input.query.toLowerCase() === 'help' || input.query.toLowerCase() === 'hi' || input.query.toLowerCase() === 'hello') {
      return {
        aiResponse: "Hi there! You can ask me to 'start a study session', 'create a new note', or ask questions like 'explain photosynthesis'. What would you like to do?",
        suggestedActions: [
            {id: 'home', name: 'Go to Dashboard', section: 'Navigation', href: '/'},
            {id: 'study-session', name: 'Start Study Session', section: 'Navigation', href: '/study'},
            {id: 'create-new-note-action', name: 'Create New Note', section: 'Actions', keywords: ['note']},
        ]
      };
    }

    const { output } = await prompt(input);
    if (!output) {
        return { suggestedActions: [], aiResponse: "Sorry, I couldn't process that request. Try rephrasing?" };
    }
    
    const uniqueSuggestedActions = output.suggestedActions?.map((action, index) => ({
      ...action,
      id: action.id || `ai-action-${index}-${Date.now()}`, 
    }));

    return { ...output, suggestedActions: uniqueSuggestedActions };
  }
);

