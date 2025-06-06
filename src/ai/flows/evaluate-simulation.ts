// src/ai/flows/evaluate-simulation.ts
'use server';

/**
 * @fileOverview A flow to evaluate a user's performance in a trading simulation.
 *
 * - evaluateSimulation - A function that evaluates the simulation and provides feedback.
 * - EvaluateSimulationInput - The input type for the evaluateSimulation function.
 * - EvaluateSimulationOutput - The return type for the evaluateSimulation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateSimulationInputSchema = z.object({
  disciplineScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score representing the user\'s discipline during the simulation (0-100).'),
  techniqueScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score representing the user\'s trading technique during the simulation (0-100).'),
  emotionalControlScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score representing the user\'s emotional control during the simulation (0-100).'),
  tradesMade: z.number().describe('The number of trades the user made during the simulation.'),
  simulationLength: z
    .string()
    .describe('The length of the simulation in minutes.'),
  profitLoss: z.number().describe('The total profit or loss from the simulation.'),
});

export type EvaluateSimulationInput = z.infer<typeof EvaluateSimulationInputSchema>;

const EvaluateSimulationOutputSchema = z.object({
  feedback: z.string().describe('Personalized feedback on the user\'s performance, including areas for improvement.'),
});

export type EvaluateSimulationOutput = z.infer<typeof EvaluateSimulationOutputSchema>;

export async function evaluateSimulation(input: EvaluateSimulationInput): Promise<EvaluateSimulationOutput> {
  return evaluateSimulationFlow(input);
}

const evaluateSimulationPrompt = ai.definePrompt({
  name: 'evaluateSimulationPrompt',
  input: {schema: EvaluateSimulationInputSchema},
  output: {schema: EvaluateSimulationOutputSchema},
  prompt: `You are a trading coach providing feedback to a trader after a simulation.

  Based on the trader's performance in the simulation, provide personalized feedback focusing on discipline, technique, and emotional control.
  Highlight areas where the trader excelled and suggest specific actions for improvement.

  Discipline Score: {{disciplineScore}}
  Technique Score: {{techniqueScore}}
  Emotional Control Score: {{emotionalControlScore}}
  Trades Made: {{tradesMade}}
  Simulation Length (minutes): {{simulationLength}}
  Profit/Loss: {{profitLoss}}

  Provide encouraging and constructive feedback to help the trader improve their skills.
  `,
});

const evaluateSimulationFlow = ai.defineFlow(
  {
    name: 'evaluateSimulationFlow',
    inputSchema: EvaluateSimulationInputSchema,
    outputSchema: EvaluateSimulationOutputSchema,
  },
  async input => {
    const {output} = await evaluateSimulationPrompt(input);
    return output!;
  }
);
