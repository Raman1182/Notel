
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-content.ts';
import '@/ai/flows/smart-search-flow.ts';
import '@/ai/flows/process-text-flow.ts'; 
import '@/ai/flows/study-buddy-flow.ts';
import '@/ai/flows/generate-flashcards-flow.ts'; // Added new flashcard flow
import '@/ai/flows/generate-quiz-flow.ts'; // Added new quiz flow
