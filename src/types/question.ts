export type DifficultyLevel = 1 | 2 | 3 | 4;

export type ItemType = 'word' | 'phrase';

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
  syllableStructure: SyllableStructure;
  targetPhonemes?: string[];
  category: SemanticCategory;
}

export interface LevelInfo {
  level: DifficultyLevel;
  title: string;
  subtitle: string;
  description: string;
  defaultDurationSec: number;
  badgeColor: string;
  iconName: string;
}
