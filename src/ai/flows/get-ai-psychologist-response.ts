// 'use server';

'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing supportive and rational advice from an AI psychologist.
 *
 * - getAiPsychologistResponse - A function that generates advice based on user's feelings and emotional state.
 * - GetAiPsychologistResponseInput - The input type for the getAiPsychologistResponse function.
 * - GetAiPsychologistResponseOutput - The return type for the getAiPsychologistResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAiPsychologistResponseInputSchema = z.object({
  feelings: z.string().describe('A description of how the user is feeling today.'),
  emotionalState: z.number().min(0).max(10).describe('The current emotional state of the user on a scale of 0 to 10.'),
});

export type GetAiPsychologistResponseInput = z.infer<typeof GetAiPsychologistResponseInputSchema>;

const GetAiPsychologistResponseOutputSchema = z.object({
  advice: z.string().describe('Supportive phrases, rational reinforcement, and behavioral recommendations from the AI psychologist.'),
});

export type GetAiPsychologistResponseOutput = z.infer<typeof GetAiPsychologistResponseOutputSchema>;

export async function getAiPsychologistResponse(input: GetAiPsychologistResponseInput): Promise<GetAiPsychologistResponseOutput> {
  return getAiPsychologistResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPsychologistPrompt',
  input: {schema: GetAiPsychologistResponseInputSchema},
  output: {schema: GetAiPsychologistResponseOutputSchema},
  prompt: `You are an AI psychologist specializing in providing support and guidance to traders. Based on the trader's feelings and emotional state, offer supportive phrases, rational reinforcement, and behavioral recommendations.

Feelings: {{{feelings}}}
Emotional State (0-10): {{{emotionalState}}}

Provide advice that is tailored to help the trader manage their emotions and improve their trading decisions.`,
});

const getAiPsychologistResponseFlow = ai.defineFlow(
  {
    name: 'getAiPsychologistResponseFlow',
    inputSchema: GetAiPsychologistResponseInputSchema,
    outputSchema: GetAiPsychologistResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
