
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
  // currentNotesContext: z.string().optional().describe('A brief snippet of currently viewed notes, if applicable and short enough.') // Future enhancement
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  suggestedActions: z.array(CommandActionSchema).optional().describe('A list of relevant actions or navigation links based on the query and context.'),
  aiResponse: z.string().optional().describe('A direct natural language response from the AI if the query is a question or needs explanation. Can also guide users on how to find specific notes or use app features related to their query.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;


export async function smartSearchFlow(input: SmartSearchInput): Promise<SmartSearchOutput> {
  if (input.query.length < 2 && !input.query.toLowerCase().includes("help")) { // Reduced min length
    if (input.currentPage === '/study') {
      return {
        suggestedActions: [
          { id: 'cmd-pause-timer', name: 'Pause Study Timer', section: 'Study Controls' },
          { id: 'cmd-open-notes', name: 'Open Notes for this session', section: 'Study Controls', href: '/notes' }, // This href might need to be dynamic
        ]
      };
    }
    return { suggestedActions: [], aiResponse: null };
  }
  
  if (input.query.toLowerCase() === "start session") {
    return {
      suggestedActions: [{ id: 'study-session-launch', name: 'New Study Session', section: 'Navigation', href: '/study/launch' }]
    };
  }
  if (input.query.toLowerCase().includes("calendar")) {
    return {
      suggestedActions: [{ id: 'study-calendar', name: 'Open Study Calendar', section: 'Navigation', href: '/calendar'}]
    }
  }

  return internalSmartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: { schema: SmartSearchInputSchema },
  output: { schema: SmartSearchOutputSchema },
  prompt: `You are an intelligent command center assistant for the Notel app.
Your goal is to understand the user's intent from their query and provide:
1.  Relevant "suggestedActions" (like app commands, navigation links). These should be specific actions the user can take within Notel.
2.  A direct "aiResponse" if the query is a question, needs explanation, or is about finding information within their study materials.

User's current page/context: {{{currentPage}}}
User's query: {{{query}}}

Analyze the query.
- If it seems like a command or navigation request (e.g., "open dashboard", "start new physics session", "show calendar"):
  Provide up to 3 relevant suggestedActions. Do NOT provide an aiResponse.
  Example actions: 
    { id: 'study-session-launch', name: 'New Study Session', section: 'Navigation', href: '/study/launch' }, 
    { id: 'my-notes', name: 'View My Notes', section: 'Navigation', href: '/notes' },
    { id: 'create-new-note-action', name: 'Create New Note', section: 'Actions' }

- If it's a question (e.g., "explain photosynthesis", "what are my deadlines for calculus?", "how do I use the pomodoro timer?"):
  Provide an aiResponse. You can also provide a suggestedAction if it directly answers the question (e.g., for "show deadlines", suggest navigating to dashboard or calendar).
  If the query is about finding specific notes (e.g., "find my notes on World War 2"):
    - Provide an aiResponse guiding the user: "You can find your notes by navigating to 'View My Notes', then selecting the relevant subject and session. You can also use the search within the notes section once you're there."
    - You can also suggest navigating to '/notes' as an action.
    Do NOT attempt to search note content directly yourself or provide summaries of notes here.

- If the query is unclear or very short (but not a command): provide a generic aiResponse like "How can I help you with Notel today?" or suggest common actions.
- If the query is "hello" or "help": provide a welcoming aiResponse with examples of what the user can do.

Prioritize concise and actionable responses. Ensure any suggestedActions are valid commands within the Notel app.
If suggesting navigation, use the provided href format.
Do not invent actions that don't exist in the app (e.g., "search notes for 'keyword'"). Guide the user to existing search/navigation features.
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
        aiResponse: "Hi there! You can ask me to 'start a study session', 'view my notes', 'show calendar', or ask questions like 'what is photosynthesis?'. What would you like to do?",
        suggestedActions: [
            {id: 'home', name: 'Go to Dashboard', section: 'Navigation', href: '/'},
            {id: 'study-session-launch', name: 'New Study Session', section: 'Navigation', href: '/study/launch'},
            {id: 'my-notes', name: 'View My Notes', section: 'Navigation', href: '/notes'},
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

