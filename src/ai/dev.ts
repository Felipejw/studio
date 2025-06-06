import { config } from 'dotenv';
config();

import '@/ai/flows/generate-daily-plan.ts';
import '@/ai/flows/get-ai-psychologist-response.ts';
import '@/ai/flows/evaluate-simulation.ts';