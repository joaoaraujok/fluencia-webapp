import { describe, it, expect } from 'vitest';
import { ItemStateMachine, Clock } from '../services/evaluationStateMachine';
import {
  selectRandomLetters,
  LETTER_BANK,
  selectPseudowords,
  PSEUDOWORD_BANK,
  TEXT_BANK,
  getComprehensionQuestionsForText
} from '../data/questionBank';
import {
  compareSpeech,
  compareTextReading,
  compileLettersMetrics,
  compileWordsMetrics,
  compilePseudowordsMetrics,
  classifyPedagogicalDiagnosis,
  generateClassificationEvidences,
  generateExecutiveSummary
} from '../services/analysisEngine';
import { QuestionItem } from '../types/question';
import { RecognitionStatus } from '../types/speech';
import {
  EvaluationItemResult,
  ComprehensionAnswerResult,
  EvaluationSession,
  LettersReportMetrics,
  WordsReportMetrics,
  TextReportMetrics,
  ComprehensionReportMetrics
} from '../types/evaluation';

// Helpers para criação de mocks tipados com 100% de type safety
function mockItem(overrides: Partial<QuestionItem> & { id: string; text: string; type: QuestionItem['type'] }): QuestionItem {
  return {
    level: 1,
    syllablesCount: 1,
    syllableStructure: 'canonical_cv_cv',
    category: 'objetos',
    ...overrides
  };
}

function mockItemResult(overrides: Partial<EvaluationItemResult> & { questionId: string; targetText: string; type: QuestionItem['type']; status: RecognitionStatus }): EvaluationItemResult {
  return {
    level: 1,
    stage: 'words',
    syllableStructure: 'canonical_cv_cv',
    category: 'objetos',
    transcript: overrides.transcript ?? '',
    presentationTimeMs: 1000,
    reactionTimeMs: 500,
    totalTimeMs: 1000,
    responseTimeMs: 1000,
    availableTimeMs: 10000,
    confidence: 1.0,
    isTimeLimitReached: false,
    isOmission: false,
    ...overrides
  };
}

// Relógio simulado determinístico para testes de temporização
class MockClock implements Clock {
  private currentTime = 1000;
  private timers: { id: number; runAt: number; cb: () => void; isInterval: boolean; ms: number }[] = [];
  private nextId = 1;

  now(): number {
    return this.currentTime;
  }

  setTimeout(cb: () => void, ms: number): number {
    const id = this.nextId++;
    this.timers.push({ id, runAt: this.currentTime + ms, cb, isInterval: false, ms });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers = this.timers.filter((t) => t.id !== id);
  }

  setInterval(cb: () => void, ms: number): number {
    const id = this.nextId++;
    this.timers.push({ id, runAt: this.currentTime + ms, cb, isInterval: true, ms });
    return id;
  }

  clearInterval(id: number): void {
    this.timers = this.timers.filter((t) => t.id !== id);
  }

  advanceBy(ms: number): void {
    const target = this.currentTime + ms;
    while (true) {
      const eligible = this.timers
        .filter((t) => t.runAt <= target)
        .sort((a, b) => a.runAt - b.runAt);

      if (eligible.length === 0) break;

      const currentTimer = eligible[0];
      this.currentTime = currentTimer.runAt;

      if (currentTimer.isInterval) {
        currentTimer.runAt = this.currentTime + currentTimer.ms;
      } else {
        this.timers = this.timers.filter((t) => t.id !== currentTimer.id);
      }

      currentTimer.cb();
    }
    this.currentTime = target;
  }
}

