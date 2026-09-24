import { EvaluationItemResult, PracticeRecommendation } from '../types/evaluation';
import { QuestionItem } from '../types/question';
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
  isTechnicalError: boolean = false
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

  // Se for frase (Nível 4)
  if (expectedItem.type === 'phrase') {
    return comparePhrase(normExpected, normTranscript, confidence);
  }

  // Se for palavra única (Níveis 1, 2 e 3)
  return compareWord(expectedItem, normExpected, normTranscript, confidence);
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

  // Fala completamente divergente
  if (minDistance >= expectedLength * 0.8) {
    return {
      status: 'INCORRETO' as RecognitionStatus,
      normalizedExpected: normExpected,
      normalizedTranscript: cleanTranscript,
      distance: minDistance,
      observedError: `Palavra divergente (esperado: ${normExpected}, reconhecido: ${cleanTranscript})`
    };
  }

  return {
    status: 'INCORRETO' as RecognitionStatus,
    normalizedExpected: normExpected,
    normalizedTranscript: cleanTranscript,
    distance: minDistance,
    observedError: `Dificuldade articulatória observada na palavra ${normExpected}`
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
