import fs from 'fs';
import Groq from 'groq-sdk';
import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env.js';

export interface PedagogicalAnalysisResult {
  status: 'CORRETO' | 'POSSIVELMENTE_CORRETO' | 'INCORRETO' | 'SEM_RESPOSTA';
  similarity: number;
  observedError: string;
  phonemeFindings: string[];
  pedagogicalNote: string;
}

export interface AudioTranscriptionResult {
  text: string;
  duration?: number;
  raw?: unknown;
}

export const WHISPER_LETTER_ALIASES: Record<string, string[]> = {
  A: ['A', 'AH', 'HA', 'Á', 'À'],
  B: ['B', 'BE', 'BÊ', 'BI', 'BEE'],
  C: ['C', 'CE', 'CÊ', 'CI', 'SEE', 'SE'],
  D: ['D', 'DE', 'DÊ', 'DI', 'DEE'],
  E: ['E', 'EH', 'É', 'Ê'],
  F: ['F', 'EFE', 'ÊFE', 'EF', 'EFI'],
  G: ['G', 'GE', 'GÊ', 'GI', 'JEE', 'GUÊ'],
  H: ['H', 'AGA', 'AGÁ', 'HAGA', 'HAGÁ', 'HA GA'],
  I: ['I', 'IH', 'AI', 'Í'],
  J: ['J', 'JOTA', 'JÓ', 'JI'],
  K: ['K', 'CA', 'CÁ', 'KA'],
  L: ['L', 'ELE', 'ÊLE', 'EL', 'ELI', 'ELLY'],
  M: ['M', 'EME', 'ÊME', 'EM', 'AMY', 'EMY', 'EMMY', 'AIMÊ', 'EMI', 'HUM', 'ME', 'MI'],
  N: ['N', 'ENE', 'ÊNE', 'EN', 'ANY', 'ANNIE', 'ENI', 'ANNY', 'NE', 'NI'],
  O: ['O', 'OH', 'Ó', 'Ô'],
  P: ['P', 'PE', 'PÊ', 'PI', 'PEE'],
  Q: ['Q', 'QUE', 'QUÊ', 'KI', 'CUE'],
  R: ['R', 'ERRE', 'ÊRRE', 'AIR', 'ERRI', 'RE', 'RI'],
  S: ['S', 'ESSE', 'ÊSSE', 'ES', 'ESSI', 'SE', 'SI'],
  T: ['T', 'TE', 'TÊ', 'TI', 'TEE'],
  U: ['U', 'UH', 'OO', 'Ú'],
  V: ['V', 'VE', 'VÊ', 'VI', 'VEE'],
  W: ['W', 'DABLIO', 'DÁBLIO', 'DOUBLE V', 'DUPLO V', 'DOUBLE U', 'DA BLIO'],
  X: ['X', 'XIS', 'CHIS', 'EX', 'EKS', 'XIZ', 'CHIZ'],
  Y: ['Y', 'IPSILON', 'ÍPSILON', 'IPSLON', 'WHY', 'I PSILON'],
  Z: ['Z', 'ZE', 'ZÊ', 'ZI', 'ZEE']
};

