import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  levenshteinDistance,
  compareSpeech,
  generatePracticeRecommendations
} from '../services/analysisEngine';
import { QuestionItem } from '../types/question';
import { EvaluationItemResult } from '../types/evaluation';

describe('Motor de Análise Fonética e Normalização (analysisEngine)', () => {
  describe('normalizeText', () => {
    it('deve converter para maiúsculas e remover acentuações', () => {
      expect(normalizeText('bola')).toBe('BOLA');
      expect(normalizeText('pato')).toBe('PATO');
      expect(normalizeText('água')).toBe('AGUA');
      expect(normalizeText('coração')).toBe('CORACAO');
      expect(normalizeText('PÉ')).toBe('PE');
      expect(normalizeText('vovô')).toBe('VOVO');
    });

    it('deve remover pontuações e normalizar espaços', () => {
      expect(normalizeText('O sapo pula.')).toBe('O SAPO PULA');
      expect(normalizeText('  A   BOLA   CAIU!  ')).toBe('A BOLA CAIU');
      expect(normalizeText('Gato, cachorro; peixe?')).toBe('GATO CACHORRO PEIXE');
    });

    it('deve lidar com strings vazias ou nulas graciosamente', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText('   ')).toBe('');
    });
  });

  describe('levenshteinDistance', () => {
    it('deve retornar 0 para strings idênticas', () => {
      expect(levenshteinDistance('BOLA', 'BOLA')).toBe(0);
      expect(levenshteinDistance('PIPOCA', 'PIPOCA')).toBe(0);
    });

    it('deve calcular a distância correta de inserções, deleções e substituições', () => {
      expect(levenshteinDistance('BOLA', 'BOLO')).toBe(1); // substituição
      expect(levenshteinDistance('PATO', 'PRATO')).toBe(1); // inserção
      expect(levenshteinDistance('PIPOCA', 'PICO')).toBe(3);
    });
  });

  describe('compareSpeech para palavras', () => {
    const itemBola: QuestionItem = {
      id: '1',
      text: 'BOLA',
      level: 1,
      type: 'word',
      syllablesCount: 2,
      syllableStructure: 'canonical_cv_cv',
      category: 'brinquedos'
    };

    const itemPipoca: QuestionItem = {
      id: '2',
      text: 'PIPOCA',
      level: 2,
      type: 'word',
      syllablesCount: 3,
      syllableStructure: 'canonical_cv_cv_cv',
      category: 'alimentos'
    };

    it('deve retornar CORRETO para fala idêntica ou equivalente normalizado', () => {
      const result1 = compareSpeech(itemBola, 'bola');
      expect(result1.status).toBe('CORRETO');

      const result2 = compareSpeech(itemBola, 'BOLA.');
      expect(result2.status).toBe('CORRETO');
    });

    it('deve retornar CORRETO se a palavra estiver contida com artigo ou palavra extra', () => {
      const result = compareSpeech(itemBola, 'é uma bola');
      expect(result.status).toBe('CORRETO');
    });

    it('deve retornar POSSIVELMENTE_CORRETO para variações mínimas em palavras trissílabas', () => {
      // Diferença de 1 letra em palavra de 6 letras (ex: 'pipoka' ou variação de transcrição)
      const result = compareSpeech(itemPipoca, 'pipoka');
      expect(result.status).toBe('POSSIVELMENTE_CORRETO');
    });

    it('deve retornar INCORRETO para palavras completamente divergentes', () => {
      const result = compareSpeech(itemBola, 'cavalo');
      expect(result.status).toBe('INCORRETO');
    });

    it('deve retornar SEM_RESPOSTA quando não houver transcrição (silêncio)', () => {
      const result = compareSpeech(itemBola, '');
      expect(result.status).toBe('SEM_RESPOSTA');

      const resultSpaces = compareSpeech(itemBola, '   ');
      expect(resultSpaces.status).toBe('SEM_RESPOSTA');
    });

    it('deve retornar ERRO_TECNICO quando a flag técnica for informada', () => {
      const result = compareSpeech(itemBola, '', 0, true);
      expect(result.status).toBe('ERRO_TECNICO');
    });
  });

  describe('compareSpeech para frases', () => {
    const itemFrase: QuestionItem = {
      id: 'f1',
      text: 'O SAPO PULA.',
      level: 4,
      type: 'phrase',
      syllablesCount: 5,
      syllableStructure: 'phrase_short',
      category: 'animais'
    };

    it('deve retornar CORRETO quando a frase inteira for dita', () => {
      const result = compareSpeech(itemFrase, 'o sapo pula');
      expect(result.status).toBe('CORRETO');
    });

    it('deve retornar POSSIVELMENTE_CORRETO quando a maior parte das palavras for dita', () => {
      // 2 de 3 palavras ditas = 66%
      const result = compareSpeech(itemFrase, 'sapo pula');
      expect(result.status).toBe('POSSIVELMENTE_CORRETO');
    });

    it('deve retornar INCORRETO quando apenas uma palavra ou frase errada for dita', () => {
      const result = compareSpeech(itemFrase, 'o gato dorme');
      expect(result.status).toBe('INCORRETO');
    });
  });

  describe('generatePracticeRecommendations', () => {
    it('deve parabenizar quando todos os itens forem corretos sem inventar dificuldades', () => {
      const correctItems: EvaluationItemResult[] = [
        {
          questionId: '1',
          targetText: 'BOLA',
          level: 1,
          type: 'word',
          syllableStructure: 'canonical_cv_cv',
          category: 'brinquedos',
          transcript: 'bola',
          status: 'CORRETO',
          responseTimeMs: 1200,
          availableTimeMs: 10000,
          confidence: 1.0
        }
      ];

      const recs = generatePracticeRecommendations(correctItems);
      expect(recs.length).toBe(1);
      expect(recs[0].id).toBe('rec_excellence');
    });

    it('deve gerar recomendação do som do CH quando houver itens incorretos com CH', () => {
      const itemsWithCH: EvaluationItemResult[] = [
        {
          questionId: 'c1',
          targetText: 'CHUVA',
          level: 3,
          type: 'word',
          syllableStructure: 'digraph_ch',
          category: 'natureza',
          transcript: 'tuva',
          status: 'INCORRETO',
          responseTimeMs: 2500,
          availableTimeMs: 10000,
          confidence: 0.8
        }
      ];

      const recs = generatePracticeRecommendations(itemsWithCH);
      expect(recs.some(r => r.id === 'rec_digraph_ch')).toBe(true);
      expect(recs.find(r => r.id === 'rec_digraph_ch')?.recommendedExamples).toContain('CHUVA');
    });

    it('deve gerar recomendação para encontros consonantais com R quando houver desafio em palavras com R', () => {
      const itemsWithR: EvaluationItemResult[] = [
        {
          questionId: 'r1',
          targetText: 'PRATO',
          level: 3,
          type: 'word',
          syllableStructure: 'cluster_r',
          category: 'objetos',
          transcript: 'pato',
          status: 'INCORRETO',
          responseTimeMs: 2200,
          availableTimeMs: 10000,
          confidence: 0.9
        }
      ];

      const recs = generatePracticeRecommendations(itemsWithR);
      expect(recs.some(r => r.id === 'rec_cluster_r')).toBe(true);
    });
  });

  describe('Adaptações para Educação Infantil e Prevenção de Repetição no Celular', () => {
    const itemBola: QuestionItem = {
      id: '1',
      text: 'BOLA',
      level: 1,
      type: 'word',
      syllablesCount: 2,
      syllableStructure: 'canonical_cv_cv',
      category: 'brinquedos'
    };

    const itemPato: QuestionItem = {
      id: '2',
      text: 'PATO',
      level: 1,
      type: 'word',
      syllablesCount: 2,
      syllableStructure: 'canonical_cv_cv',
      category: 'animais'
    };

    const itemChuva: QuestionItem = {
      id: '3',
      text: 'CHUVA',
      level: 3,
      type: 'word',
      syllablesCount: 2,
      syllableStructure: 'digraph_ch',
      category: 'natureza'
    };

    it('deve reconhecer como CORRETO repetições geradas pelo buffer no celular ("BOLA BOLA BOLA")', () => {
      const result = compareSpeech(itemBola, 'bola bola bola');
      expect(result.status).toBe('CORRETO');
    });

    it('deve aceitar diminutivos carinhosos comuns da infância ("bolinha", "patinho")', () => {
      const resBolinha = compareSpeech(itemBola, 'bolinha');
      expect(resBolinha.status).toBe('CORRETO');
      expect(resBolinha.observedError).toContain('diminutivo');

      const resPatinho = compareSpeech(itemPato, 'é um patinho');
      expect(resPatinho.status).toBe('CORRETO');
    });

    it('deve reconhecer homófonos fonéticos exatos como CH <-> X ("xuva" para "CHUVA")', () => {
      const result = compareSpeech(itemChuva, 'xuva');
      expect(result.status).toBe('CORRETO');
    });
  });
});
