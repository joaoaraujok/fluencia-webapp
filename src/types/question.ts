export type DifficultyLevel = 1 | 2 | 3 | 4;

export type PedagogicalLevel = 'PRE_LEITOR' | 'LEITOR';

export type PedagogicalDiagnosis =
  | 'PRE_LEITOR_1'        // Não identificou letras de maneira suficiente (< 10 letras)
  | 'PRE_LEITOR_2'        // Identificou 10+ letras, mas não lê palavras (< 1 palavra correta)
  | 'PRE_LEITOR_3'        // Leu de 1 a 10 palavras isoladas
  | 'LEITOR_INICIANTE_1'  // Leu de 11 a 20 palavras isoladas em 60s
  | 'LEITOR_INICIANTE_2'  // Leu 21+ palavras em 60s, mas não atingiu fluência no texto
  | 'LEITOR_FLUENTE';     // >= 65 PCPM no texto, > 90% acurácia, pontuação e prosódia

export type ItemType = 'letter' | 'word' | 'text' | 'phrase' | 'syllable';

export type SyllableStructure =
  | 'canonical_cv_cv'         // Dissílabas simples (ex: BOLA, PATO)
  | 'canonical_cv_cv_cv'      // Trissílabas simples (ex: PIPOCA, BONECA)
  | 'complex_cvc'             // Sílaba com consoante travada (ex: PORTA, URSO, BARCO)
  | 'complex_ccv'             // Encontro consonantal (ex: PRATO, TIGRE, CLUBE)
  | 'digraph_ch'              // Dígrafo CH (ex: CHUVA, CHAVE)
  | 'digraph_lh'              // Dígrafo LH (ex: MILHO, FOLHA)
  | 'digraph_nh'              // Dígrafo NH (ex: NINHO, LINHA)
  | 'cluster_r'               // Encontros com R (PR, TR, BR, CR, FR, DR, GR)
  | 'cluster_l'               // Encontros com L (PL, BL, CL, FL, GL)
  | 'nasal_vowel'             // Vogais nasais com til ou m/n (ex: LEÃO, TINTA)
  | 'phrase_short';           // Pequenas frases

export type SemanticCategory =
  | 'animais'
  | 'alimentos'
  | 'objetos'
  | 'natureza'
  | 'brinquedos'
  | 'corpo'
  | 'cotidiano'
  | 'acao';

export interface QuestionItem {
  id: string;
  text: string;
  level: DifficultyLevel;
  type: ItemType;
  syllablesCount: number;
  syllableStructure: SyllableStructure | string;
  targetPhonemes?: string[];
  category: SemanticCategory | string;
  difficulty?: number;
  active?: boolean;
  order?: number;
}

export interface LevelInfo {
  level: DifficultyLevel;
  pedagogicalKey: PedagogicalLevel;
  title: string;
  subtitle: string;
  description: string;
  defaultDurationSec: number;
  badgeColor: string;
  iconName: string;
}
