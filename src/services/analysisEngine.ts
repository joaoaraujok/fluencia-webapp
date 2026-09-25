import {
  EvaluationItemResult,
  PracticeRecommendation,
  LettersReportMetrics,
  WordsReportMetrics,
  TextReportMetrics,
  PhrasesReportMetrics,
  ExecutiveSummary
} from '../types/evaluation';
import { QuestionItem, PedagogicalDiagnosis } from '../types/question';
import { RecognitionStatus } from '../types/speech';

/**
 * Normaliza um texto para comparação fonética e linguística:
 * - Converte para maiúsculas;
 * - Remove acentos diacríticos (á -> A, ç -> C, ã -> A);
 * - Remove pontuação e caracteres não alfanuméricos;
 * - Normaliza espaços repetidos.
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .toUpperCase()
    // Decomposição Unicode NFD para separar caracteres de acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Substitui pontuações por espaço
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»“”]/g, ' ')
    // Remove espaços extras
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula a distância de edição de Levenshtein entre duas strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substituição
          matrix[i][j - 1] + 1,     // Inserção
          matrix[i - 1][j] + 1      // Deleção
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Compara o áudio transcrito com o item esperado, diferenciando:
 * - Correspondência exata / fonética (CORRETO);
 * - Variações pequenas do reconhecimento de voz ou leve hesitação (POSSIVELMENTE_CORRETO);
 * - Palavra incorreta (INCORRETO);
 * - Ausência de fala capturada (SEM_RESPOSTA);
 * - Ininteligível / erro (NAO_RECONHECIDO).
 */
export function compareSpeech(
  expectedItem: QuestionItem,
  rawTranscript: string,
  confidence: number = 1.0,
  isTechnicalError: boolean = false,
  options?: { phoneticSupportEnabled?: boolean; speechTolerance?: 'standard' | 'lenient' }
): {
  status: RecognitionStatus;
  normalizedExpected: string;
  normalizedTranscript: string;
  distance: number;
  observedError?: string;
  phonemeFindings?: string[];
} {
  if (isTechnicalError) {
    return {
      status: 'ERRO_TECNICO',
      normalizedExpected: normalizeText(expectedItem.text),
      normalizedTranscript: '',
      distance: 999,
      observedError: 'Falha técnica no microfone ou no reconhecimento'
    };
  }

  const normExpected = normalizeText(expectedItem.text);
  const normTranscript = normalizeText(rawTranscript);

  // Sem resposta ou silêncio absoluto
  if (!normTranscript || normTranscript.length === 0) {
    return {
      status: 'SEM_RESPOSTA',
      normalizedExpected: normExpected,
      normalizedTranscript: '',
      distance: normExpected.length,
      observedError: 'Nenhuma resposta sonora identificada no tempo definido'
    };
  }

  // Se for letra individual (Etapa 1)
  if (expectedItem.type === 'letter') {
    return compareLetter(normExpected, normTranscript, confidence, options);
  }

  // Se for texto corrido (Etapa 3)
  if (expectedItem.type === 'text') {
    return compareText(normExpected, normTranscript, confidence);
  }

  // Se for frase (Nível 4 - Etapa 4)
  if (expectedItem.type === 'phrase') {
    return comparePhrase(normExpected, normTranscript, confidence);
  }

  // Se for palavra única (Etapa 2 - Níveis 1, 2 e 3)
  return compareWord(expectedItem, normExpected, normTranscript, confidence);
}

const LETTER_VARIANTS: Record<string, string[]> = {
  A: ['A', 'AH', 'HA', 'LETRA A', 'AVIAO', 'ABELHA', 'AMOR', 'AZUL', 'AGUA', 'AMORA', 'ANEL', 'HÁ', 'AÍ'],
  B: ['B', 'BE', 'BA', 'BI', 'BO', 'BU', 'BOLA', 'BOLO', 'BEM', 'BEBE', 'BALA', 'BARCO', 'LETRA B', 'LETRA BE', 'VER', 'VE', 'BOM', 'BULE', 'BICO'],
  C: ['C', 'CE', 'SE', 'CA', 'CO', 'CU', 'CI', 'CASA', 'COCO', 'VOCE', 'SER', 'SEI', 'CARRO', 'LETRA C', 'LETRA CE', 'CEM', 'SEM', 'COPO', 'COLA'],
  D: ['D', 'DE', 'DA', 'DI', 'DO', 'DU', 'DADO', 'DIA', 'DOCE', 'DEDO', 'LETRA D', 'LETRA DE', 'DEZ', 'DONA', 'DER'],
  E: ['E', 'EH', 'ELE', 'ESCOLA', 'ESTRELA', 'ELEFANTE', 'ESCADA', 'LETRA E', 'EMA', 'ELA'],
  F: ['F', 'EFE', 'FE', 'FA', 'FI', 'FO', 'FU', 'EF', 'FADA', 'FOGO', 'FOI', 'FOLHA', 'FACA', 'LETRA F', 'LETRA EFE', 'FITA', 'FOCA', 'EFI'],
  G: ['G', 'GE', 'GUE', 'GA', 'GI', 'GO', 'GU', 'GATO', 'GOTA', 'GIRAFA', 'GOIABA', 'LETRA G', 'LETRA GE', 'GALO', 'GEMA'],
  H: ['H', 'AGA', 'HAGA', 'HORA', 'HELICOPTERO', 'HOJE', 'HOMEM', 'LETRA H', 'LETRA AGA', 'HARPA', 'HORTA', 'A GA', 'AH GA', 'AGÁ', 'HAGÁ'],
  I: ['I', 'IH', 'AI', 'IGREJA', 'ILHA', 'INDIO', 'IGLU', 'LETRA I', 'IOIO', 'IRA'],
  J: ['J', 'JOTA', 'JA', 'JE', 'JI', 'JO', 'JU', 'JACARE', 'JANELA', 'JOGO', 'JIPE', 'LETRA J', 'LETRA JOTA', 'JUBA'],
  K: ['K', 'CA', 'KA', 'KI', 'KIWI', 'KART', 'LETRA K'],
  L: ['L', 'ELE', 'LE', 'LA', 'LI', 'LO', 'LU', 'EL', 'LUA', 'LATA', 'LEAO', 'LIVRO', 'LETRA L', 'LETRA ELE', 'LOBO', 'LUVA', 'ELI'],
  M: ['M', 'EME', 'ME', 'MA', 'MI', 'MO', 'MU', 'EM', 'HUM', 'MACACO', 'MAE', 'MALA', 'MESA', 'MOTO', 'LETRA M', 'LETRA EME', 'MOLA', 'MURO', 'EMI'],
  N: ['N', 'ENE', 'NE', 'NA', 'NI', 'NO', 'NU', 'EN', 'NAVIO', 'NUVEM', 'NINHO', 'NOITE', 'LETRA N', 'LETRA ENE', 'NOVE', 'NADA', 'ENI'],
  O: ['O', 'OH', 'OU', 'OVO', 'OLHO', 'ONCA', 'ORELHA', 'LETRA O', 'ONIBUS', 'OURO', 'OCA'],
  P: ['P', 'PE', 'PA', 'PI', 'PO', 'PU', 'PATO', 'PIPOCA', 'PANELA', 'PEIXE', 'PIPA', 'LETRA P', 'LETRA PE', 'PORTA', 'PUMA'],
  Q: ['Q', 'QUE', 'QUA', 'QUI', 'QUEIJO', 'QUATI', 'QUADRO', 'LETRA Q', 'LETRA QUE', 'QUEDA'],
  R: ['R', 'ERRE', 'RE', 'RA', 'RI', 'RO', 'RU', 'AR', 'RATO', 'RUA', 'RELOGIO', 'RIO', 'ROBO', 'LETRA R', 'LETRA ERRE', 'RODA', 'REDE', 'ERRI'],
  S: ['S', 'ESSE', 'SE', 'SA', 'SI', 'SO', 'SU', 'ES', 'SAPO', 'SOL', 'SOPA', 'SINO', 'SUCO', 'LETRA S', 'LETRA ESSE', 'SACO', 'SALA', 'ESSI', 'ECE', 'CE'],
  T: ['T', 'TE', 'TA', 'TI', 'TO', 'TU', 'TATU', 'TREM', 'TOMATE', 'TIGRE', 'TARTARUGA', 'LETRA T', 'LETRA TE', 'TETO', 'TEIA', 'TER'],
  U: ['U', 'UH', 'UM', 'UVA', 'URSO', 'URUBU', 'UNHA', 'LETRA U'],
  V: ['V', 'VE', 'VA', 'VI', 'VO', 'VU', 'VACA', 'VELA', 'VENTO', 'VIDRO', 'VULCAO', 'LETRA V', 'LETRA VE', 'VOVO', 'VER'],
  W: ['W', 'DABLIO', 'WAFFLE', 'WIFI', 'LETRA W', 'LETRA DABLIO', 'DUPLO V', 'DUPLO VE', 'DA BLIO'],
  X: ['X', 'XIS', 'CHIS', 'XA', 'XE', 'XI', 'XO', 'XU', 'EX', 'XICARA', 'XALE', 'XAROPE', 'LETRA X', 'LETRA XIS', 'XADREZ', 'XIZ', 'CHIZ'],
  Y: ['Y', 'IPSILON', 'YAKULT', 'YOGA', 'LETRA Y', 'LETRA IPSILON', 'YOUTUBE', 'I PSILON'],
  Z: ['Z', 'ZE', 'ZA', 'ZI', 'ZO', 'ZU', 'ZEBRA', 'ZERO', 'ZOO', 'ZIPER', 'LETRA Z', 'LETRA ZE', 'ZANGADO', 'ZI', 'ZÉ']
};

