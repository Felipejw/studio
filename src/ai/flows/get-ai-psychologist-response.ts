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
  prompt: `Você é um psicólogo IA especializado em fornecer apoio e orientação a traders. Responda sempre em Português do Brasil. Com base nos sentimentos e no estado emocional do trader, ofereça frases de apoio, reforço racional e recomendações comportamentais.

Sentimentos: {{{feelings}}}
Estado Emocional (0-10): {{{emotionalState}}}

Forneça conselhos personalizados para ajudar o trader a gerenciar suas emoções e melhorar suas decisões de negociação.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
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
