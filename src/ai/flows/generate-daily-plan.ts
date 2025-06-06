// use server'
'use server';

/**
 * @fileOverview Generates a personalized daily trading plan using AI.
 *
 * - generateDailyPlan - A function that generates the daily plan.
 * - GenerateDailyPlanInput - The input type for the generateDailyPlan function.
 * - GenerateDailyPlanOutput - The return type for the generateDailyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyPlanInputSchema = z.object({
  gainGoal: z.number().describe('The target profit for the day.'),
  lossLimit: z.number().describe('The maximum acceptable loss for the day.'),
  setups: z.array(z.string()).describe('The trading setups to be used.'),
  energyLevel: z
    .number()
    .min(0)
    .max(10)
    .describe('The user energy and focus level (0-10).'),
  emotion: z.enum(['tranquilo', 'ansioso', 'confiante', 'cansado']).describe('The user emotion before trading.'),
  tradingPeriod: z.enum(['manhã', 'tarde', 'o dia todo']).describe('The intended trading period.'),
});
export type GenerateDailyPlanInput = z.infer<typeof GenerateDailyPlanInputSchema>;

const GenerateDailyPlanOutputSchema = z.object({
  rules: z.string().describe('Trading rules for the day.'),
  suggestedTimes: z.string().describe('Suggested trading times.'),
  focusTriggers: z.string().describe('Mental focus triggers.'),
  noTradeAlert: z.string().describe('Alert to not trade if necessary.'),
});
export type GenerateDailyPlanOutput = z.infer<typeof GenerateDailyPlanOutputSchema>;

export async function generateDailyPlan(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput> {
  return generateDailyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyPlanPrompt',
  input: {schema: GenerateDailyPlanInputSchema},
  output: {schema: GenerateDailyPlanOutputSchema},
  prompt: `You are an AI trading assistant that helps traders create a daily trading plan.

  Consider the trader's goals, risk tolerance, energy level, and emotional state to generate a personalized plan.

  Specifically, take into account these parameters:
  - Gain Goal: {{{gainGoal}}}
  - Loss Limit: {{{lossLimit}}}
  - Setups: {{#each setups}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Energy Level: {{{energyLevel}}}
  - Emotion: {{{emotion}}}
  - Trading Period: {{{tradingPeriod}}}

  Based on these parameters, generate the following:
  - Trading Rules for the day
  - Suggested Trading Times
  - Mental Focus Triggers
  - Alert to not trade if necessary
  `,
});

const generateDailyPlanFlow = ai.defineFlow(
  {
    name: 'generateDailyPlanFlow',
    inputSchema: GenerateDailyPlanInputSchema,
    outputSchema: GenerateDailyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
