
// src/ai/flows/get-trader-profile-suggestions.ts
'use server';
/**
 * @fileOverview Flow para analisar respostas de um questionário de perfil de trader,
 * classificar o perfil e fornecer sugestões personalizadas de trading.
 *
 * - getTraderProfileSuggestions - Função que processa as respostas e retorna perfil e sugestões.
 * - GetTraderProfileSuggestionsInput - Tipo de entrada para a flow.
 * - GetTraderProfileSuggestionsOutput - Tipo de saída da flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetTraderProfileSuggestionsInputSchema = z.object({
  preferredFrequency: z.enum(['muito_frequente', 'frequente', 'as_vezes', 'raramente'], {description: "Com que frequência prefere operar? (Muito Frequente: Várias vezes ao dia / Frequente: Algumas vezes ao dia / Às Vezes: Algumas vezes por semana / Raramente)"}),
  timeHorizon: z.enum(['minutos', 'horas', 'dias', 'semanas'], {description: "Horizonte de tempo preferido para uma operação? (Minutos, Horas, Dias, Semanas)"}),
  riskPerTradePercent: z.number().min(0.5).max(5).describe("Percentual do capital confortável em arriscar por operação? (0.5 a 5%)"),
  reactionToLossStreak: z.enum(['calmo_plano', 'ansioso_continua', 'para_um_tempo', 'tenta_recuperar_rapido'], {description: "Como reage a uma sequência de perdas? (Calmo e segue o plano, Ansioso mas continua, Para por um tempo, Tenta recuperar rápido)"}),
  impulsivenessScale: z.number().min(0).max(10).describe("Quão impulsivo se considera ao operar, em uma escala de 0 (nada) a 10 (muito)?"),
  decisionBasis: z.enum(['analise_tecnica', 'analise_fundamentalista', 'sentimento_mercado', 'misto'], {description: "Qual a principal base para suas decisões de trading? (Análise Técnica, Análise Fundamentalista, Sentimento do Mercado, Misto)"}),
  experienceLevel: z.enum(['iniciante', 'intermediario', 'avancado'], {description: "Seu nível de experiência no trading? (Iniciante, Intermediário, Avançado)"}),
  preferredMarketTime: z.enum(['abertura', 'meio_pregao', 'fechamento', 'qualquer_horario', 'fora_horario_comercial'], {description: "Qual seu horário preferido para operar? (Abertura, Meio do Pregão, Fechamento, Qualquer Horário, Fora do Horário Comercial/Noturno)"}),
});

export type GetTraderProfileSuggestionsInput = z.infer<typeof GetTraderProfileSuggestionsInputSchema>;

const GetTraderProfileSuggestionsOutputSchema = z.object({
  traderProfileType: z.string().describe("O tipo de perfil de trader identificado (ex: Scalper, Day Trader Direcional, Position Trader, Trader Comportamental, etc.)."),
  profileDescription: z.string().describe("Uma breve descrição das características do perfil identificado."),
  suggestedSetups: z.array(z.string()).describe("Lista de setups de trading ou estratégias mais adequadas para este perfil."),
  suggestedAssetFocus: z.array(z.string()).describe("Tipos de ativos ou mercados que podem ser mais adequados (ex: Ações Voláteis, Índices, Moedas com Tendência)."),
  riskManagementApproach: z.string().describe("Abordagem de gerenciamento de risco recomendada, incluindo considerações sobre stop loss e tamanho de posição."),
  psychologicalProfile: z.string().describe("Análise do perfil psicológico com base nas respostas, destacando pontos fortes e áreas para desenvolvimento."),
  recommendedRoutine: z.string().describe("Sugestões para uma rotina de trading que se alinhe com o perfil."),
  additionalAdvice: z.string().optional().describe("Conselhos adicionais, recursos de aprendizado ou áreas de foco específicas para este perfil."),
});

export type GetTraderProfileSuggestionsOutput = z.infer<typeof GetTraderProfileSuggestionsOutputSchema>;

export async function getTraderProfileSuggestions(input: GetTraderProfileSuggestionsInput): Promise<GetTraderProfileSuggestionsOutput> {
  return getTraderProfileSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTraderProfileSuggestionsPrompt',
  input: {schema: GetTraderProfileSuggestionsInputSchema},
  output: {schema: GetTraderProfileSuggestionsOutputSchema},
  prompt: `Você é um coach de trading experiente e psicólogo comportamental especializado em classificar perfis de traders e fornecer orientação personalizada.
  Responda sempre em Português do Brasil.

  Analise as seguintes respostas de um trader a um questionário de perfil:
  - Frequência de Operação Preferida: {{{preferredFrequency}}}
  - Horizonte de Tempo por Operação: {{{timeHorizon}}}
  - Risco Percentual por Operação: {{{riskPerTradePercent}}}%
  - Reação a Sequência de Perdas: {{{reactionToLossStreak}}}
  - Nível de Impulsividade (0-10): {{{impulsivenessScale}}}
  - Base para Decisões de Trading: {{{decisionBasis}}}
  - Nível de Experiência: {{{experienceLevel}}}
  - Horário Preferido para Operar: {{{preferredMarketTime}}}

  Com base nessas respostas, realize as seguintes tarefas:

  1.  **Classificação do Perfil (traderProfileType):** Identifique e nomeie o perfil de trader predominante. Exemplos de perfis podem incluir, mas não se limitam a: Scalper, Day Trader de Tendência, Day Trader Contrarre Tendência, Trader de Notícias, Swing Trader, Position Trader, Trader Quantitativo, Trader Discricionário, Trader Conservador, Trader Arrojado, Trader Reativo (focado em Price Action), Trader Metódico (seguidor de sistema), Trader Comportamental (foco no emocional). Escolha o perfil que melhor se encaixa.

  2.  **Descrição do Perfil (profileDescription):** Forneça uma descrição concisa (2-3 frases) das principais características, pontos fortes e possíveis desafios do perfil identificado.

  3.  **Setups Sugeridos (suggestedSetups):** Liste 3-4 setups de trading ou estratégias que são tipicamente bem-sucedidos para este perfil. Seja específico (ex: "Scalping em gráficos de 1 minuto com Bandas de Bollinger e RSI", "Pullbacks em médias móveis em gráficos de 15 minutos", "Rompimentos de consolidação em gráficos diários").

  4.  **Foco em Ativos (suggestedAssetFocus):** Sugira tipos de ativos ou mercados que se alinham bem com o perfil (ex: "Pares de moedas maiores no Forex", "Ações de alta liquidez e volatilidade", "Índices futuros", "Commodities com tendências claras").

  5.  **Abordagem de Gerenciamento de Risco (riskManagementApproach):** Descreva uma abordagem de gerenciamento de risco adequada. Considere a tolerância ao risco implícita nas respostas. Inclua dicas sobre stop loss, alvos de lucro e dimensionamento de posição.

  6.  **Perfil Psicológico (psychologicalProfile):** Com base nas respostas sobre emoções e impulsividade, descreva o perfil psicológico do trader. Destaque os pontos fortes emocionais e as áreas que podem exigir mais atenção e desenvolvimento (ex: "Parece ter bom controle emocional em perdas, mas precisa cuidar da impulsividade em ganhos.").

  7.  **Rotina Recomendada (recommendedRoutine):** Sugira elementos chave para uma rotina de trading diária ou semanal que beneficie este perfil (ex: "Revisão de trades ao final do dia", "Preparação pré-mercado focada em X", "Pausas estratégicas para evitar overtrading").

  8.  **Conselhos Adicionais (additionalAdvice - opcional):** Se houver, ofereça um conselho final, um recurso de aprendizado específico ou uma área de foco crucial para o desenvolvimento deste trader.

  Formate sua resposta estritamente de acordo com o schema de saída fornecido. Seja construtivo e prático.
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

const getTraderProfileSuggestionsFlow = ai.defineFlow(
  {
    name: 'getTraderProfileSuggestionsFlow',
    inputSchema: GetTraderProfileSuggestionsInputSchema,
    outputSchema: GetTraderProfileSuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("A IA não conseguiu gerar sugestões para o perfil.");
    }
    return output;
  }
);