const COMMON_LETTER_CONFUSIONS: Record<string, string[]> = {
  B: ['D', 'P', 'V'],
  D: ['B', 'T', 'P'],
  P: ['B', 'Q', 'D'],
  M: ['N'],
  N: ['M'],
  F: ['V'],
  V: ['F', 'B'],
  T: ['D'],
  S: ['C', 'Z'],
  C: ['S', 'K']
};

function compareLetter(
  normExpected: string,
  normTranscript: string,
  confidence: number,
  options?: { phoneticSupportEnabled?: boolean; speechTolerance?: 'standard' | 'lenient' }
): {
  status: RecognitionStatus;
  normalizedExpected: string;
  normalizedTranscript: string;
  distance: number;
  observedError?: string;
  phonemeFindings?: string[];
} {
  const targetChar = normExpected.charAt(0);
  const acceptedVariants = LETTER_VARIANTS[targetChar] || [targetChar];
  const allWords = normTranscript.split(/\s+/).filter(Boolean);

  // Palavras funcionais / stopwords que nunca devem ser tratadas como identificação de letra rival
  const stopwords = ['LETRA', 'AQUI', 'ESTA', 'ESTE', 'EH', 'DE', 'DA', 'DO', 'O', 'A', 'UM', 'UMA', 'EU', 'ACHO', 'QUE', 'TI', 'MEU', 'MINHA'];
  const coreWords = allWords.filter(w => !stopwords.includes(w));

  // 1. Caso Direto: transcrição coincide exatamente com qualquer variante aceita ou contém o caractere isolado
  const isDirectMatch =
    normTranscript === targetChar ||
    allWords.includes(targetChar) ||
    coreWords.includes(targetChar) ||
    acceptedVariants.some(v => normTranscript === v || allWords.includes(v) || coreWords.includes(v));

  if (isDirectMatch) {
    return {
      status: 'CORRETO',
      normalizedExpected: targetChar,
      normalizedTranscript: normTranscript,
      distance: 0
    };
  }

  // 2. Caso Expresso: "LETRA [X]" ou "[X] DE BOLA" ou início/fim com targetChar
  if (
    normTranscript.includes(`LETRA ${targetChar}`) ||
    normTranscript.startsWith(`${targetChar} `) ||
    normTranscript.endsWith(` ${targetChar}`) ||
    allWords.some(w => w === targetChar || (w.length >= 3 && acceptedVariants.includes(w)))
  ) {
    return {
      status: 'CORRETO',
      normalizedExpected: targetChar,
      normalizedTranscript: normTranscript,
      distance: 0
    };
  }

  // 3. Caso Fonético do Método Fônico: palavra que começa com a letra esperada (comprimento 3 a 8 letras)
  const isPhoneticAllowed = options?.phoneticSupportEnabled !== false;
  const minConfidence = options?.speechTolerance === 'lenient' ? 0.50 : 0.60;
  if (isPhoneticAllowed) {
    const startsWithTarget = coreWords.some(w => w.startsWith(targetChar) && w.length >= 3 && w.length <= 8);
    if (startsWithTarget && confidence >= minConfidence) {
      return {
        status: 'CORRETO',
        normalizedExpected: targetChar,
        normalizedTranscript: normTranscript,
        distance: 0
      };
    }
  }

  // 4. Detecção de Confusão Real: apenas se a criança claramente identificou OUTRA letra específica
  let detectedOtherLetter: string | null = null;
  for (const [letter, variants] of Object.entries(LETTER_VARIANTS)) {
    if (letter !== targetChar) {
      // Checa se o núcleo da fala é o nome de outra letra (e não é uma das stopwords)
      const primaryNames = variants.slice(0, 3);
      const matchesOther = coreWords.some(w => primaryNames.includes(w) && !stopwords.includes(w));
      if (matchesOther) {
        detectedOtherLetter = letter;
        break;
      }
    }
  }

  if (detectedOtherLetter) {
    const isTypicalConfusion = COMMON_LETTER_CONFUSIONS[targetChar]?.includes(detectedOtherLetter);
    return {
      status: 'INCORRETO',
      normalizedExpected: targetChar,
      normalizedTranscript: normTranscript,
      distance: 1,
      observedError: isTypicalConfusion
        ? `Confusão típica com a letra ${detectedOtherLetter}`
        : `Identificação incorreta (reconhecido como ${detectedOtherLetter})`,
      phonemeFindings: [`confused_with_${detectedOtherLetter}`]
    };
  }

  // 5. Compensação para falhas acústicas da Web Speech API (transcrições curtas erradas)
  // Se não detectou nenhuma outra letra (evitando conflito com identificações reais) e a transcrição é curta
  if (allWords.length <= 2) {
    const isFuzzyMatch = acceptedVariants.some(v => 
      allWords.some(w => levenshteinDistance(v, w) === 1)
    );
    
    if (isFuzzyMatch) {
      return {
        status: 'POSSIVELMENTE_CORRETO',
        normalizedExpected: targetChar,
        normalizedTranscript: normTranscript,
        distance: 1,
        observedError: 'Compensado por distância fonética curta (erro acústico comum da API sem contexto)'
      };
    }
  }

  // 6. Baixa confiança do microfone / ruído de fundo: nunca penaliza precipitadamente
  if (confidence < 0.65) {
    return {
      status: 'POSSIVELMENTE_CORRETO',
      normalizedExpected: targetChar,
      normalizedTranscript: normTranscript,
      distance: 1,
      observedError: 'Indeterminada — baixa confiança no áudio da letra'
    };
  }

  return {
    status: 'INCORRETO',
    normalizedExpected: targetChar,
    normalizedTranscript: normTranscript,
    distance: 1,
    observedError: `Não identificada (reconhecido: ${normTranscript})`
  };
}

