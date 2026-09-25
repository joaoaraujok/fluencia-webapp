import { describe, it, expect } from 'vitest';
import {
  compareSpeech,
  compareTextReading,
  compileLettersMetrics,
  compileWordsMetrics,
  classifyPedagogicalDiagnosis,
  generateClassificationEvidences,
  generateExecutiveSummary
} from '../services/analysisEngine';
import { EvaluationItemResult } from '../types/evaluation';
import { QuestionItem } from '../types/question';

describe('Motor Adaptativo de Fluência Leitora - Regras Oficiais', () => {
  describe('Etapa 1: Reconhecimento de Letras', () => {
    it('deve reconhecer letra correta por denominação direta ou nome da letra', () => {
      const item: QuestionItem = {
        id: 'let_01',
        text: 'B',
        level: 1,
        type: 'letter',
        syllablesCount: 1,
        syllableStructure: 'letter',
        category: 'consoante'
      };

      const res1 = compareSpeech(item, 'B');
      expect(res1.status).toBe('CORRETO');

      const res2 = compareSpeech(item, 'BÊ');
      expect(res2.status).toBe('CORRETO');

      const res3 = compareSpeech(item, 'LETRA B');
      expect(res3.status).toBe('CORRETO');
    });

    it('deve reconhecer letra correta com método fônico e expressões infantis sem falso positivo de stopwords', () => {
      const itemB: QuestionItem = {
        id: 'let_06',
        text: 'B',
        level: 1,
        type: 'letter',
        syllablesCount: 1,
        syllableStructure: 'letter',
        category: 'consoante'
      };

      // "B de bola": NÃO deve confundir com a letra D por causa do "DE"
      const resBdeBola = compareSpeech(itemB, 'B DE BOLA');
      expect(resBdeBola.status).toBe('CORRETO');

      // "A letra B": NÃO deve confundir com a letra A por causa do "A"
      const resALetraB = compareSpeech(itemB, 'A LETRA B');
      expect(resALetraB.status).toBe('CORRETO');

      // Apoio fônico direto: "BOLA", "BALA"
      const resFonica = compareSpeech(itemB, 'BOLA');
      expect(resFonica.status).toBe('CORRETO');

      // Outras consoantes com apoio fônico: letra S -> "SAPO"
      const itemS: QuestionItem = {
        id: 'let_11',
        text: 'S',
        level: 1,
        type: 'letter',
        syllablesCount: 1,
        syllableStructure: 'letter',
        category: 'consoante'
      };
      const resSapo = compareSpeech(itemS, 'SAPO');
      expect(resSapo.status).toBe('CORRETO');

      // Vogais: letra A -> "A", "AH", "Á", "AVIAO"
      const itemA: QuestionItem = {
        id: 'let_01',
        text: 'A',
        level: 1,
        type: 'letter',
        syllablesCount: 1,
        syllableStructure: 'letter',
        category: 'vogal'
      };
      expect(compareSpeech(itemA, 'A').status).toBe('CORRETO');
      expect(compareSpeech(itemA, 'AH').status).toBe('CORRETO');
      expect(compareSpeech(itemA, 'AVIAO').status).toBe('CORRETO');
    });

    it('deve registrar confusão grafofonêmica comum B vs D apenas quando dita isoladamente', () => {
      const item: QuestionItem = {
        id: 'let_01',
        text: 'B',
        level: 1,
        type: 'letter',
        syllablesCount: 1,
        syllableStructure: 'letter',
        category: 'consoante'
      };

      const res = compareSpeech(item, 'D');
      expect(res.status).toBe('INCORRETO');
      expect(res.observedError).toContain('Confusão típica com a letra D');
    });

    it('não deve punir isoladamente baixa confiança do ASR (< 0.65)', () => {
      const item: QuestionItem = {
        id: 'let_01',
        text: 'F',
        level: 1,
        type: 'letter',
        syllablesCount: 1,
        syllableStructure: 'letter',
        category: 'consoante'
      };

      const res = compareSpeech(item, 'XYZ', 0.50);
      expect(res.status).toBe('POSSIVELMENTE_CORRETO');
      expect(res.observedError).toContain('Indeterminada — baixa confiança');
    });
  });

  describe('Etapa 3: Leitura de Texto em Contexto', () => {
    const textTarget = 'MIMOSO É UM GATO MUITO BONITO. ELE GOSTA DE BRINCAR COM A BOLA DE LÃ NO QUINTAL.';

    it('deve calcular PCPM, precisão e elegibilidade para Leitor Fluente (>= 65 PCPM e > 90% precisão)', () => {
      // Leitura quase perfeita em 20 segundos (taxa superior a 65 PCPM)
      const spoken = 'MIMOSO É UM GATO MUITO BONITO ELE GOSTA DE BRINCAR COM A BOLA DE LÃ NO QUINTAL';
      const analysis = compareTextReading(textTarget, spoken, 15);

      expect(analysis.wordsCorrect).toBeGreaterThanOrEqual(14);
      expect(analysis.accuracy).toBeGreaterThan(90);
      expect(analysis.wordsPerMinute).toBeGreaterThanOrEqual(65);
      expect(analysis.isFluentEligible).toBe(true);
    });

    it('não deve considerar Leitor Fluente se PCPM for inferior a 65, mesmo com precisão alta', () => {
      // Leu tudo certo mas demorou 60 segundos (aprox 16 PCPM)
      const spoken = 'MIMOSO É UM GATO MUITO BONITO ELE GOSTA DE BRINCAR COM A BOLA DE LÃ NO QUINTAL';
      const analysis = compareTextReading(textTarget, spoken, 60);

      expect(analysis.accuracy).toBeGreaterThan(90);
      expect(analysis.wordsPerMinute).toBeLessThan(65);
      expect(analysis.isFluentEligible).toBe(false);
    });
  });

  describe('Classificação nos 6 Níveis Pedagógicos Estritos', () => {
    it('deve classificar como PRÉ-LEITOR 1 quando identificar menos de 10 letras', () => {
      const letters = {
        presented: 15,
        correct: 7,
        accuracy: 47,
        averageReactionTimeMs: 3000,
        noResponseCount: 3,
        timeExceededCount: 2,
        confusions: [],
        recognizedLetters: ['A', 'E', 'I', 'O', 'U', 'B', 'M'],
        challengingLetters: ['D', 'P', 'T', 'S', 'V', 'F', 'L', 'R']
      };
      const words = {
        presented: 0,
        correct: 0,
        incorrect: 0,
        noResponse: 0,
        timeExceededCount: 0,
        wordsPerMinute: 0,
        accuracy: 0,
        averageReactionTimeMs: 0,
        averageDurationMs: 0,
        pausesCount: 0,
        selfCorrectionsCount: 0,
        silabationCount: 0,
        errorBreakdown: {}
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words);
      expect(diagnosis).toBe('PRE_LEITOR_1');

      const evidences = generateClassificationEvidences(diagnosis, letters, words);
      expect(evidences[0]).toContain('identificou 7 de 15 letras');
    });

    it('deve classificar como PRÉ-LEITOR 2 quando identificar >= 10 letras, mas 0 palavras corretas', () => {
      const letters = {
        presented: 15,
        correct: 12,
        accuracy: 80,
        averageReactionTimeMs: 2000,
        noResponseCount: 0,
        timeExceededCount: 0,
        confusions: [],
        recognizedLetters: [],
        challengingLetters: []
      };
      const words = {
        presented: 10,
        correct: 0,
        incorrect: 8,
        noResponse: 2,
        timeExceededCount: 2,
        wordsPerMinute: 0,
        accuracy: 0,
        averageReactionTimeMs: 4000,
        averageDurationMs: 6000,
        pausesCount: 4,
        selfCorrectionsCount: 0,
        silabationCount: 6,
        errorBreakdown: {}
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words);
      expect(diagnosis).toBe('PRE_LEITOR_2');
    });

    it('deve classificar como PRÉ-LEITOR 3 quando ler corretamente de 1 a 10 palavras isoladas', () => {
      const letters = {
        presented: 15,
        correct: 14,
        accuracy: 93,
        averageReactionTimeMs: 1500,
        noResponseCount: 0,
        timeExceededCount: 0,
        confusions: [],
        recognizedLetters: [],
        challengingLetters: []
      };
      const words = {
        presented: 15,
        correct: 6,
        incorrect: 9,
        noResponse: 0,
        timeExceededCount: 1,
        wordsPerMinute: 8,
        accuracy: 40,
        averageReactionTimeMs: 3200,
        averageDurationMs: 4500,
        pausesCount: 5,
        selfCorrectionsCount: 1,
        silabationCount: 4,
        errorBreakdown: {}
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words);
      expect(diagnosis).toBe('PRE_LEITOR_3');
    });

    it('deve classificar como LEITOR INICIANTE 1 quando ler de 11 a 20 palavras corretas por minuto', () => {
      const letters = {
        presented: 15,
        correct: 15,
        accuracy: 100,
        averageReactionTimeMs: 1200,
        noResponseCount: 0,
        timeExceededCount: 0,
        confusions: [],
        recognizedLetters: [],
        challengingLetters: []
      };
      const words = {
        presented: 20,
        correct: 16,
        incorrect: 4,
        noResponse: 0,
        timeExceededCount: 0,
        wordsPerMinute: 17,
        accuracy: 80,
        averageReactionTimeMs: 1800,
        averageDurationMs: 2500,
        pausesCount: 2,
        selfCorrectionsCount: 2,
        silabationCount: 2,
        errorBreakdown: {}
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words);
      expect(diagnosis).toBe('LEITOR_INICIANTE_1');
    });

    it('deve classificar como LEITOR INICIANTE 2 quando ler 21+ palavras/min, mas NÃO atingir critérios no texto', () => {
      const letters = {
        presented: 15,
        correct: 15,
        accuracy: 100,
        averageReactionTimeMs: 1000,
        noResponseCount: 0,
        timeExceededCount: 0,
        confusions: [],
        recognizedLetters: [],
        challengingLetters: []
      };
      const words = {
        presented: 20,
        correct: 19,
        incorrect: 1,
        noResponse: 0,
        timeExceededCount: 0,
        wordsPerMinute: 28,
        accuracy: 95,
        averageReactionTimeMs: 1200,
        averageDurationMs: 1800,
        pausesCount: 1,
        selfCorrectionsCount: 1,
        silabationCount: 0,
        errorBreakdown: {}
      };
      const text = {
        evaluated: true,
        textTitle: 'Mimoso',
        totalWords: 30,
        wordsRead: 25,
        wordsCorrect: 20,
        errorsCount: 5,
        accuracy: 80, // < 90%
        wordsPerMinute: 45, // < 65 PCPM
        durationSeconds: 30,
        pausesCount: 3,
        selfCorrectionsCount: 0,
        silabationCount: 1,
        punctuationRespected: false,
        prosodyScore: 60,
        automaticityLevel: 'media' as const,
        isFluentEligible: false
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words, text);
      expect(diagnosis).toBe('LEITOR_INICIANTE_2');
    });

    it('deve classificar como LEITOR FLUENTE quando atingir >= 65 PCPM e > 90% precisão no texto', () => {
      const letters = {
        presented: 15,
        correct: 15,
        accuracy: 100,
        averageReactionTimeMs: 800,
        noResponseCount: 0,
        timeExceededCount: 0,
        confusions: [],
        recognizedLetters: [],
        challengingLetters: []
      };
      const words = {
        presented: 20,
        correct: 20,
        incorrect: 0,
        noResponse: 0,
        timeExceededCount: 0,
        wordsPerMinute: 35,
        accuracy: 100,
        averageReactionTimeMs: 900,
        averageDurationMs: 1400,
        pausesCount: 0,
        selfCorrectionsCount: 0,
        silabationCount: 0,
        errorBreakdown: {}
      };
      const text = {
        evaluated: true,
        textTitle: 'Mimoso',
        totalWords: 30,
        wordsRead: 30,
        wordsCorrect: 29,
        errorsCount: 1,
        accuracy: 96, // > 90%
        wordsPerMinute: 72, // >= 65 PCPM
        durationSeconds: 24,
        pausesCount: 1,
        selfCorrectionsCount: 0,
        silabationCount: 0,
        punctuationRespected: true,
        prosodyScore: 92,
        automaticityLevel: 'alta' as const,
        isFluentEligible: true
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words, text);
      expect(diagnosis).toBe('LEITOR_FLUENTE');

      const exec = generateExecutiveSummary(diagnosis, letters, words, text);
      expect(exec.currentLevelTitle).toContain('Leitor Fluente');
      expect(exec.whatChildCanDo).toContain('65 PCPM');
    });
  });

  describe('Compilação de Métricas de Palavras e Letras', () => {
    it('deve computar métricas consolidadas de itens avaliados', () => {
      const items: EvaluationItemResult[] = [
        {
          questionId: 'w1',
          targetText: 'BOLA',
          level: 1,
          type: 'word',
          syllableStructure: 'canonical_cv_cv',
          category: 'brinquedos',
          transcript: 'bola',
          status: 'CORRETO',
          responseTimeMs: 2000,
          reactionTimeMs: 800,
          speechDurationMs: 1200,
          totalTimeMs: 2000,
          availableTimeMs: 10000,
          confidence: 0.95
        },
        {
          questionId: 'w2',
          targetText: 'SAPO',
          level: 1,
          type: 'word',
          syllableStructure: 'canonical_cv_cv',
          category: 'animais',
          transcript: 'sapo',
          status: 'CORRETO',
          responseTimeMs: 3000,
          reactionTimeMs: 1200,
          speechDurationMs: 1800,
          totalTimeMs: 3000,
          availableTimeMs: 10000,
          confidence: 0.98,
          isSelfCorrection: true
        }
      ];

      const metrics = compileWordsMetrics(items);
      expect(metrics.presented).toBe(2);
      expect(metrics.correct).toBe(2);
      expect(metrics.accuracy).toBe(100);
      expect(metrics.selfCorrectionsCount).toBe(1);
      expect(metrics.averageDurationMs).toBe(2500);
      expect(metrics.averageReactionTimeMs).toBe(1000);
    });

    it('deve computar métricas consolidadas de letras avaliadas', () => {
      const items: EvaluationItemResult[] = [
        {
          questionId: 'l1',
          targetText: 'A',
          level: 1,
          type: 'letter',
          syllableStructure: 'letter',
          category: 'vogal',
          transcript: 'a',
          status: 'CORRETO',
          responseTimeMs: 1500,
          reactionTimeMs: 900,
          availableTimeMs: 10000,
          confidence: 0.99
        },
        {
          questionId: 'l2',
          targetText: 'B',
          level: 1,
          type: 'letter',
          syllableStructure: 'letter',
          category: 'consoante',
          transcript: 'd',
          status: 'INCORRETO',
          responseTimeMs: 2500,
          reactionTimeMs: 1800,
          availableTimeMs: 10000,
          confidence: 0.92
        }
      ];

      const metrics = compileLettersMetrics(items);
      expect(metrics.presented).toBe(2);
      expect(metrics.correct).toBe(1);
      expect(metrics.accuracy).toBe(50);
      expect(metrics.averageReactionTimeMs).toBe(1350);
      expect(metrics.confusions).toHaveLength(1);
      expect(metrics.confusions[0].expected).toBe('B');
      expect(metrics.confusions[0].spoken).toBe('d');
    });
  });
});
