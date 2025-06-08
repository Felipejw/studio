
// src/ai/flows/explain-trading-setup.ts
'use server';
/**
 * @fileOverview Flow para explicar um setup de trading fornecido pelo usuário.
 *
 * - explainTradingSetup - Função que gera uma explicação detalhada sobre um setup de trading.
 * - ExplainTradingSetupInput - Tipo de entrada para a flow.
 * - ExplainTradingSetupOutput - Tipo de saída da flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainTradingSetupInputSchema = z.object({
  name: z.string().describe("Nome do setup de trading."),
  rules: z.string().describe("As regras detalhadas do setup (o que deve acontecer para validar a entrada)."),
  trigger: z.string().describe("O gatilho de entrada específico (o ponto exato ou condição para entrar na operação)."),
  idealAssets: z.string().describe("Lista de ativos ou tipos de mercado onde este setup tende a funcionar melhor (ex: Ações de alta volatilidade, Mini Índice, Pares de Forex com tendência)."),
  visualExampleDescription: z.string().describe("Uma descrição textual de como seria um exemplo visual do setup em um gráfico (ex: 'Candle martelo tocando a média de 20 períodos em um fundo, com IFR sobrevendido')."),
});

export type ExplainTradingSetupInput = z.infer<typeof ExplainTradingSetupInputSchema>;

const ExplainTradingSetupOutputSchema = z.object({
  explanation: z.string().describe("Uma explicação detalhada do setup, incluindo como ele funciona, seus prós e contras, considerações de gerenciamento de risco, e para qual perfil de trader (ou tipo de mercado) ele seria mais adequado."),
  suitabilityAnalysis: z.string().describe("Análise da adequação do setup para diferentes perfis de traders e condições de mercado."),
  keyTakeaways: z.array(z.string()).describe("Lista dos pontos chave ou dicas mais importantes sobre este setup."),
});

export type ExplainTradingSetupOutput = z.infer<typeof ExplainTradingSetupOutputSchema>;

export async function explainTradingSetup(input: ExplainTradingSetupInput): Promise<ExplainTradingSetupOutput> {
  return explainTradingSetupFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainTradingSetupPrompt',
  input: {schema: ExplainTradingSetupInputSchema},
  output: {schema: ExplainTradingSetupOutputSchema},
  prompt: `Você é um analista de mercado e coach de trading experiente, especializado em destrinchar e explicar setups de trading. Responda sempre em Português do Brasil.

  Analise o seguinte setup de trading fornecido por um usuário:

  - Nome do Setup: {{{name}}}
  - Regras Detalhadas: {{{rules}}}
  - Gatilho de Entrada Específico: {{{trigger}}}
  - Ativos/Mercados Ideais: {{{idealAssets}}}
  - Descrição de um Exemplo Visual: {{{visualExampleDescription}}}

  Com base nessas informações, forneça:

  1.  **Explicação Detalhada (explanation):** Descreva como o setup funciona, a lógica por trás dele, seus potenciais pontos fortes (prós) e fracos (contras). Inclua considerações importantes sobre gerenciamento de risco específicas para este setup (onde posicionar stop loss, alvos de lucro, etc.).

  2.  **Análise de Adequação (suitabilityAnalysis):** Analise para quais perfis de trader (ex: scalper, day trader, swing trader, conservador, arrojado) e em quais condições de mercado (ex: tendência, lateralização, alta volatilidade) este setup é mais (ou menos) adequado.

  3.  **Pontos Chave (keyTakeaways):** Liste de 3 a 5 pontos chave ou dicas mais importantes que um trader deve ter em mente ao considerar ou utilizar este setup.

  Seja claro, didático e forneça insights práticos e acionáveis. Evite jargões excessivos sem explicação. O objetivo é ajudar o trader a entender profundamente o setup.
  Se a descrição for muito vaga, tente extrair o máximo de informação possível e, se necessário, mencione a necessidade de maior clareza em certos pontos na sua explicação.
  `,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const explainTradingSetupFlow = ai.defineFlow(
  {
    name: 'explainTradingSetupFlow',
    inputSchema: ExplainTradingSetupInputSchema,
    outputSchema: ExplainTradingSetupOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("A IA não conseguiu gerar uma explicação para o setup.");
    }
    return output;
  }
);