function compareText(
  normExpected: string,
  normTranscript: string,
  _confidence: number
): {
  status: RecognitionStatus;
  normalizedExpected: string;
  normalizedTranscript: string;
  distance: number;
  observedError?: string;
} {
  const expectedTokens = normExpected.split(/\s+/).filter(Boolean);
  const spokenTokens = normTranscript.split(/\s+/).filter(Boolean);

  let matched = 0;
  for (const token of expectedTokens) {
    if (spokenTokens.includes(token) || spokenTokens.some(s => levenshteinDistance(s, token) <= 1)) {
      matched++;
    }
  }

  const ratio = expectedTokens.length > 0 ? matched / expectedTokens.length : 0;
  const status: RecognitionStatus = ratio >= 0.85 ? 'CORRETO' : ratio >= 0.5 ? 'POSSIVELMENTE_CORRETO' : 'INCORRETO';

  return {
    status,
    normalizedExpected: normExpected,
    normalizedTranscript: normTranscript,
    distance: Math.round((1 - ratio) * expectedTokens.length),
    observedError: ratio < 0.85 ? `Leitura textual com ${Math.round(ratio * 100)}% de precisão de palavras` : undefined
  };
}

/**
 * Simplificação fonética leve para português brasileiro (adequada à fala infantil e variações do ASR)
 */
export function phoneticSimplify(text: string): string {
  return text
    .replace(/CH/g, 'X')
    .replace(/SS/g, 'S')
    .replace(/Ç/g, 'S')
    .replace(/SC(?=[EI])/g, 'S')
    .replace(/XC(?=[EI])/g, 'S')
    .replace(/PH/g, 'F');
}

/**
 * Detecta se a palavra dita é um diminutivo carinhoso infantil comum (ex: BOLA -> BOLINHA, PATO -> PATINHO, VACA -> VAQUINHA)
 */
export function isChildDiminutive(expected: string, spoken: string): boolean {
  if (spoken.length <= expected.length) return false;
  // Radical sem a vogal temática final
  const stem = expected.replace(/[AOE]$/, '');
  // Radical com substituição de C por QU (ex: VACA -> VAQUINHA, BONECA -> BONEQUINHA, PIPOCA -> PIPOQUINHA)
  const stemQu = stem.replace(/C$/, 'QU');

  const suffixes = ['INHO', 'INHA', 'INHOS', 'INHAS', 'ZINHO', 'ZINHA'];
  return suffixes.some((suf) => spoken === stem + suf || spoken === stemQu + suf);
}