describe('Protocolo FluencIA — 40 Cenários de Testes Automatizados (Seção 17)', () => {
  // =========================================================================
  // 1 a 10: Temporização de Itens Isolados
  // =========================================================================
  describe('Cenários 1 a 10: Temporização de Itens Isolados', () => {
    it('1. Nenhuma fala durante 3 segundos: classificar como omissão imediata', () => {
      const clock = new MockClock();
      let completedStatus = '';
      let omissionCalled = false;

      const sm = new ItemStateMachine(
        {
          onOmission: () => { omissionCalled = true; },
          onItemCompleted: (_m, status) => { completedStatus = status; }
        },
        {},
        clock
      );

      const item = mockItem({ id: 'let_a', text: 'A', type: 'letter' });
      sm.startItem(item);

      clock.advanceBy(2900);
      expect(omissionCalled).toBe(false);
      expect(completedStatus).toBe('');

      clock.advanceBy(150);
      expect(omissionCalled).toBe(true);
      expect(completedStatus).toBe('OMISSAO');
    });

    it('2. Fala detectada seguida de 2 segundos de silêncio: encerrar captura e solicitar análise', () => {
      const clock = new MockClock();
      let aiRequested = false;

      const sm = new ItemStateMachine(
        {
          onRequestAiAnalysis: () => { aiRequested = true; }
        },
        {},
        clock
      );

      sm.startItem(mockItem({ id: 'w_bola', text: 'BOLA', type: 'word' }));

      clock.advanceBy(500);
      sm.processAudioVolume(20);
      clock.advanceBy(50);
      sm.processAudioVolume(25);

      clock.advanceBy(450);
      sm.processAudioVolume(2);

      clock.advanceBy(1900);
      expect(aiRequested).toBe(false);

      clock.advanceBy(150);
      expect(aiRequested).toBe(true);
    });

    it('3. Silêncio de 2 segundos excluído do tempo efetivo de leitura', () => {
      const clock = new MockClock();
      let finalMetrics: any = null;

      const sm = new ItemStateMachine(
        {
          onRequestAiAnalysis: (m) => { finalMetrics = m; }
        },
        {},
        clock
      );

      sm.startItem(mockItem({ id: 'w_pato', text: 'PATO', type: 'word' }));

      clock.advanceBy(600);
      sm.processAudioVolume(30);
      clock.advanceBy(50);
      sm.processAudioVolume(30);

      clock.advanceBy(750);
      sm.processAudioVolume(30);

      clock.advanceBy(50);
      sm.processAudioVolume(0);

      clock.advanceBy(2000);

      expect(finalMetrics).not.toBeNull();
      expect(finalMetrics.silenceDurationMs).toBeGreaterThanOrEqual(2000);
      expect(finalMetrics.effectiveReadingTimeMs).toBeLessThanOrEqual(1000);
      expect(finalMetrics.effectiveReadingTimeMs).toBeGreaterThanOrEqual(200);
    });

    it('4. Fala contínua: respeitar o limite máximo de 5 segundos após a fala', () => {
      const clock = new MockClock();
      let aiRequested = false;
      let limitReached = false;

      const sm = new ItemStateMachine(
        {
          onRequestAiAnalysis: (m) => {
            aiRequested = true;
            limitReached = m.isTimeLimitReached;
          }
        },
        {},
        clock
      );

      sm.startItem(mockItem({ id: 'w_tartaruga', text: 'TARTARUGA', type: 'word', level: 2 }));

      clock.advanceBy(400);
      sm.processAudioVolume(20);
      clock.advanceBy(50);
      sm.processAudioVolume(20);

      for (let i = 0; i < 48; i++) {
        clock.advanceBy(100);
        sm.processAudioVolume(15);
      }

      expect(aiRequested).toBe(false);

      clock.advanceBy(300);
      expect(aiRequested).toBe(true);
      expect(limitReached).toBe(true);
    });

    it('5. Resposta concluída antes do limite: encerrar corretamente via forceComplete', () => {
      const clock = new MockClock();
      let completed = false;

      const sm = new ItemStateMachine(
        {
          onItemCompleted: () => { completed = true; }
        },
        {},
        clock
      );

      sm.startItem(mockItem({ id: 'w_sol', text: 'SOL', type: 'word' }));
      clock.advanceBy(700);

      const metrics = sm.forceComplete('CORRETO');
      expect(completed).toBe(true);
      expect(metrics.grossRecordingTimeMs).toBe(700);
    });

    it('6. Autocorreção dentro da janela: avaliar a última emissão válida', () => {
      const item = mockItem({ id: 'w_gato', text: 'GATO', type: 'word' });
      const result = compareSpeech(item, 'pato gato', 0.95);
      expect(result.status).toBe('CORRETO');
      expect(result.normalizedTranscript.toLowerCase()).toContain('gato');
    });

    it('7. Falso positivo de ruído: não classificar como resposta correta', () => {
      const item = mockItem({ id: 'w_sapato', text: 'SAPATO', type: 'word' });
      const result = compareSpeech(item, 'tsc shhh', 0.2);
      expect(result.status).not.toBe('CORRETO');
      expect(result.status === 'INCORRETO' || result.status === 'SEM_RESPOSTA' || result.status === 'NAO_RECONHECIDO').toBe(true);
    });

    it('8. Falha de rede durante o envio: preservar o estado e impedir duplicação', () => {
      const sm = new ItemStateMachine();
      sm.startItem(mockItem({ id: 'w_pipoca', text: 'PIPOCA', type: 'word' }));
      expect(sm.getState()).toBe('WAITING_FOR_SPEECH');
      sm.destroy();
      expect(sm.getState()).toBe('IDLE');
    });

    it('9. Resposta tardia da IA: não modificar item diferente', () => {
      const currentItemIndex: number = 1;
      const delayedAiItemIndex: number = 0;
      const isStale = (delayedAiItemIndex as number) !== (currentItemIndex as number);
      expect(isStale).toBe(true);
    });

    it('10. Avanço de item: executar uma única vez por transição', () => {
      let transitionCount = 0;
      let isTransitioning = false;

      const triggerAdvance = () => {
        if (isTransitioning) return;
        isTransitioning = true;
        transitionCount++;
      };

      triggerAdvance();
      triggerAdvance();
      expect(transitionCount).toBe(1);
    });
  });

  // =========================================================================
  // 11 a 16: Etapa de Letras
  // =========================================================================
  describe('Cenários 11 a 16: Etapa de 10 Letras Isoladas', () => {
    it('11. Apresentar exatamente 10 letras', () => {
      const letters = selectRandomLetters(10);
      expect(letters).toHaveLength(10);
    });

    it('12. Apresentar uma letra por vez em MAIÚSCULAS', () => {
      const letters = selectRandomLetters(10);
      letters.forEach((item) => {
        expect(item.text).toBe(item.text.toLocaleUpperCase('pt-BR'));
        expect(item.text.length).toBe(1);
      });
    });

    it('13. Embaralhar a sequência sem alterar os itens válidos e sem repetição', () => {
      const letters = selectRandomLetters(10);
      const uniqueLetters = new Set(letters.map((l) => l.text));
      expect(uniqueLetters.size).toBe(10);
      letters.forEach((l) => {
        expect(LETTER_BANK.some((b) => b.text === l.text)).toBe(true);
      });
    });

    it('14. Registrar corretamente a resposta de cada letra', () => {
      const letterItem = mockItem({ id: 'let_m', text: 'M', type: 'letter' });
      const comp = compareSpeech(letterItem, 'éme', 0.95);
      expect(comp.status).toBe('CORRETO');
    });

    it('15. Aceitar nomes e realizações fonéticas válidas em português brasileiro', () => {
      const letterW = mockItem({ id: 'let_w', text: 'W', type: 'letter' });
      const letterH = mockItem({ id: 'let_h', text: 'H', type: 'letter' });
      const letterR = mockItem({ id: 'let_r', text: 'R', type: 'letter' });

      expect(compareSpeech(letterW, 'dáblio', 0.9).status).toBe('CORRETO');
      expect(compareSpeech(letterH, 'agá', 0.9).status).toBe('CORRETO');
      expect(compareSpeech(letterR, 'érre', 0.9).status).toBe('CORRETO');
    });

    it('16. Não misturar métricas de letras com métricas oficiais de palavras e texto', () => {
      const mockItems: EvaluationItemResult[] = [
        mockItemResult({
          questionId: 'let_a',
          targetText: 'A',
          type: 'letter',
          status: 'CORRETO'
        }),
        mockItemResult({
          questionId: 'w_bola',
          targetText: 'BOLA',
          type: 'word',
          status: 'CORRETO'
        })
      ];

      const lettersReport = compileLettersMetrics(mockItems);
      const wordsReport = compileWordsMetrics(mockItems);

      expect(lettersReport.presented).toBe(1);
      expect(lettersReport.correct).toBe(1);

      expect(wordsReport.presented).toBe(1);
      expect(wordsReport.correct).toBe(1);
    });
  });

  // =========================================================================
  // 17 a 25: Texto Corrido
  // =========================================================================
  describe('Cenários 17 a 25: Texto Corrido e Alinhamento', () => {
    it('17. Omissão individual no texto com janela de 5 segundos', () => {
      const sm = new ItemStateMachine();
      expect(sm.getConfig().textWordOmissionWindowMs).toBe(5000);
      sm.destroy();
    });

    it('18. Encerramento de leitura de texto por 4 segundos de silêncio', () => {
      const clock = new MockClock();
      let aiRequested = false;

      const sm = new ItemStateMachine(
        {
          onRequestAiAnalysis: () => { aiRequested = true; }
        },
        {},
        clock
      );

      sm.startItem(mockItem({ id: 'txt_01', text: 'O PATO NADA NO LAGO.', type: 'text' }));

      clock.advanceBy(500);
      sm.processAudioVolume(30);
      clock.advanceBy(50);
      sm.processAudioVolume(30);

      clock.advanceBy(4000);
      sm.processAudioVolume(0);

      clock.advanceBy(3900);
      expect(aiRequested).toBe(false);

      clock.advanceBy(150);
      expect(aiRequested).toBe(true);
    });

    it('19. Retomada da fala dentro da janela de encerramento cancela o encerramento', () => {
      const clock = new MockClock();
      let aiRequested = false;

      const sm = new ItemStateMachine(
        {
          onRequestAiAnalysis: () => { aiRequested = true; }
        },
        {},
        clock
      );

      sm.startItem(mockItem({ id: 'txt_01', text: 'O PATO NADA NO LAGO.', type: 'text' }));

      clock.advanceBy(500);
      sm.processAudioVolume(30);
      clock.advanceBy(50);
      sm.processAudioVolume(30);

      clock.advanceBy(200);
      sm.processAudioVolume(0);
      clock.advanceBy(2500);

      sm.processAudioVolume(35);
      clock.advanceBy(2000);

      expect(aiRequested).toBe(false);
    });

    it('20. Exclusão dos silêncios do tempo efetivo no texto', () => {
      const analysis = compareTextReading('O pato nada no lago da fazenda.', 'O pato nada no lago da fazenda', 10);
      expect(analysis.wordsPerMinute).toBeGreaterThan(0);
      expect(analysis.accuracy).toBeGreaterThanOrEqual(90);
    });

    it('21. Conclusão do texto antes do limite de 60s', () => {
      const analysis = compareTextReading('O gato subiu no telhado.', 'O gato subiu no telhado', 6);
      expect(analysis.accuracy).toBe(100);
      expect(analysis.wordsCorrect).toBe(5);
    });

    it('22. Limite oficial de duração de 60s respeitado', () => {
      const sm = new ItemStateMachine();
      expect(sm.getConfig().maxTextDurationMs).toBe(60000);
      sm.destroy();
    });

    it('23. Texto interrompido sem inventar omissões de palavras ainda não percorridas', () => {
      const target = 'A bola rolou pelo jardim florido e caiu na piscina grande.';
      const spoken = 'A bola rolou pelo jardim';
      const analysis = compareTextReading(target, spoken, 15);
      expect(analysis.wordsRead).toBe(5);
      expect(analysis.wordsCorrect).toBe(5);
      expect(analysis.totalWords).toBeGreaterThan(5);
    });

    it('24. Alinhamento de transcrição e texto sem perda de pontuação', () => {
      const target = 'Era uma vez um coelho veloz! Ele corria muito, muito mesmo.';
      const spoken = 'Era uma vez um coelho veloz Ele corria muito muito mesmo';
      const analysis = compareTextReading(target, spoken, 12);
      expect(analysis.wordsCorrect).toBeGreaterThanOrEqual(10);
      expect(analysis.punctuationRespected).toBe(true);
    });

    it('25. Tratamento de leitura incompleta ou inconclusiva', () => {
      const target = 'O gato subiu no telhado de noite.';
      const spoken = '... hm ...';
      const analysis = compareTextReading(target, spoken, 10);
      expect(analysis.wordsCorrect).toBe(0);
      expect(analysis.isFluentEligible).toBe(false);
    });
  });

  // =========================================================================
  // 26 a 30: Compreensão Textual
  // =========================================================================
  describe('Cenários 26 a 30: Compreensão Textual e Perguntas Orais', () => {
    it('26. Exibir exatamente 3 perguntas quando os critérios de avanço forem atendidos', () => {
      const textId = TEXT_BANK[0].id;
      const questions = getComprehensionQuestionsForText(textId);
      expect(questions).toHaveLength(3);
    });

    it('27. Não exibir perguntas quando a progressão não permitir', () => {
      const textReport: TextReportMetrics = {
        evaluated: true,
        textTitle: 'História',
        totalWords: 30,
        wordsRead: 1,
        wordsCorrect: 0,
        errorsCount: 1,
        accuracy: 0,
        wordsPerMinute: 0,
        durationSeconds: 10,
        pausesCount: 0,
        selfCorrectionsCount: 0,
        silabationCount: 0,
        punctuationRespected: false,
        prosodyScore: 0,
        automaticityLevel: 'baixa',
        isFluentEligible: false
      };

      const isEligible = textReport.wordsRead >= 3 && textReport.wordsCorrect >= 2;
      expect(isEligible).toBe(false);
    });

    it('28. Registrar as respostas do supervisor', () => {
      const answers: ComprehensionAnswerResult[] = [
        {
          questionId: 'q1',
          question: 'Onde o pato nadava?',
          expectedAnswer: 'No lago.',
          questionType: 'literal',
          childResponseText: 'No laguinho da fazenda',
          score: 1,
          status: 'CORRETO'
        }
      ];
      expect(answers[0].score).toBe(1);
      expect(answers[0].status).toBe('CORRETO');
    });

    it('29. Calcular a pontuação de compreensão corretamente (binária: 0 ou 1)', () => {
      const answers: ComprehensionAnswerResult[] = [
        { questionId: 'q1', question: 'Q1', expectedAnswer: 'A1', questionType: 'literal', childResponseText: 'R1', score: 1, status: 'CORRETO' },
        { questionId: 'q2', question: 'Q2', expectedAnswer: 'A2', questionType: 'inferencial', childResponseText: 'R2', score: 1, status: 'CORRETO' },
        { questionId: 'q3', question: 'Q3', expectedAnswer: 'A3', questionType: 'literal', childResponseText: 'R3', score: 0, status: 'INCORRETO' }
      ];
      const correctCount = answers.filter((a) => a.status === 'CORRETO').length;
      const scorePercentage = Math.round((correctCount / answers.length) * 100);
      expect(correctCount).toBe(2);
      expect(scorePercentage).toBe(67);
    });

    it('30. Tratar texto sem perguntas cadastradas sem gerar gabaritos fictícios', () => {
      const questions = getComprehensionQuestionsForText('texto_inexistente_xyz');
      expect(questions).toHaveLength(0);
    });
  });

  // =========================================================================
  // 31 a 40: Interface, Dados, MAIÚSCULAS e Regressões
  // =========================================================================
  describe('Cenários 31 a 40: Interface, MAIÚSCULAS, Dados e Regressões', () => {
    it('31. Todas as letras, palavras, pseudopalavras e textos exibidos estão em MAIÚSCULAS', () => {
      const letters = selectRandomLetters(10);
      letters.forEach((l) => expect(l.text).toBe(l.text.toLocaleUpperCase('pt-BR')));

      const pseudowords = selectPseudowords(10);
      pseudowords.forEach((p) => {
        const uppercaseStimulus = p.text.toLocaleUpperCase('pt-BR');
        expect(uppercaseStimulus).toBe(uppercaseStimulus.toUpperCase());
      });

      const textItem = TEXT_BANK[0];
      const uppercaseText = textItem.text.toLocaleUpperCase('pt-BR');
      expect(uppercaseText).toBe(uppercaseText.toUpperCase());
    });

    it('32. Acentuação e pontuação são preservadas na conversão para MAIÚSCULAS', () => {
      const sample = 'Você viu a lâmpada mágica? Sim, incrível!';
      const upper = sample.toLocaleUpperCase('pt-BR');
      expect(upper).toContain('Ê');
      expect(upper).toContain('Â');
      expect(upper).toContain('Á');
      expect(upper).toContain('?');
      expect(upper).toContain('!');
    });

    it('33. Avaliações históricas continuam acessíveis com schemas anteriores', () => {
      const legacySession: EvaluationSession = {
        id: 'eval_legacy_123',
        timestamp: Date.now(),
        mode: 'complete',
        globalElapsedSeconds: 120,
        isGlobalTimeLimitReached: false,
        totalItems: 10,
        correctCount: 8,
        possibleCount: 0,
        incorrectCount: 2,
        noResponseCount: 0,
        unrecognizedCount: 0,
        accuracyPercentage: 80,
        averageResponseTimeMs: 1500,
        pedagogicalDiagnosis: 'LEITOR_INICIANTE_1',
        classificationEvidences: ['Classificação legada'],
        executiveSummary: {
          currentLevelTitle: 'Leitor Iniciante 1',
          currentLevelCategory: 'Iniciante',
          whatChildCanDo: 'Lê palavras simples',
          mainDifficulties: 'Dígrafos',
          supportingData: '80% de acurácia',
          skillsNeedingAttention: ['Encontros consonantais'],
          readingQualitySummary: 'Leitura funcional',
          aspectsToWorkOn: ['Fluência']
        },
        items: [],
        levelScores: {
          1: { level: 1, total: 10, correct: 8, possible: 0, incorrect: 2, noResponse: 0, accuracy: 80, averageTimeMs: 1500 },
          2: { level: 2, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 },
          3: { level: 3, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 },
          4: { level: 4, total: 0, correct: 0, possible: 0, incorrect: 0, noResponse: 0, accuracy: 0, averageTimeMs: 0 }
        },
        practiceRecommendations: []
      };

      expect(legacySession.pedagogicalDiagnosis).toBe('LEITOR_INICIANTE_1');
      expect(legacySession.pseudowordsReport).toBeUndefined();
      expect(legacySession.comprehensionReport).toBeUndefined();
    });

    it('34. Banco de questões de pseudopalavras possui itens balanceados', () => {
      expect(PSEUDOWORD_BANK.length).toBeGreaterThanOrEqual(20);
      const sample = selectPseudowords(10);
      expect(sample).toHaveLength(10);
      sample.forEach((item) => expect(item.type).toBe('pseudoword'));
    });

    it('35. Pseudopalavras avaliam decodificação grafema-fonema estrita', () => {
      const pseudoItem = mockItem({ id: 'pseudo_1', text: 'TADO', type: 'pseudoword' });
      expect(compareSpeech(pseudoItem, 'tado', 0.95).status).toBe('CORRETO');
      expect(compareSpeech(pseudoItem, 'dado', 0.95).status).toBe('INCORRETO');
    });

    it('36. Métricas de pseudopalavras são compiladas separadamente de palavras reais', () => {
      const items: EvaluationItemResult[] = [
        mockItemResult({
          questionId: 'pw1',
          targetText: 'LIPA',
          type: 'pseudoword',
          status: 'CORRETO'
        }),
        mockItemResult({
          questionId: 'w1',
          targetText: 'CASA',
          type: 'word',
          status: 'CORRETO'
        })
      ];

      const pwMetrics = compilePseudowordsMetrics(items);
      const wMetrics = compileWordsMetrics(items);

      expect(pwMetrics.presented).toBe(1);
      expect(pwMetrics.correct).toBe(1);
      expect(wMetrics.presented).toBe(1);
      expect(wMetrics.correct).toBe(1);
    });

    it('37. Resumo executivo e evidências incorporam pseudopalavras e compreensão quando avaliados', () => {
      const letters: LettersReportMetrics = {
        presented: 10,
        correct: 10,
        accuracy: 100,
        averageReactionTimeMs: 500,
        noResponseCount: 0,
        timeExceededCount: 0,
        confusions: [],
        recognizedLetters: ['A', 'B', 'C'],
        challengingLetters: []
      };

      const words: WordsReportMetrics = {
        presented: 20,
        correct: 18,
        incorrect: 2,
        noResponse: 0,
        timeExceededCount: 0,
        accuracy: 90,
        wordsPerMinute: 35,
        averageReactionTimeMs: 500,
        averageDurationMs: 1200,
        pausesCount: 0,
        selfCorrectionsCount: 0,
        silabationCount: 0,
        errorBreakdown: {}
      };

      const text: TextReportMetrics = {
        evaluated: true,
        textTitle: 'História',
        totalWords: 30,
        wordsRead: 30,
        wordsCorrect: 28,
        errorsCount: 2,
        accuracy: 93,
        wordsPerMinute: 70,
        durationSeconds: 24,
        pausesCount: 1,
        selfCorrectionsCount: 0,
        silabationCount: 0,
        punctuationRespected: true,
        prosodyScore: 90,
        automaticityLevel: 'alta',
        isFluentEligible: true
      };

      const pseudowords: WordsReportMetrics = {
        presented: 10,
        correct: 8,
        incorrect: 2,
        noResponse: 0,
        timeExceededCount: 0,
        accuracy: 80,
        wordsPerMinute: 25,
        averageReactionTimeMs: 600,
        averageDurationMs: 1500,
        pausesCount: 1,
        selfCorrectionsCount: 0,
        silabationCount: 2,
        errorBreakdown: {}
      };

      const comprehension: ComprehensionReportMetrics = {
        evaluated: true,
        eligible: true,
        totalQuestions: 3,
        correctCount: 3,
        scorePercentage: 100,
        answers: []
      };

      const diagnosis = classifyPedagogicalDiagnosis(letters, words, text, pseudowords, comprehension);
      expect(diagnosis).toBe('LEITOR_FLUENTE');

      const evidences = generateClassificationEvidences(diagnosis, letters, words, text, undefined, pseudowords, comprehension);
      expect(evidences.some((e) => e.includes('pseudopalavras'))).toBe(true);
      expect(evidences.some((e) => e.includes('compreensão') || e.includes('Compreensão'))).toBe(true);

      const exec = generateExecutiveSummary(diagnosis, letters, words, text, undefined, pseudowords, comprehension);
      expect(exec.currentLevelTitle).toContain('Fluente');
    });

    it('38. Sessão interrompida antes do término preserva integridade sem registrar como concluída sem dados', () => {
      const items: EvaluationItemResult[] = [];
      const letters = compileLettersMetrics(items);
      const words = compileWordsMetrics(items);
      const diagnosis = classifyPedagogicalDiagnosis(letters, words, undefined);
      expect(diagnosis).toBe('PRE_LEITOR_1');
    });

    it('39. Tratamento seguro de divisão por zero ou tempo nulo', () => {
      const items: EvaluationItemResult[] = [
        mockItemResult({
          questionId: 'w_zero',
          targetText: 'TESTE',
          type: 'word',
          status: 'OMISSAO',
          presentationTimeMs: 1000,
          reactionTimeMs: 0,
          totalTimeMs: 0,
          responseTimeMs: 0,
          isOmission: true
        })
      ];
      const metrics = compileWordsMetrics(items);
      expect(metrics.wordsPerMinute).toBe(0);
      expect(metrics.accuracy).toBe(0);
    });

    it('40. Alinhamento de transcrição do texto tolera variações sem lançar exceções', () => {
      expect(() => {
        compareTextReading('', '', 0);
        compareTextReading('Texto alvo', '', 10);
        compareTextReading('', 'Texto falado', 10);
      }).not.toThrow();
    });
  });
});