export class SpeechAiService {
  private groq: Groq;
  private ai: GoogleGenAI;

  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY });
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  /**
   * Transcreve arquivo de áudio utilizando Groq Whisper Large v3 Turbo
   */
  public async transcribeAudio(
    filePath: string,
    targetText?: string,
    itemType?: string
  ): Promise<AudioTranscriptionResult> {
    const fileStream = fs.createReadStream(filePath);

    console.log(`[Groq Whisper] Iniciando transcrição de áudio: tipo=${itemType || 'word'}, alvo="${targetText || ''}"`);
    const prompt = itemType === 'text' && targetText
      ? `História e leitura contextual em português brasileiro: ${targetText.slice(0, 100)}`
      : targetText
        ? `Leitura de alfabetização em português brasileiro: ${targetText}`
        : 'Transcrição fonética e leitura infantil em português do Brasil.';

    const transcription = await this.groq.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      language: 'pt',
      temperature: 0.0,
      prompt
    });

    const text = typeof transcription === 'string' ? transcription : transcription.text || '';
    const duration = typeof transcription === 'object' && transcription && 'duration' in transcription
      ? (transcription as any).duration
      : undefined;

    console.log(`[Groq Whisper] Transcrição concluída: "${text.trim()}" (duração: ${duration ?? '?'}s)`);

    return {
      text: text.trim(),
      duration,
      raw: transcription
    };
  }

  /**
   * Avalia a leitura fonética e pedagógica comparando o texto alvo com a transcrição
   */
  public async analyzePedagogicalReading(
    targetText: string,
    transcriptText: string,
    itemType: string
  ): Promise<PedagogicalAnalysisResult> {
    // 1. Caso de transcrição vazia ou ausente -> Resposta imediata (0ms)
    if (!transcriptText || !transcriptText.trim()) {
      return {
        status: 'SEM_RESPOSTA',
        similarity: 0,
        observedError: 'Nenhuma emissão de voz detectada na janela de áudio.',
        phonemeFindings: [],
        pedagogicalNote: 'A criança permaneceu em silêncio ou emitiu som inaudível. Incentive-a suavemente a tentar a próxima leitura.'
      };
    }

    const cleanTarget = targetText.toUpperCase().trim();
    const cleanTargetNorm = cleanTarget
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '');

    const cleanTranscript = transcriptText
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const cleanTranscriptNorm = cleanTranscript.replace(/[^A-Z0-9\s]/g, '').trim();
    const transcriptWords = cleanTranscriptNorm.split(/\s+/).filter(Boolean);

    // 2. Fast-Path Ultrarrápido (<1ms) para acertos diretos
    // Evita o overhead de 2-4 segundos da chamada HTTP ao Gemini quando a transcrição já é conclusiva

    // Caso Letra:
    if (itemType === 'letter') {
      const allowedAliases = WHISPER_LETTER_ALIASES[cleanTarget] || [cleanTarget];
      const wordsWithoutFillers = transcriptWords.filter(
        (w) => !['E', 'EH', 'O', 'A', 'LETRA', 'UM', 'UMA', 'DE', 'DA', 'DO', 'OQUE', 'QUE'].includes(w)
      );

      const isDirectLetterMatch =
        cleanTranscript === cleanTarget ||
        cleanTranscriptNorm === cleanTargetNorm ||
        allowedAliases.includes(cleanTranscript) ||
        allowedAliases.includes(cleanTranscriptNorm) ||
        wordsWithoutFillers.some((w) => allowedAliases.includes(w) || w === cleanTarget || w === cleanTargetNorm);

      if (isDirectLetterMatch) {
        console.log(`[Fast-Path] Acerto direto para letra "${cleanTarget}" (transcrição: "${transcriptText}")`);
        return {
          status: 'CORRETO',
          similarity: 1.0,
          observedError: '',
          phonemeFindings: [],
          pedagogicalNote: `A pronúncia da letra ${targetText} foi precisa e correta.`
        };
      }
    }

    // Caso Palavra:
    if (itemType === 'word') {
      const wordsWithoutFillers = transcriptWords.filter(
        (w) => !['O', 'A', 'E', 'EH', 'É', 'UM', 'UMA', 'EU', 'DISSE', 'FALEI', 'TÁ'].includes(w)
      );

      const isDirectWordMatch =
        cleanTranscript === cleanTarget ||
        cleanTranscriptNorm === cleanTargetNorm ||
        (wordsWithoutFillers.length === 1 && wordsWithoutFillers[0] === cleanTargetNorm) ||
        (wordsWithoutFillers.length > 1 && wordsWithoutFillers[wordsWithoutFillers.length - 1] === cleanTargetNorm);

      if (isDirectWordMatch) {
        console.log(`[Fast-Path] Acerto direto para palavra "${cleanTarget}" (transcrição: "${transcriptText}")`);
        return {
          status: 'CORRETO',
          similarity: 1.0,
          observedError: '',
          phonemeFindings: [],
          pedagogicalNote: `Leitura correta e fluida da palavra "${targetText}".`
        };
      }
    }

    // Caso Pseudopalavra:
    if (itemType === 'pseudoword') {
      const wordsWithoutFillers = transcriptWords.filter(
        (w) => !['O', 'A', 'E', 'EH', 'É', 'UM', 'UMA'].includes(w)
      );

      const isDirectPseudoMatch =
        cleanTranscript === cleanTarget ||
        cleanTranscriptNorm === cleanTargetNorm ||
        (wordsWithoutFillers.length === 1 && wordsWithoutFillers[0] === cleanTargetNorm);

      if (isDirectPseudoMatch) {
        console.log(`[Fast-Path] Decodificação correta da pseudopalavra "${cleanTarget}" (transcrição: "${transcriptText}")`);
        return {
          status: 'CORRETO',
          similarity: 1.0,
          observedError: '',
          phonemeFindings: [],
          pedagogicalNote: `Decodificação fonológica precisa da pseudopalavra "${targetText}".`
        };
      }
    }

    // 3. Análise Pedagógica com Google Gemini 3.8 Flash (para erros, divergências fonológicas ou textos)
    const systemPrompt = `Você é um especialista em avaliação pedagógica de leitura e alfabetização infantil em língua portuguesa (Brasil), seguindo as diretrizes do MEC e do SAEB Alfabetização.
Sua função é avaliar com acolhimento a tentativa de leitura de uma criança dos anos iniciais do Ensino Fundamental.

Tipo de item: ${itemType}
Texto esperado (alvo): "${targetText}"
Texto pronunciado/transcrito: "${transcriptText}"

Regras Específicas por Tipo de Item:
- Se tipo de item for "letter" (letra isolada):
  A criança pode legitimamente produzir o nome da letra (ex: "bê", "cê", "eme"), o fonema (/b/, /m/) ou a própria letra.
  Whisper pode transcrever "Amy" para M, "Any" para N, "Eli" para L, "Air" para R. Considere CORRETO nesses casos.
- Se tipo de item for "word":
  Leitura da palavra alvo (ex: "BOLA", "DADO"), aceitando ritmo infantil e sotaques regionais.
- Se tipo de item for "pseudoword" (pseudopalavra):
  Avalie estritamente a decodificação grafema-fonema pela rota fonológica.
  NUNCA aceite uma palavra real substituta (ex: para "BALO" falar "BOLA" é INCORRETO).
- Se tipo de item for "text":
  Leitura de história corrida. Avalie o percentual de palavras decodificadas com precisão (> 75% = CORRETO/POSSIVELMENTE_CORRETO).
- Se tipo de item for "phrase":
  Leitura de frase simples.

Retorne JSON estruturado com:
1. "status": 'CORRETO' | 'POSSIVELMENTE_CORRETO' | 'INCORRETO' | 'SEM_RESPOSTA'
2. "similarity": Número decimal de 0.0 a 1.0
3. "observedError": Descrição pedagógica objetiva e direta do erro (string vazia "" se correto)
4. "phonemeFindings": Lista de observações fonéticas (array vazio [] se correto)
5. "pedagogicalNote": Feedback acolhedor e humanizado. NUNCA use termos médicos/patologizantes.`;

    console.log(`[Google Gemini] Enviando para análise pedagógica detalhada: tipo=${itemType}, alvo="${targetText}", transcrição="${transcriptText}"`);
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
    let rawResponseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 250,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: {
                  type: Type.STRING,
                  enum: ['CORRETO', 'POSSIVELMENTE_CORRETO', 'INCORRETO', 'SEM_RESPOSTA']
                },
                similarity: {
                  type: Type.NUMBER
                },
                observedError: {
                  type: Type.STRING
                },
                phonemeFindings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING
                  }
                },
                pedagogicalNote: {
                  type: Type.STRING
                }
              },
              required: ['status', 'similarity', 'observedError', 'phonemeFindings', 'pedagogicalNote']
            }
          }
        });

        rawResponseText = response.text || '';
        if (rawResponseText) {
          console.log(`[Google Gemini] Análise pedagógica concluída com sucesso via modelo [${modelName}]`);
          break;
        }
      } catch (geminiError: any) {
        console.warn(`[Google Gemini] Erro transitório no modelo ${modelName}:`, geminiError?.message || geminiError);
      }
    }

    try {
      if (rawResponseText) {
        const parsed = JSON.parse(rawResponseText.trim()) as PedagogicalAnalysisResult;
        return {
          status: parsed.status,
          similarity: typeof parsed.similarity === 'number' ? parsed.similarity : 0,
          observedError: parsed.observedError || '',
          phonemeFindings: Array.isArray(parsed.phonemeFindings) ? parsed.phonemeFindings : [],
          pedagogicalNote: parsed.pedagogicalNote || 'Leitura registrada no processo de aprendizagem.'
        };
      }
    } catch (parseError) {
      console.warn('[Google Gemini] Falha no parse da resposta estruturada:', rawResponseText, parseError);
    }

    const fallbackCleanTranscript = transcriptText.trim().toLowerCase();
    const fallbackCleanTarget = targetText.trim().toLowerCase();

    let isMatch = fallbackCleanTranscript.includes(fallbackCleanTarget);
    if (!isMatch && itemType === 'letter') {
      const aliases = WHISPER_LETTER_ALIASES[cleanTarget] || [];
      isMatch = aliases.some((alias) => cleanTranscript.includes(alias.toLowerCase()));
    }

    return {
      status: isMatch ? 'CORRETO' : 'INCORRETO',
      similarity: isMatch ? 1.0 : 0.0,
      observedError: isMatch ? '' : 'Divergência entre o texto alvo e a emissão vocal.',
      phonemeFindings: [],
      pedagogicalNote: isMatch ? 'Leitura precisa identificada.' : 'Tentativa de leitura registrada com sucesso.'
    };
  }

  /**
   * Gera parecer pedagógico executivo e recomendações estruturadas para toda a sessão avaliativa
   */
  public async generateSessionSynthesis(input: {
    childName?: string;
    accuracyPercentage: number;
    totalItems: number;
    correctCount: number;
    itemsSummary: string;
  }): Promise<{
    executiveSummary: string;
    recommendations: string[];
    strengths: string[];
  }> {
    const prompt = `Você é um consultor pedagógico de alfabetização infantil baseado nas diretrizes do MEC (Brasil).
Analise os resultados da avaliação de leitura da criança e gere uma síntese pedagógica acolhedora, humanizada e prática para os professores.
NUNCA use jargões médicos, diagnósticos clínicos ou patologizantes (como 'dislexia', 'dislalia', 'distúrbio', 'deficiência').

Dados da Avaliação:
- Estudante: ${input.childName || 'Estudante'}
- Precisão Geral: ${input.accuracyPercentage}%
- Itens Corretos: ${input.correctCount} de ${input.totalItems}
- Desempenho nos Itens:
${input.itemsSummary}

Retorne um JSON com:
- "executiveSummary": Um parágrafo acolhedor e direto destacando o estágio de desenvolvimento da criança na apropriação do sistema alfabético.
- "strengths": 2 a 3 pontos fortes demonstrados pela criança (ex: reconhecimento de sílabas canônicas, fluência em vogais).
- "recommendations": 3 a 4 intervenções pedagógicas lúdicas recomendadas para os próximos passos na sala de aula.`;

    console.log(`[Google Gemini] Gerando síntese pedagógica da sessão para ${input.childName || 'Estudante'}...`);
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['executiveSummary', 'strengths', 'recommendations']
            }
          }
        });

        const text = response.text || '';
        if (text) {
          console.log(`[Google Gemini] Síntese pedagógica gerada com sucesso via [${modelName}]`);
          return JSON.parse(text.trim());
        }
      } catch (err: any) {
        console.warn(`[Google Gemini] Erro transitório no modelo ${modelName} para síntese:`, err?.message || err);
      }
    }

    return {
      executiveSummary: `O estudante demonstrou engajamento na atividade com ${input.accuracyPercentage}% de precisão geral nos itens avaliados.`,
      strengths: ['Participação e atenção aos estímulos de leitura', 'Reconhecimento inicial de grafemas e sílabas'],
      recommendations: [
        'Leitura compartilhada diária com mediação pedagógica acolhedora',
        'Jogos de rima e aliteração para fortalecimento da consciência fonológica'
      ]
    };
  }
}

export const speechAiService = new SpeechAiService();