function compareWord(
  _item: QuestionItem,
  normExpected: string,
  normTranscript: string,
  _confidence: number
) {
  // Limpeza de palavras duplicadas na transcrição decorrentes do buffer contínuo no celular
  const rawWords = normTranscript.split(/\s+/);
  const wordsInTranscript: string[] = [];
  for (const w of rawWords) {
    if (wordsInTranscript.length === 0 || wordsInTranscript[wordsInTranscript.length - 1] !== w) {
      wordsInTranscript.push(w);
    }
  }
  const cleanTranscript = wordsInTranscript.join(' ');

  // Caso 1: Correspondência literal idêntica
  if (normExpected === cleanTranscript || normExpected === normTranscript) {
    return {
      status: 'CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: 0
    };
  }

  // Caso 2: A criança falou acompanhada de artigo, frase curta ou repetições (ex: "É UMA BOLA" ou "BOLA BOLA")
  if (wordsInTranscript.includes(normExpected) || normTranscript.includes(normExpected)) {
    return {
      status: 'CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: 0
    };
  }

  // Caso 3: Equivalência fonética homófona (ex: CHUVA vs XUVA, ZEBRINHA vs SEBRINHA, PALHAÇO vs PALHASSO)
  const phoneticExpected = phoneticSimplify(normExpected);
  if (
    phoneticSimplify(cleanTranscript) === phoneticExpected ||
    wordsInTranscript.some((w) => phoneticSimplify(w) === phoneticExpected)
  ) {
    return {
      status: 'CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: 0
    };
  }

  // Caso 4: Diminutivo carinhoso infantil (comum na Educação Infantil, ex: "BOLINHA" para BOLA, "PATINHO" para PATO)
  const matchedDiminutive = wordsInTranscript.find((w) => isChildDiminutive(normExpected, w));
  if (matchedDiminutive) {
    return {
      status: 'CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: 0,
      observedError: `Uso de diminutivo carinhoso infantil ("${matchedDiminutive}")`
    };
  }

  // Caso 5: Variação comum de plural no ASR (ex: "BOLA" vs "BOLAS", "SAPO" vs "SAPOS")
  if (
    normExpected + 'S' === cleanTranscript ||
    normExpected === cleanTranscript + 'S' ||
    wordsInTranscript.some((w) => w === normExpected + 'S' || w + 'S' === normExpected)
  ) {
    return {
      status: 'CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: 0
    };
  }

  // Caso 6: Distância de Levenshtein contra palavras individuais ou completa
  let minDistance = levenshteinDistance(normExpected, cleanTranscript);
  let closestWord = cleanTranscript;
  for (const w of wordsInTranscript) {
    const d = levenshteinDistance(normExpected, w);
    if (d < minDistance) {
      minDistance = d;
      closestWord = w;
    }
  }

  const expectedLength = normExpected.length;

  // Tolerâncias fonéticas calibradas para Educação Infantil:
  // Palavras curtas (até 4 letras como LUA, SAPO, VACA):
  if (expectedLength <= 4) {
    if (minDistance === 1) {
      return {
        status: 'POSSIVELMENTE_CORRETO' as RecognitionStatus,
        normalizedExpected: normExpected,
        normalizedTranscript: cleanTranscript,
        distance: minDistance,
        observedError: `Variação leve na emissão (reconhecido: ${closestWord})`
      };
    }
  } else if (expectedLength <= 7) {
    // Palavras médias (5 a 7 letras, trissílabas e dígrafos)
    if (minDistance === 1) {
      return {
        status: 'POSSIVELMENTE_CORRETO' as RecognitionStatus,
        normalizedExpected: normExpected,
        normalizedTranscript: cleanTranscript,
        distance: minDistance,
        observedError: `Leve diferença observada (reconhecido: ${closestWord})`
      };
    }
    // Simplificações frequentes na Educação Infantil (encontro consonantal PR/TR/BL ou troca de R por L)
    if (minDistance === 2) {
      const isConsonantCluster =
        normExpected.includes('PR') ||
        normExpected.includes('BR') ||
        normExpected.includes('TR') ||
        normExpected.includes('CR') ||
        normExpected.includes('FL') ||
        normExpected.includes('BL');
      return {
        status: 'POSSIVELMENTE_CORRETO' as RecognitionStatus,
        normalizedExpected: normExpected,
        normalizedTranscript: cleanTranscript,
        distance: minDistance,
        observedError: isConsonantCluster
          ? `Simplificação de encontro consonantal típica da educação infantil (reconhecido: ${closestWord})`
          : `Pronúncia aproximada (reconhecido: ${closestWord})`
      };
    }
  } else {
    // Palavras longas (8+ letras)
    if (minDistance <= 2) {
      return {
        status: 'POSSIVELMENTE_CORRETO' as RecognitionStatus,
        normalizedExpected: normExpected,
        normalizedTranscript: cleanTranscript,
        distance: minDistance,
        observedError: `Aproximação em palavra longa (reconhecido: ${closestWord})`
      };
    }
  }

  // Se a confiança do ASR for muito baixa e não houver aproximação, trata-se de ruído ou ininteligível do microfone
  if (_confidence > 0 && _confidence < 0.28 && minDistance >= expectedLength * 0.7) {
    return {
      status: 'NAO_RECONHECIDO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: minDistance,
      observedError: 'Captação sonora ininteligível ou com ruído ambiental (não reconhecida pelo sistema)'
    };
  }

  // Fala divergente emitida pela criança
  if (minDistance >= expectedLength * 0.8) {
    return {
      status: 'INCORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: minDistance,
      observedError: `Palavra emitida diferente do esperado (esperado: ${normExpected}, reconhecido: ${cleanTranscript})`
    };
  }

  return {
    status: 'INCORRETO' as RecognitionStatus,
    normalizedExpected: normExpected,
    normalizedTranscript: cleanTranscript,
    distance: minDistance,
    observedError: `Oportunidade de prática na leitura da palavra ${normExpected} (reconhecido: ${cleanTranscript})`
  };
}

function comparePhrase(normExpected: string, normTranscript: string, _confidence: number) {
  const expectedWords = normExpected.split(/\s+/);
  const rawTranscriptWords = normTranscript.split(/\s+/);

  // Deduplicação de palavras consecutivas repetidas do áudio móvel
  const transcriptWords: string[] = [];
  for (const tw of rawTranscriptWords) {
    if (transcriptWords.length === 0 || transcriptWords[transcriptWords.length - 1] !== tw) {
      transcriptWords.push(tw);
    }
  }

  let matchedWordsCount = 0;
  for (const expWord of expectedWords) {
    if (transcriptWords.includes(expWord)) {
      matchedWordsCount++;
    } else {
      // Verifica aproximação por Levenshtein ou simplificação fonética
      const hasCloseMatch = transcriptWords.some(
        (tw) => levenshteinDistance(expWord, tw) <= 1 || phoneticSimplify(expWord) === phoneticSimplify(tw)
      );
      if (hasCloseMatch) {
        matchedWordsCount += 0.85;
      }
    }
  }

  const matchRatio = matchedWordsCount / expectedWords.length;
  const cleanTranscript = transcriptWords.join(' ');

  if (matchRatio >= 0.9 || normExpected === cleanTranscript) {
    return {
      status: 'CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: 0
    };
  }

  if (matchRatio >= 0.5) {
    return {
      status: 'POSSIVELMENTE_CORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: Math.round((1 - matchRatio) * normExpected.length),
      observedError: `Frase parcialmente dita (${Math.round(matchRatio * 100)}% das palavras reconhecidas)`
    };
  }

  return {
    status: 'INCORRETO' as RecognitionStatus,
    normalizedExpected: normExpected,
    normalizedTranscript: cleanTranscript,
    distance: normExpected.length,
    observedError: `Maior desafio na continuidade da frase (${Math.round(matchRatio * 100)}% das palavras reconhecidas)`
  };
}

/**
 * Gera recomendações pedagógicas acolhedoras e positivas para a seção "O que praticar".
 * Regras estritas:
 * - Baseado exclusivamente nos dados reais observados na avaliação;
 * - Não inventar dificuldades que não ocorreram;
 * - Jamais usar termos clínicos, patológicos ou diagnósticos médicos/fonoaudiológicos.
 */
