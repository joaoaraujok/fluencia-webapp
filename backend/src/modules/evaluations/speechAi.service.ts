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

    // Prompt conciso apenas para contexto do idioma português brasileiro, sem citar letras ou alvos específicos
    // para não interferir na decodificação do Whisper de áudios curtos.
    const prompt = itemType === 'text' && targetText
      ? `História e leitura contextual em português brasileiro: ${targetText.slice(0, 100)}`
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
    // Caso de transcrição vazia ou ausente
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
    const cleanTranscript = transcriptText
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Validação fonética direta para letras (evita falhas de homófonos em inglês do Whisper como "Amy" para M)
    if (itemType === 'letter') {
      const allowedAliases = WHISPER_LETTER_ALIASES[cleanTarget] || [cleanTarget];
      const words = cleanTranscript
        .split(' ')
        .map((w) => w.trim())
        .filter((w) => w && !['E', 'EH', 'O', 'A', 'LETRA', 'UM', 'UMA', 'DE', 'DA', 'DO'].includes(w));

      const isDirectMatch =
        allowedAliases.includes(cleanTranscript) ||
        words.some((word) => allowedAliases.includes(word)) ||
        (cleanTranscript.length === 1 && cleanTranscript === cleanTarget);

      if (isDirectMatch) {
        return {
          status: 'CORRETO',
          similarity: 1.0,
          observedError: '',
          phonemeFindings: [],
          pedagogicalNote: `A pronúncia da letra ${targetText} foi precisa e correta.`
        };
      }
    }

    const systemPrompt = `Você é um especialista em avaliação pedagógica de leitura e alfabetização infantil em língua portuguesa (Brasil), seguindo as diretrizes do MEC e do SAEB Alfabetização.
Sua função é avaliar com acolhimento a tentativa de leitura de uma criança dos anos iniciais do Ensino Fundamental.

Tipo de item: ${itemType}
Texto esperado (alvo): "${targetText}"
Texto pronunciado/transcrito: "${transcriptText}"

Regras Específicas por Tipo de Item:
- Se tipo de item for "letter" (letra isolada):
  A criança pode legitimamente produzir:
  a) O NOME da letra em português (exemplo: "bê" ou "be" para B, "cê" ou "ce" para C, "dê" ou "de" para D, "éfe" ou "efe" para F, "gê" ou "ge" para G, "agá" ou "aga" para H, "jota" para J, "cá" para K, "éle" ou "ele" para L, "ême" ou "eme" para M, "êne" ou "ene" para N, "pê" ou "pe" para P, "quê" ou "que" para Q, "érre" ou "erre" para R, "éssi" ou "esse" para S, "tê" ou "te" para T, "vê" ou "ve" para V, "dáblio" para W, "xis" para X, "ípsilon" para Y, "zê" ou "ze" para Z).
  b) O SOM / FONEMA da letra (exemplo: som /b/, /d/, /f/, /m/, /s/, /v/, /a/, etc.).
  c) A letra grafada isolada (ex: "B", "A", "M", etc.).
  d) Fala intermediária como "letra B", "é o B", "letra bê", "o som é bê".
  e) ATENÇÃO A ARTEFATOS DO WHISPER: O Whisper frequentemente transcreve o som em português de letras como palavras/nomes em inglês com fonética idêntica:
     - "Amy" ou "Emy" para a letra M (som "eme" /ˈɛmi/);
     - "Any" ou "Annie" para a letra N (som "ene" /ˈɛni/);
     - "Eli" ou "Elly" para a letra L (som "ele" /ˈɛli/);
     - "Air" para a letra R (som "erre");
     - "Agá" ou "Aga" para a letra H;
     - "Dáblio" para a letra W.
  TODAS essas opções para a respectiva letra alvo são 100% VÁLIDAS E CORRETAS ('CORRETO', similarity: 1.0). NUNCA classifique como incorreto por esses artefatos fonéticos.
- Se tipo de item for "word":
  Leitura da palavra alvo (ex: "BOLA", "DADO"), aceitando ritmo infantil e sotaques regionais normais.
- Se tipo de item for "text" (história / narrativa em contexto):
  Leitura de texto corrido. Avalie o percentual de palavras decodificadas com precisão e o encadeamento das orações. Se a criança decodificou a maior parte da história (> 75%) de modo compreensível, classifique como 'CORRETO' ou 'POSSIVELMENTE_CORRETO'. Aceite pausas entre sentenças.
- Se tipo de item for "phrase" (frase):
  Leitura de frase simples. Aceite ritmo pausado e autocorreções normais.

Diretrizes de Retorno:
1. "status":
   - 'CORRETO': Leitura precisa, nome correto da letra, som correto da letra, artefato fonético do Whisper da letra, ou palavra correspondente.
   - 'POSSIVELMENTE_CORRETO': Silabação pausada bem sucedida, troca sutil de vogal átona final ou autocorreção espontânea.
   - 'INCORRETO': Letra ou palavra substantivamente diferente (ex: letra 'D' quando o alvo era 'B', ou outra palavra sem relação).
   - 'SEM_RESPOSTA': Apenas se não houver leitura inteligível do item proposto.
2. "similarity": Número decimal de 0.0 a 1.0 (atribua 1.0 para acertos plenos).
3. "observedError": Descrição pedagógica objetiva e direta do erro ou variação (string vazia "" se correto).
4. "phonemeFindings": Lista de observações fonéticas específicas encontradas (array vazio [] se correto).
5. "pedagogicalNote": Feedback construtivo, acolhedor e humanizado para o professor/mediador. NUNCA utilize termos médicos, diagnósticos clínicos ou patologizantes (como 'dislexia', 'dislalia', 'distúrbio', 'deficiência'). Foque no processo formativo de alfabetização.`;

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let rawResponseText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
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
        if (rawResponseText) break;
      } catch (geminiError: any) {
        console.warn(`[Gemini] Erro transitório no modelo ${modelName}:`, geminiError?.message || geminiError);
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
      console.warn('Falha no parse da resposta estruturada do Gemini:', rawResponseText, parseError);
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
          return JSON.parse(text.trim());
        }
      } catch (err: any) {
        console.warn(`[Gemini] Erro transitório no modelo ${modelName} para síntese:`, err?.message || err);
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

