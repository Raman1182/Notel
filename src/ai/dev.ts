
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-content.ts';
import '@/ai/flows/smart-search-flow.ts';
import '@/ai/flows/process-text-flow.ts'; 
import '@/ai/flows/study-buddy-flow.ts';
import '@/ai/flows/generate-flashcards-flow.ts';
import '@/ai/flows/generate-quiz-flow.ts';
import '@/ai/flows/find-note-connections-flow.ts';
import '@/ai/flows/process-url-flow.ts';
import '@/ai/flows/suggest-next-topic-flow.ts'; // Added new suggestion flow