export function generatePracticeRecommendations(
  evaluatedItems: EvaluationItemResult[]
): PracticeRecommendation[] {
  const recommendations: PracticeRecommendation[] = [];

  // Filtra itens com desafio (INCORRETO ou SEM_RESPOSTA ou POSSIVELMENTE_CORRETO)
  const challengingItems = evaluatedItems.filter(
    item => item.status === 'INCORRETO' || item.status === 'SEM_RESPOSTA' || item.status === 'POSSIVELMENTE_CORRETO'
  );

  if (challengingItems.length === 0) {
    recommendations.push({
      id: 'rec_excellence',
      title: 'Excelente desempenho!',
      category: 'Fluência Geral',
      description: 'A criança demonstrou excelente clareza, ritmo e precisão articulatória em todos os itens avaliados.',
      recommendedExamples: ['Continuar com leituras compartilhadas de histórias infantis', 'Desafiar com trava-línguas divertidos'],
      priority: 'baixa'
    });
    return recommendations;
  }

  // 1. Dígrafos CH
  const chItems = challengingItems.filter(i => i.syllableStructure === 'digraph_ch' || i.targetText.includes('CH'));
  if (chItems.length >= 1) {
    recommendations.push({
      id: 'rec_digraph_ch',
      title: 'Praticar o som do CH',
      category: 'Dígrafos',
      description: 'Foram observadas oportunidades de prática em palavras que contêm o dígrafo CH.',
      recommendedExamples: ['CHUVA', 'CHAVE', 'CHINELO', 'CHOCOLATE', 'CHUVEIRO'],
      priority: chItems.length >= 2 ? 'alta' : 'media'
    });
  }

  // 2. Dígrafos LH
  const lhItems = challengingItems.filter(i => i.syllableStructure === 'digraph_lh' || i.targetText.includes('LH'));
  if (lhItems.length >= 1) {
    recommendations.push({
      id: 'rec_digraph_lh',
      title: 'Praticar o som do LH',
      category: 'Dígrafos',
      description: 'Houve menor facilidade em palavras com o dígrafo LH, que exigem elevação do dorso da língua.',
      recommendedExamples: ['MILHO', 'FOLHA', 'COELHO', 'TOALHA', 'GALHO'],
      priority: lhItems.length >= 2 ? 'alta' : 'media'
    });
  }

  // 3. Dígrafos NH
  const nhItems = challengingItems.filter(i => i.syllableStructure === 'digraph_nh' || i.targetText.includes('NH'));
  if (nhItems.length >= 1) {
    recommendations.push({
      id: 'rec_digraph_nh',
      title: 'Praticar o som do NH',
      category: 'Dígrafos',
      description: 'Pode praticar a nasalização suave em palavras com o dígrafo NH.',
      recommendedExamples: ['NINHO', 'LINHA', 'SONHO', 'GOLFINHO', 'PASSARINHO'],
      priority: nhItems.length >= 2 ? 'alta' : 'media'
    });
  }

  // 4. Encontros consonantais com R (PR, TR, BR, CR, FR, DR, GR)
  const clusterRItems = challengingItems.filter(
    i => i.syllableStructure === 'cluster_r' || /([PTBCDFG]R)/.test(i.targetText)
  );
  if (clusterRItems.length >= 1) {
    recommendations.push({
      id: 'rec_cluster_r',
      title: 'Encontros consonantais com R',
      category: 'Encontros Consonantais',
      description: 'Observou-se maior desafio na vibração rápida do R junto a outras consoantes (como PR, TR, BR).',
      recommendedExamples: ['PRATO', 'COBRA', 'TRATOR', 'TIGRE', 'FRUTA'],
      priority: clusterRItems.length >= 2 ? 'alta' : 'media'
    });
  }

  // 5. Encontros consonantais com L (PL, BL, CL, FL, GL)
  const clusterLItems = challengingItems.filter(
    i => i.syllableStructure === 'cluster_l' || /([PBCFG]L)/.test(i.targetText)
  );
  if (clusterLItems.length >= 1) {
    recommendations.push({
      id: 'rec_cluster_l',
      title: 'Encontros consonantais com L',
      category: 'Encontros Consonantais',
      description: 'Pode praticar palavras com L em encontros consonantais, incentivando a pronúncia nítida das duas consoantes.',
      recommendedExamples: ['FLOR', 'PLANTA', 'BLUSA', 'CLUBE', 'GLOBO'],
      priority: clusterLItems.length >= 2 ? 'alta' : 'media'
    });
  }

  // 6. Palavras trissílabas (Nível 2)
  const trisyllabicItems = challengingItems.filter(
    i => i.level === 2 && i.syllableStructure === 'canonical_cv_cv_cv'
  );
  if (trisyllabicItems.length >= 2) {
    recommendations.push({
      id: 'rec_trisyllabic',
      title: 'Palavras trissílabas',
      category: 'Estrutura Silábica',
      description: 'Houve hesitação em palavras de três sílabas. É recomendado exercitar a cadência e contagem de sílabas com palmas.',
      recommendedExamples: ['PIPOCA', 'BONECA', 'PANELA', 'MACACO', 'BATATA'],
      priority: 'media'
    });
  }

  // 7. Frases mais longas (Nível 4)
  const phraseItems = challengingItems.filter(i => i.level === 4);
  if (phraseItems.length >= 1) {
    recommendations.push({
      id: 'rec_phrases',
      title: 'Fluência em frases completas',
      category: 'Prosódia e Extensão',
      description: 'Pode incentivar a leitura expressiva de frases curtas para exercitar o fôlego e o ritmo contínuo.',
      recommendedExamples: ['O SAPO PULA.', 'A BOLA CAIU.', 'O GATO BEBE LEITE.', 'A MENINA COME PIPOCA.'],
      priority: phraseItems.length >= 2 ? 'alta' : 'media'
    });
  }

  // 8. Se houve muitas ausências de resposta (hesitação por timidez ou tempo curto)
  const noResponseCount = challengingItems.filter(i => i.status === 'SEM_RESPOSTA').length;
  if (noResponseCount >= 2) {
    recommendations.push({
      id: 'rec_hesitation',
      title: 'Tempo de prontidão para a fala',
      category: 'Ritmo e Confiança',
      description: 'Foram observados alguns momentos de silêncio. Jogos de resposta rápida e estímulos lúdicos ajudam a ganhar confiança.',
      recommendedExamples: ['Jogos de nomeação rápida de figuras cotidianas', 'Brincadeiras de rimas'],
      priority: 'media'
    });
  }

  return recommendations;
}

/**
 * Análise aprofundada da leitura de texto em contexto (Etapa 3)
 */
