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

function calculateLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = calculateLevenshtein(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

function detectSpokenLetter(spokenText: string): string | null {
  const norm = spokenText.toUpperCase().trim();
  for (const [letter, aliases] of Object.entries(WHISPER_LETTER_ALIASES)) {
    if (norm === letter || aliases.includes(norm)) {
      return letter;
    }
  }
  return null;
}

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

    // 2. Análise Pedagógica e Fonética Precisa via Google Gemini
    // Utiliza systemInstruction otimizado e thinkingBudget: 0 para resposta ultra-rápida (~1.2s) com alta precisão técnica
    const systemInstruction = `Você é um avaliador pedagógico e fonético de alfabetização infantil (MEC/SAEB Brasil).
Avalie a leitura e pronúncia da criança com rigor técnico e concisão cirúrgica.
Critérios essenciais:
- "letter": Aceite a pronúncia do nome da letra (ex: "bê", "cê", "eme"), o fonema correspondente ou a própria letra. O Whisper costuma transcrever artefatos acústicos como "Amy" para M, "Any" para N, "Eli" para L, "Air" para R (considere CORRETO). Identifique trocas fônicas/auditivas (ex: som /d/ em vez de /b/).
- "word": Avalie a decodificação da palavra, respeitando sotaques regionais. Aponte substituições consonantais ou vocálicas.
- "pseudoword": Rota fonológica estrita. Troca de fonema ou substituição por palavra real deve ser classificada como INCORRETO.
- "text": Leitura de história corrida. Avalie acurácia e decodificação funcional (>75% de palavras = CORRETO/POSSIVELMENTE_CORRETO).
- "phrase": Leitura de frase com respeito à estrutura sintática.
Regra de ouro de velocidade e precisão:
- Se CORRETO: observedError = "", phonemeFindings = [], pedagogicalNote = "Leitura correta e precisa."
- Se INCORRETO: observedError = resumo objetivo do erro (máx 15 palavras), phonemeFindings = lista concisa de trocas fonêmicas (ex: ["/tr/ -> /pr/"]), pedagogicalNote = orientação pedagógica curta (máx 1 frase).
Retorne SEMPRE o JSON estruturado requerido.`;

    const userContent = `Tipo de item: ${itemType}
Texto esperado (alvo): "${targetText}"
Texto pronunciado (transcrito): "${transcriptText}"`;

    console.log(`[Google Gemini] Avaliando fala com IA: tipo=${itemType}, alvo="${targetText}", transcrição="${transcriptText}"`);
    const primaryModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const candidateModels = [
      primaryModel,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash'
    ];
    const modelsToTry = candidateModels.filter((val, idx, arr) => arr.indexOf(val) === idx);
    let rawResponseText = '';

    for (const modelName of modelsToTry) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout de rede no modelo ${modelName}`)), 6000)
        );

        const isLite = modelName.includes('-lite');
        const config: any = {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.0,
          maxOutputTokens: 140,
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
        };

        if (!isLite) {
          config.thinkingConfig = { thinkingBudget: 0 };
        }

        const apiCallPromise = this.ai.models.generateContent({
          model: modelName,
          contents: userContent,
          config
        });

        const response: any = await Promise.race([apiCallPromise, timeoutPromise]);
        rawResponseText = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
        if (rawResponseText) {
          console.log(`[Google Gemini] Revisão fonética concluída com sucesso via modelo [${modelName}]`);
          break;
        }
      } catch (geminiError: any) {
        console.warn(`[Google Gemini] Aviso de latência/falha no modelo ${modelName}:`, geminiError?.message || geminiError);
      }
    }

    try {
      if (rawResponseText) {
        const cleaned = rawResponseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned) as PedagogicalAnalysisResult;
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

    // Fallback Fonético de Segurança (caso a rede/API do Google fique offline)
    const fallbackCleanTranscript = transcriptText.trim().toLowerCase();
    const fallbackCleanTarget = targetText.trim().toLowerCase();

    let isMatch = fallbackCleanTranscript.includes(fallbackCleanTarget);
    if (!isMatch && itemType === 'letter') {
      const aliases = WHISPER_LETTER_ALIASES[cleanTarget] || [];
      isMatch = aliases.some((alias) => cleanTranscript.includes(alias.toLowerCase()));
    }

    const dist = calculateLevenshtein(cleanTargetNorm, cleanTranscriptNorm);
    const sim = calculateSimilarity(cleanTargetNorm, cleanTranscriptNorm);

    return {
      status: isMatch ? 'CORRETO' : (sim >= 0.85 ? 'POSSIVELMENTE_CORRETO' : 'INCORRETO'),
      similarity: isMatch ? 1.0 : Number(sim.toFixed(2)),
      observedError: isMatch
        ? ''
        : `Divergência entre o texto alvo "${targetText}" e a emissão oral ("${transcriptText}").`,
      phonemeFindings: isMatch ? [] : [`Aferição fonética: similaridade de ${Math.round(sim * 100)}%`],
      pedagogicalNote: isMatch
        ? 'Leitura precisa identificada.'
        : `Tentativa de leitura registrada com sucesso. Estimule a criança na decodificação de "${targetText}".`
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
    const primaryModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const candidateModels = [
      primaryModel,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash'
    ];
    const modelsToTry = candidateModels.filter((val, idx, arr) => arr.indexOf(val) === idx);

    for (const modelName of modelsToTry) {
      try {
        const isLite = modelName.includes('-lite');
        const config: any = {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 350,
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
        };

        if (!isLite) {
          config.thinkingConfig = { thinkingBudget: 0 };
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout no modelo ${modelName}`)), 4000)
        );

        const response: any = await Promise.race([
          this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config
          }),
          timeoutPromise
        ]);

        const text = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
        if (text) {
          const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          console.log(`[Google Gemini] Síntese pedagógica gerada com sucesso via [${modelName}]`);
          return JSON.parse(cleaned);
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

