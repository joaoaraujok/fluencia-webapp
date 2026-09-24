import { describe, it, expect } from 'vitest';
import {
  QUESTION_BANK,
  getQuestionsByLevel,
  selectEvaluationItems
} from '../data/questionBank';

describe('Banco de Questões e Randomizador (questionBank)', () => {
  it('deve possuir mais de 200 itens catalogados', () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(200);
  });

  it('deve possuir questões em todos os 4 níveis de dificuldade', () => {
    const n1 = getQuestionsByLevel(1);
    const n2 = getQuestionsByLevel(2);
    const n3 = getQuestionsByLevel(3);
    const n4 = getQuestionsByLevel(4);

    expect(n1.length).toBeGreaterThanOrEqual(40);
    expect(n2.length).toBeGreaterThanOrEqual(40);
    expect(n3.length).toBeGreaterThanOrEqual(40);
    expect(n4.length).toBeGreaterThanOrEqual(20);
  });

  it('deve conter todos os itens iniciais exigidos pelo usuário', () => {
    const allTexts = QUESTION_BANK.map(q => q.text);

    // Nível 1
    const n1Required = ['BOLA', 'PATO', 'BOCA', 'MALA', 'DADO', 'SAPO', 'VACA', 'LUA', 'PIPA', 'GATO', 'BOLO', 'FADA', 'SUCO', 'VELA', 'RATO'];
    n1Required.forEach(w => expect(allTexts).toContain(w));

    // Nível 2
    const n2Required = ['PIPOCA', 'BONECA', 'PANELA', 'MACACO', 'SACOLA', 'CAVALO', 'TOMATE', 'PETECA', 'CAMELO', 'BATATA', 'TUCANO', 'JANELA', 'SALADA', 'BANANA', 'TAPETE'];
    n2Required.forEach(w => expect(allTexts).toContain(w));

    // Nível 3
    const n3Required = ['PORTA', 'URSO', 'CHUVA', 'LEÃO', 'BARCO', 'FLOR', 'CHAVE', 'CIRCO', 'NINHO', 'PRATO', 'PEIXE', 'MILHO', 'COBRA', 'TINTA', 'FESTA'];
    n3Required.forEach(w => expect(allTexts).toContain(w));

    // Nível 4
    const n4Required = [
      'O SAPO PULA.',
      'A BOLA CAIU.',
      'O PATO NADA NO LAGO.',
      'O GATO BEBE LEITE.',
      'A MENINA COME PIPOCA.',
      'O SOL BRILHA NO CÉU.',
      'O MACACO COME BANANA.',
      'A BORBOLETA É AZUL.',
      'O MENINO TOCA O SINO.'
    ];
    n4Required.forEach(f => expect(allTexts).toContain(f));
  });

  it('NÃO deve conter itens repetidos na mesma avaliação', () => {
    const selected = selectEvaluationItems('complete', 10);
    const ids = selected.map(i => i.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(selected.length);
  });

  it('deve balancear os 4 níveis em sequência na avaliação completa (Nível 1 -> 2 -> 3 -> 4)', () => {
    const selected = selectEvaluationItems('complete', 5);
    expect(selected.length).toBe(20); // 5 x 4 = 20

    // Verifica se os primeiros são do Nível 1, depois 2, depois 3, depois 4
    const levels = selected.map(s => s.level);
    expect(levels.slice(0, 5).every(l => l === 1)).toBe(true);
    expect(levels.slice(5, 10).every(l => l === 2)).toBe(true);
    expect(levels.slice(10, 15).every(l => l === 3)).toBe(true);
    expect(levels.slice(15, 20).every(l => l === 4)).toBe(true);
  });

  it('deve selecionar itens apenas do nível escolhido em avaliação individual', () => {
    const selectedN1 = selectEvaluationItems(1, 10);
    expect(selectedN1.length).toBe(10);
    expect(selectedN1.every(i => i.level === 1)).toBe(true);

    const selectedN4 = selectEvaluationItems(4, 5);
    expect(selectedN4.length).toBe(5);
    expect(selectedN4.every(i => i.level === 4)).toBe(true);
  });

  it('deve produzir ordens aleatórias diferentes em chamadas consecutivas (Fisher-Yates)', () => {
    const run1 = selectEvaluationItems(1, 15).map(i => i.id).join(',');
    const run2 = selectEvaluationItems(1, 15).map(i => i.id).join(',');

    // A probabilidade de duas sequências de 15 itens serem idênticas é insignificante (1/15!)
    expect(run1).not.toBe(run2);
  });
});