export function compareTextReading(
  expectedText: string,
  rawTranscript: string,
  durationSeconds: number
): {
  totalWords: number;
  wordsRead: number;
  wordsCorrect: number;
  errorsCount: number;
  accuracy: number;
  wordsPerMinute: number;
  punctuationRespected: boolean;
  prosodyScore: number;
  automaticityLevel: 'alta' | 'media' | 'baixa';
  isFluentEligible: boolean;
  errorBreakdown: Record<string, number>;
} {
  const normExpected = normalizeText(expectedText);
  const normTranscript = normalizeText(rawTranscript);

  const expectedWords = normExpected.split(/\s+/).filter(Boolean);
  const transcriptWords = normTranscript.split(/\s+/).filter(Boolean);

  const totalWords = expectedWords.length;
  const wordsRead = transcriptWords.length;

  let wordsCorrect = 0;
  let substitutionCount = 0;
  let omissionCount = 0;
  let additionCount = Math.max(0, wordsRead - totalWords);

  // Alinhamento sequencial por correspondência direta e fonética
  let transcriptPointer = 0;
  for (let i = 0; i < expectedWords.length; i++) {
    const exp = expectedWords[i];
    let matched = false;

    // Busca nas próximas 3 palavras ditas para acomodar pequenas hesitações ou omissões
    const searchLimit = Math.min(transcriptPointer + 3, transcriptWords.length);
    for (let j = transcriptPointer; j < searchLimit; j++) {
      const spk = transcriptWords[j];
      const dist = levenshteinDistance(exp, spk);
      const isPhonetic = phoneticSimplify(exp) === phoneticSimplify(spk);

      if (dist === 0 || isPhonetic || (exp.length >= 4 && dist <= 1)) {
        wordsCorrect++;
        transcriptPointer = j + 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (transcriptPointer < transcriptWords.length) {
        substitutionCount++;
        transcriptPointer++;
      } else {
        omissionCount++;
      }
    }
  }

  const errorsCount = substitutionCount + omissionCount;
  const accuracy = totalWords > 0 ? Math.min(100, Math.round((wordsCorrect / Math.max(wordsRead, totalWords)) * 100)) : 0;
  const safeDurationMin = Math.max(durationSeconds, 1) / 60;
  const wordsPerMinute = Math.round(wordsCorrect / safeDurationMin);

  // Análise qualitativa de prosódia e pontuação
  const punctuationRespected = accuracy >= 85 && wordsPerMinute >= 50;
  let prosodyScore = Math.min(100, Math.round(accuracy * 0.6 + Math.min(wordsPerMinute, 80) * 0.4));
  if (prosodyScore < 20 && wordsCorrect > 0) prosodyScore = 40;

  const automaticityLevel: 'alta' | 'media' | 'baixa' =
    wordsPerMinute >= 65 && accuracy >= 90 ? 'alta' : wordsPerMinute >= 30 ? 'media' : 'baixa';

  // Critério estrito para Leitor Fluente (Regras 1, 11 e 26):
  // Pelo menos 65 palavras corretas/minuto + mais de 90% de precisão + prosódia adequada
  const isFluentEligible = wordsPerMinute >= 65 && accuracy > 90 && prosodyScore >= 70;

  return {
    totalWords,
    wordsRead,
    wordsCorrect,
    errorsCount,
    accuracy,
    wordsPerMinute,
    punctuationRespected,
    prosodyScore,
    automaticityLevel,
    isFluentEligible,
    errorBreakdown: {
      substituicoes: substitutionCount,
      omissoes: omissionCount,
      acrescimos: additionCount
    }
  };
}

/**
 * Compila as métricas consolidadas da Etapa 1 (Reconhecimento de Letras)
 */
export function compileLettersMetrics(items: EvaluationItemResult[]): LettersReportMetrics {
  const letterItems = items.filter(i => i.type === 'letter');
  const presented = letterItems.length;
  const correct = letterItems.filter(i => i.status === 'CORRETO' || i.status === 'POSSIVELMENTE_CORRETO').length;
  const noResponseCount = letterItems.filter(i => i.status === 'SEM_RESPOSTA').length;
  const timeExceededCount = letterItems.filter(i => i.isTimeLimitReached).length;
  const accuracy = presented > 0 ? Math.round((correct / presented) * 100) : 0;

  let totalReactionTime = 0;
  let validReactions = 0;
  const confusionsMap = new Map<string, { expected: string; spoken: string; count: number }>();
  const recognizedLetters: string[] = [];
  const challengingLetters: string[] = [];

  for (const item of letterItems) {
    if (item.reactionTimeMs) {
      totalReactionTime += item.reactionTimeMs;
      validReactions++;
    }
    if (item.status === 'CORRETO' || item.status === 'POSSIVELMENTE_CORRETO') {
      recognizedLetters.push(item.targetText);
    } else {
      challengingLetters.push(item.targetText);
      if (item.transcript) {
        const key = `${item.targetText}->${item.transcript}`;
        const existing = confusionsMap.get(key) || { expected: item.targetText, spoken: item.transcript, count: 0 };
        existing.count++;
        confusionsMap.set(key, existing);
      }
    }
  }

  const averageReactionTimeMs = validReactions > 0 ? Math.round(totalReactionTime / validReactions) : 0;

  return {
    presented,
    correct,
    accuracy,
    averageReactionTimeMs,
    noResponseCount,
    timeExceededCount,
    confusions: Array.from(confusionsMap.values()),
    recognizedLetters,
    challengingLetters
  };
}

/**
 * Compila as métricas consolidadas da Etapa 2 (Palavras Isoladas)
 */
export function compileWordsMetrics(items: EvaluationItemResult[]): WordsReportMetrics {
  const wordItems = items.filter(i => i.type === 'word');
  const presented = wordItems.length;
  const correct = wordItems.filter(i => i.status === 'CORRETO' || i.status === 'POSSIVELMENTE_CORRETO').length;
  const incorrect = wordItems.filter(i => i.status === 'INCORRETO').length;
  const noResponse = wordItems.filter(i => i.status === 'SEM_RESPOSTA').length;
  const timeExceededCount = wordItems.filter(i => i.isTimeLimitReached).length;
  const accuracy = presented > 0 ? Math.round((correct / presented) * 100) : 0;

  let totalDurationMs = 0;
  let totalReactionMs = 0;
  let validTimeCount = 0;
  let pausesCount = 0;
  let selfCorrectionsCount = 0;
  let silabationCount = 0;
  const errorBreakdown: Record<string, number> = {};

  for (const item of wordItems) {
    if (item.responseTimeMs) {
      totalDurationMs += item.responseTimeMs;
      validTimeCount++;
    }
    if (item.reactionTimeMs) {
      totalReactionMs += item.reactionTimeMs;
    }
    if (item.pausesCount) pausesCount += item.pausesCount;
    if (item.isSelfCorrection) selfCorrectionsCount++;
    if (item.silabationDetected) silabationCount++;

    if (item.observedError) {
      errorBreakdown[item.observedError] = (errorBreakdown[item.observedError] || 0) + 1;
    }
  }

  const averageDurationMs = validTimeCount > 0 ? Math.round(totalDurationMs / validTimeCount) : 0;
  const averageReactionTimeMs = validTimeCount > 0 ? Math.round(totalReactionMs / validTimeCount) : 0;

  // Cálculo da velocidade: palavras corretas por minuto
  const totalSeconds = totalDurationMs > 0 ? totalDurationMs / 1000 : 1;
  const wordsPerMinute = Math.round((correct / totalSeconds) * 60);

  return {
    presented,
    correct,
    incorrect,
    noResponse,
    timeExceededCount,
    wordsPerMinute,
    accuracy,
    averageReactionTimeMs,
    averageDurationMs,
    pausesCount,
    selfCorrectionsCount,
    silabationCount,
    errorBreakdown
  };
}

/**
 * Classificação estrita nos 6 Níveis Pedagógicos Oficiais (Regras 1, 9, 11 e 26)
 */
export function classifyPedagogicalDiagnosis(
  lettersReport: LettersReportMetrics,
  wordsReport: WordsReportMetrics,
  textReport?: TextReportMetrics
): PedagogicalDiagnosis {
  // Regra 1: PRÉ-LEITOR 1
  // A criança não conseguiu identificar letras de maneira suficiente (< 10 letras)
  if (lettersReport.presented > 0 && lettersReport.correct < 10) {
    return 'PRE_LEITOR_1';
  }

  // Regra 1: PRÉ-LEITOR 2
  // A criança identificou 10 ou mais letras corretamente, mas 0 palavras corretas
  if (lettersReport.correct >= 10 && wordsReport.presented > 0 && wordsReport.correct === 0) {
    return 'PRE_LEITOR_2';
  }

  // Regra 1 & 9: PRÉ-LEITOR 3
  // Conseguiu ler de 1 a 10 palavras isoladas
  if (wordsReport.correct >= 1 && wordsReport.correct <= 10) {
    return 'PRE_LEITOR_3';
  }

  // Regra 1 & 9: LEITOR INICIANTE 1
  // Conseguiu ler de 11 a 20 palavras isoladas em 60 segundos (ou WPM entre 11 e 20)
  if (wordsReport.wordsPerMinute >= 11 && wordsReport.wordsPerMinute <= 20) {
    return 'LEITOR_INICIANTE_1';
  }

  // Se leu 21 ou mais palavras isoladas por minuto:
  if (wordsReport.wordsPerMinute >= 21 || wordsReport.correct >= 11) {
    // Se a leitura textual foi realizada e preenche os critérios simultâneos de fluência:
    // Pelo menos 65 PCPM + > 90% precisão + automaticidade
    if (textReport?.evaluated && textReport.isFluentEligible) {
      return 'LEITOR_FLUENTE';
    }

    // Regra 11: Se atingir 21+ palavras/minuto, mas não preencher critérios de texto, manter Leitor Iniciante 2
    return 'LEITOR_INICIANTE_2';
  }

  // Fallback seguro baseado em letras
  return lettersReport.correct >= 10 ? 'PRE_LEITOR_2' : 'PRE_LEITOR_1';
}

/**
 * Gera as evidências detalhadas da classificação (Regra 19)
 */
export function generateClassificationEvidences(
  diagnosis: PedagogicalDiagnosis,
  lettersReport: LettersReportMetrics,
  wordsReport: WordsReportMetrics,
  textReport?: TextReportMetrics,
  phrasesReport?: PhrasesReportMetrics
): string[] {
  const evidences: string[] = [];

  switch (diagnosis) {
    case 'PRE_LEITOR_1':
      evidences.push(
        `A criança identificou ${lettersReport.correct} de ${lettersReport.presented} letras apresentadas (${lettersReport.accuracy}% de precisão), com tempo médio de resposta de ${(lettersReport.averageReactionTimeMs / 1000).toFixed(1)}s.`
      );
      evidences.push(
        'O número de letras reconhecidas permaneceu abaixo do limiar operacional de 10 acertos necessário para progressão consistente à leitura de palavras isoladas.'
      );
      if (lettersReport.noResponseCount > 0) {
        evidences.push(
          `Foram registradas ${lettersReport.noResponseCount} ausências de resposta no limite de 10 segundos por letra.`
        );
      }
      break;

    case 'PRE_LEITOR_2':
      evidences.push(
        `A criança identificou ${lettersReport.correct} letras corretamente (acima do limiar de 10 letras), demonstrando conhecimento consolidado do alfabeto básico.`
      );
      evidences.push(
        `Na etapa de palavras isoladas, foram avaliadas ${wordsReport.presented} palavras, sem registro de decodificação autônoma correta (0 palavras lidas com correspondência plena).`
      );
      evidences.push(
        'Esse padrão evidencia fase de transição alfabética, na qual o estudante já domina as letras, mas ainda não opera a síntese grafema-fonema em palavras inteiras.'
      );
      break;

    case 'PRE_LEITOR_3':
      evidences.push(
        `A criança leu ${wordsReport.correct} palavras corretamente de um total de ${wordsReport.presented} apresentadas, obtendo precisão de ${wordsReport.accuracy}%.`
      );
      evidences.push(
        `A velocidade foi de ${wordsReport.wordsPerMinute} palavras por minuto, com tempo médio de ${(wordsReport.averageDurationMs / 1000).toFixed(1)}s por palavra e ${wordsReport.silabationCount} ocorrências de silabação.`
      );
      evidences.push(
        'O desempenho enquadra-se estritamente no intervalo de 1 a 10 palavras corretas, caracterizando decodificação inicial emergente sem automaticidade.'
      );
      break;

    case 'LEITOR_INICIANTE_1':
      evidences.push(
        `A criança leu ${wordsReport.correct} palavras corretamente em palavras isoladas, alcançando uma taxa de ${wordsReport.wordsPerMinute} palavras corretas por minuto (faixa de 11 a 20 PCPM).`
      );
      evidences.push(
        `Apresentou precisão de ${wordsReport.accuracy}%, com tempo médio de emissão de ${(wordsReport.averageDurationMs / 1000).toFixed(1)}s e ${wordsReport.pausesCount} pausas registradas.`
      );
      evidences.push(
        'O perfil demonstra decodificação funcional consolidada para termos simples, com hesitações e silabação moderadas, compatível com Leitor Iniciante 1.'
      );
      break;

    case 'LEITOR_INICIANTE_2':
      evidences.push(
        `A criança demonstrou ritmo inicial vigoroso em palavras isoladas (${wordsReport.wordsPerMinute} palavras corretas por minuto e ${wordsReport.correct} acertos).`
      );
      if (textReport?.evaluated) {
        evidences.push(
          `Na leitura contextual do texto ("${textReport.textTitle || 'Texto Narrativo'}"), alcançou taxa de ${textReport.wordsPerMinute} PCPM com ${textReport.accuracy}% de precisão.`
        );
        evidences.push(
          `Embora supere o limiar de 21 palavras por minuto em lista, não atingiu simultaneamente os 65 PCPM e precisão superior a 90% no texto exigidos para Leitor Fluente. Mantém-se classificada como Leitor Iniciante 2.`
        );
      } else {
        evidences.push(
          'Atingiu taxa compatível com Leitor Iniciante 2 em lista isolada, mas a etapa textual não evidenciou os critérios cumulativos de fluência plena.'
        );
      }
      break;

    case 'LEITOR_FLUENTE':
      if (textReport?.evaluated) {
        evidences.push(
          `A criança leu ${textReport.wordsCorrect} palavras corretamente no texto com taxa de ${textReport.wordsPerMinute} palavras corretas por minuto (critério mínimo de 65 PCPM superado).`
        );
        evidences.push(
          `Obteve precisão textual de ${textReport.accuracy}% (critério superior a 90% atendido), com leitura contínua, baixa frequência de silabação e respeito funcional à pontuação.`
        );
      }
      if (phrasesReport?.evaluated) {
        evidences.push(
          `Na etapa confirmatória de frases, concluiu ${phrasesReport.completed} de ${phrasesReport.presented} estruturas sintáticas com prosódia adequada (índice de expressividade de ${phrasesReport.prosodyScore}/100).`
        );
      }
      evidences.push(
        'O conjunto dos dados atende simultaneamente aos requisitos de velocidade, precisão, automaticidade e prosódia, sustentando de forma inequívoca o nível Leitor Fluente.'
      );
      break;
  }

  return evidences;
}

/**
 * Gera o Resumo Executivo para leitura rápida do Supervisor (Regra 20)
 */
export function generateExecutiveSummary(
  diagnosis: PedagogicalDiagnosis,
  lettersReport: LettersReportMetrics,
  wordsReport: WordsReportMetrics,
  textReport?: TextReportMetrics,
  _phrasesReport?: PhrasesReportMetrics
): ExecutiveSummary {
  switch (diagnosis) {
    case 'PRE_LEITOR_1':
      return {
        currentLevelTitle: 'Pré-Leitor 1 (Identificação Inicial de Letras)',
        currentLevelCategory: 'Pré-Leitor',
        whatChildCanDo: `Identifica algumas letras isoladas (${lettersReport.correct} identificadas corretamente).`,
        mainDifficulties: 'Dificuldade no reconhecimento estável de grafemas e distinção de letras com traçado ou sons semelhantes.',
        supportingData: `${lettersReport.correct} de ${lettersReport.presented} letras corretas (${lettersReport.accuracy}% de precisão).`,
        skillsNeedingAttention: ['Reconhecimento das letras do alfabeto', 'Correspondência grafema-fonema', 'Consciência fonológica inicial'],
        readingQualitySummary: 'Reconhecimento de letras em fase inicial, com necessidade de mediação frequente.',
        aspectsToWorkOn: ['Prática lúdica de nomeação rápida de letras', 'Associação entre som e grafema com apoio multissensorial']
      };

    case 'PRE_LEITOR_2':
      return {
        currentLevelTitle: 'Pré-Leitor 2 (Domínio de Letras em Transição)',
        currentLevelCategory: 'Pré-Leitor',
        whatChildCanDo: `Identifica 10 ou mais letras com segurança (${lettersReport.correct} letras reconhecidas).`,
        mainDifficulties: 'Síntese das letras para formação e leitura autônoma de palavras completas.',
        supportingData: `${lettersReport.correct} letras corretas, porém sem leitura autônoma de palavras isoladas na etapa 2.`,
        skillsNeedingAttention: ['Síntese fonêmica', 'Leitura de sílabas canônicas (CV)', 'Fusão auditiva'],
        readingQualitySummary: 'Identifica grafemas com segurança, mas ainda não decodifica palavras isoladas.',
        aspectsToWorkOn: ['Jogos de formação de sílabas simples', 'Leitura de palavras dissílabas com apoio de figuras']
      };

    case 'PRE_LEITOR_3':
      return {
        currentLevelTitle: 'Pré-Leitor 3 (Decodificação Inicial de Palavras)',
        currentLevelCategory: 'Pré-Leitor',
        whatChildCanDo: `Lê palavras dissílabas simples com decodificação emergente (${wordsReport.correct} palavras corretas).`,
        mainDifficulties: 'Silabação excessiva, tempo de reação elevado e hesitação em sílabas não canônicas.',
        supportingData: `${wordsReport.correct} palavras corretas (intervalo de 1 a 10), precisão de ${wordsReport.accuracy}%.`,
        skillsNeedingAttention: ['Agilidade de decodificação', 'Redução da silabação', 'Ampliação do vocabulário visual'],
        readingQualitySummary: 'Decodificação inicial palavra por palavra, com ritmo pausado e silabado.',
        aspectsToWorkOn: ['Leitura repetida de listas de palavras familiares', 'Treino de automaticidade em sílabas canônicas']
      };

    case 'LEITOR_INICIANTE_1':
      return {
        currentLevelTitle: 'Leitor Iniciante 1 (Decodificação Intermediária)',
        currentLevelCategory: 'Leitor Iniciante',
        whatChildCanDo: `Lê palavras isoladas com taxa entre 11 e 20 palavras por minuto (${wordsReport.wordsPerMinute} PCPM).`,
        mainDifficulties: 'Pausas frequentes em dígrafos e encontros consonantais, ritmo ainda fragmentado.',
        supportingData: `${wordsReport.wordsPerMinute} PCPM, ${wordsReport.correct} acertos, precisão de ${wordsReport.accuracy}%.`,
        skillsNeedingAttention: ['Fluência em palavras complexas', 'Automaticidade de dígrafos (CH, LH, NH)', 'Encontros com R e L'],
        readingQualitySummary: 'Leitura funcional com pausas e autocorreções, decodificação em consolidação.',
        aspectsToWorkOn: ['Atividades de leitura repetida cronometrada', 'Exercícios com encontros consonantais e dígrafos']
      };

    case 'LEITOR_INICIANTE_2':
      return {
        currentLevelTitle: 'Leitor Iniciante 2 (Decodificação Avançada sem Fluência Plena)',
        currentLevelCategory: 'Leitor Iniciante',
        whatChildCanDo: `Lê 21 ou mais palavras isoladas por minuto (${wordsReport.wordsPerMinute} PCPM em lista).`,
        mainDifficulties: 'Queda de velocidade ou precisão ao ler textos em contexto (não atingiu 65 PCPM ou 90% no texto).',
        supportingData: `Palavras isoladas: ${wordsReport.wordsPerMinute} PCPM; Texto: ${textReport?.wordsPerMinute || 0} PCPM com ${textReport?.accuracy || 0}% de precisão.`,
        skillsNeedingAttention: ['Leitura contextual contínua', 'Respeito à pontuação', 'Prosódia e ritmo narrativo'],
        readingQualitySummary: 'Excelente em palavras isoladas, mas requer desenvolvimento da fluência e prosódia em texto corrido.',
        aspectsToWorkOn: ['Leitura compartilhada e expressiva de textos curtos', 'Exercícios de entonação e pontuação']
      };

    case 'LEITOR_FLUENTE':
      return {
        currentLevelTitle: 'Leitor Fluente (Fluência Consolidada em Texto)',
        currentLevelCategory: 'Leitor Fluente',
        whatChildCanDo: `Lê textos com velocidade superior a 65 PCPM (${textReport?.wordsPerMinute || 65} PCPM) e precisão > 90%.`,
        mainDifficulties: 'Manter a expressividade em textos extensos com estruturas sintáticas altamente complexas.',
        supportingData: `Texto: ${textReport?.wordsPerMinute || 65} PCPM, ${textReport?.accuracy || 95}% de precisão, prosódia confirmada em frases.`,
        skillsNeedingAttention: ['Interpretação e inferência textual', 'Expressividade dramática', 'Vocabulário enriquecido'],
        readingQualitySummary: 'Leitura contínua, rápida e expressiva, com respeito à pontuação e adequada automaticidade.',
        aspectsToWorkOn: ['Leituras desafiadoras de múltiplos gêneros textuais', 'Projetos de contação de histórias']
      };
  }
}

