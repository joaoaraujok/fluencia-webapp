import { DifficultyLevel, LevelInfo, QuestionItem } from '../types/question';

export const LEVEL_DEFINITIONS: Record<DifficultyLevel, LevelInfo> = {
  1: {
    level: 1,
    title: 'Nível 1 — Inicial',
    subtitle: 'Palavras dissílabas canônicas',
    description: 'Palavras simples de duas sílabas consoante-vogal (CV-CV), ideais para o início da avaliação.',
    defaultDurationSec: 3,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconName: 'Baby'
  },
  2: {
    level: 2,
    title: 'Nível 2 — Intermediário 1',
    subtitle: 'Palavras trissílabas canônicas',
    description: 'Palavras de três sílabas canônicas (CV-CV-CV) para avaliar ritmo e coordenação articulatória.',
    defaultDurationSec: 3,
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    iconName: 'Sparkles'
  },
  3: {
    level: 3,
    title: 'Nível 3 — Intermediário 2',
    subtitle: 'Estruturas complexas e dígrafos',
    description: 'Palavras com dígrafos (CH, LH, NH) e encontros consonantais (PR, TR, BL, etc.).',
    defaultDurationSec: 3,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    iconName: 'Flame'
  },
  4: {
    level: 4,
    title: 'Nível 4 — Avançado',
    subtitle: 'Pequenas frases',
    description: 'Frases curtas para avaliar prosódia, cadência e fluência no contexto discursivo.',
    defaultDurationSec: 5,
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
    iconName: 'BookOpen'
  }
};

export const QUESTION_BANK: QuestionItem[] = [
  // ==========================================
  // NÍVEL 1: DISSÍLABAS CANÔNICAS (CV-CV) - 3s
  // ==========================================
  // Itens obrigatórios
  { id: 'n1_001', text: 'BOLA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_002', text: 'PATO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_003', text: 'BOCA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'corpo' },
  { id: 'n1_004', text: 'MALA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_005', text: 'DADO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_006', text: 'SAPO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_007', text: 'VACA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_008', text: 'LUA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza' },
  { id: 'n1_009', text: 'PIPA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_010', text: 'GATO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_011', text: 'BOLO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'alimentos' },
  { id: 'n1_012', text: 'FADA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_013', text: 'SUCO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'alimentos' },
  { id: 'n1_014', text: 'VELA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_015', text: 'RATO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },

  // Itens expandidos Nível 1
  { id: 'n1_016', text: 'CASA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_017', text: 'FOGO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza' },
  { id: 'n1_018', text: 'MESA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_019', text: 'LIXO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_020', text: 'SOFÁ', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_021', text: 'NAVE', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_022', text: 'BULE', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_023', text: 'BEBÊ', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_024', text: 'DEDO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'corpo' },
  { id: 'n1_025', text: 'RODA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_026', text: 'BICO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_027', text: 'TATU', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_028', text: 'MOTO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_029', text: 'LOBO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_030', text: 'COPO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_031', text: 'FITA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_032', text: 'BOTA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_033', text: 'CABO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_034', text: 'FIGO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'alimentos' },
  { id: 'n1_035', text: 'LATA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_036', text: 'MEIA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_037', text: 'SACO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_038', text: 'TELA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_039', text: 'VOTO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_040', text: 'ZERO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_041', text: 'POTE', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_042', text: 'VILA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_043', text: 'DAMA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_044', text: 'GOLA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_045', text: 'JUBA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais' },
  { id: 'n1_046', text: 'LAMA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza' },
  { id: 'n1_047', text: 'NETA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_048', text: 'PINO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos' },
  { id: 'n1_049', text: 'RALO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_050', text: 'SINO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_051', text: 'TOCA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza' },
  { id: 'n1_052', text: 'GOTA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza' },
  { id: 'n1_053', text: 'JATO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_054', text: 'LONA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_055', text: 'MURO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_056', text: 'NOVO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_057', text: 'POVO', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_058', text: 'REDE', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos' },
  { id: 'n1_059', text: 'SOPA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'alimentos' },
  { id: 'n1_060', text: 'TIME', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },
  { id: 'n1_061', text: 'VARA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza' },
  { id: 'n1_062', text: 'ZAGA', level: 1, type: 'word', syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano' },

  // ==========================================
  // NÍVEL 2: TRISSÍLABAS CANÔNICAS (CV-CV-CV) - 3s
  // ==========================================
  // Itens obrigatórios
  { id: 'n2_001', text: 'PIPOCA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_002', text: 'BONECA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'brinquedos' },
  { id: 'n2_003', text: 'PANELA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_004', text: 'MACACO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_005', text: 'SACOLA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_006', text: 'CAVALO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_007', text: 'TOMATE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_008', text: 'PETECA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'brinquedos' },
  { id: 'n2_009', text: 'CAMELO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_010', text: 'BATATA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_011', text: 'TUCANO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_012', text: 'JANELA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_013', text: 'SALADA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_014', text: 'BANANA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_015', text: 'TAPETE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },

  // Itens expandidos Nível 2
  { id: 'n2_016', text: 'CORUJA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_017', text: 'MENINA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_018', text: 'MENINO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_019', text: 'TIGELA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_020', text: 'GAVETA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_021', text: 'RAPOSA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_022', text: 'VACINA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_023', text: 'BUZINA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_024', text: 'CABELO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'corpo' },
  { id: 'n2_025', text: 'NOVELA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_026', text: 'BELEZA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_027', text: 'CAMISA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_028', text: 'GOIABA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_029', text: 'JABUTI', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_030', text: 'MALETA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_031', text: 'SAPATO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_032', text: 'TIJOLO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_033', text: 'VIOLETA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'natureza' },
  { id: 'n2_034', text: 'XAROPE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_035', text: 'BIGODE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'corpo' },
  { id: 'n2_036', text: 'CANECA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_037', text: 'DOMINÓ', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'brinquedos' },
  { id: 'n2_038', text: 'FAROFA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_039', text: 'GELADO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_040', text: 'JACARÉ', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_041', text: 'PAGODE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_042', text: 'RECIBO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_043', text: 'SALAME', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_044', text: 'TEATRO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_045', text: 'VIZINHO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_046', text: 'XERIFE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_047', text: 'BALEIA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_048', text: 'BATUTA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_049', text: 'CABIDE', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_050', text: 'DITADO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_051', text: 'FIGURA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos' },
  { id: 'n2_052', text: 'GAROTA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_053', text: 'HÁBITO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_054', text: 'JIBOIA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_055', text: 'LAGOSTA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais' },
  { id: 'n2_056', text: 'MADEIRA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'natureza' },
  { id: 'n2_057', text: 'NAVIO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_058', text: 'PACIÊNCIA', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },
  { id: 'n2_059', text: 'QUIABO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos' },
  { id: 'n2_060', text: 'RABISCO', level: 2, type: 'word', syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'cotidiano' },

  // ==========================================
  // NÍVEL 3: ESTRUTURAS COMPLEXAS E DÍGRAFOS - 3s
  // ==========================================
  // Itens obrigatórios
  { id: 'n3_001', text: 'PORTA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['r_travado'], category: 'cotidiano' },
  { id: 'n3_002', text: 'URSO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['r_travado'], category: 'animais' },
  { id: 'n3_003', text: 'CHUVA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_ch', targetPhonemes: ['ʃ'], category: 'natureza' },
  { id: 'n3_004', text: 'LEÃO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'nasal_vowel', targetPhonemes: ['ãw'], category: 'animais' },
  { id: 'n3_005', text: 'BARCO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['r_travado'], category: 'cotidiano' },
  { id: 'n3_006', text: 'FLOR', level: 3, type: 'word', syllablesCount: 1, syllableStructure: 'cluster_l', targetPhonemes: ['fl', 'r_final'], category: 'natureza' },
  { id: 'n3_007', text: 'CHAVE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_ch', targetPhonemes: ['ʃ'], category: 'objetos' },
  { id: 'n3_008', text: 'CIRCO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['r_travado'], category: 'cotidiano' },
  { id: 'n3_009', text: 'NINHO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_nh', targetPhonemes: ['ɲ'], category: 'natureza' },
  { id: 'n3_010', text: 'PRATO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['pr'], category: 'objetos' },
  { id: 'n3_011', text: 'PEIXE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['ʃ'], category: 'animais' },
  { id: 'n3_012', text: 'MILHO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'alimentos' },
  { id: 'n3_013', text: 'COBRA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['br'], category: 'animais' },
  { id: 'n3_014', text: 'TINTA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'nasal_vowel', targetPhonemes: ['ĩ'], category: 'objetos' },
  { id: 'n3_015', text: 'FESTA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['s_travado'], category: 'cotidiano' },

  // Itens expandidos Nível 3 (Dígrafos, Encontros Consonantais R/L, CVC)
  { id: 'n3_016', text: 'FOLHA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'natureza' },
  { id: 'n3_017', text: 'GALHO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'natureza' },
  { id: 'n3_018', text: 'COELHO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'animais' },
  { id: 'n3_019', text: 'TOALHA', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'objetos' },
  { id: 'n3_020', text: 'PALHAÇO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'cotidiano' },
  { id: 'n3_021', text: 'CHOCOLATE', level: 3, type: 'word', syllablesCount: 4, syllableStructure: 'digraph_ch', targetPhonemes: ['ʃ'], category: 'alimentos' },
  { id: 'n3_022', text: 'CHINELO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_ch', targetPhonemes: ['ʃ'], category: 'objetos' },
  { id: 'n3_023', text: 'CHUVEIRO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_ch', targetPhonemes: ['ʃ'], category: 'objetos' },
  { id: 'n3_024', text: 'ILHA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_lh', targetPhonemes: ['ʎ'], category: 'natureza' },
  { id: 'n3_025', text: 'LINHA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_nh', targetPhonemes: ['ɲ'], category: 'objetos' },
  { id: 'n3_026', text: 'SONHO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'digraph_nh', targetPhonemes: ['ɲ'], category: 'cotidiano' },
  { id: 'n3_027', text: 'GOLFINHO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_nh', targetPhonemes: ['ɲ'], category: 'animais' },
  { id: 'n3_028', text: 'PASSARINHO', level: 3, type: 'word', syllablesCount: 4, syllableStructure: 'digraph_nh', targetPhonemes: ['ɲ'], category: 'animais' },
  { id: 'n3_029', text: 'TRATOR', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['tr'], category: 'cotidiano' },
  { id: 'n3_030', text: 'TIGRE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['gr'], category: 'animais' },
  { id: 'n3_031', text: 'BRAÇO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['br'], category: 'corpo' },
  { id: 'n3_032', text: 'CREME', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['kr'], category: 'alimentos' },
  { id: 'n3_033', text: 'GRADE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['gr'], category: 'objetos' },
  { id: 'n3_034', text: 'FRUTA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['fr'], category: 'alimentos' },
  { id: 'n3_035', text: 'DRAGÃO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['dr'], category: 'brinquedos' },
  { id: 'n3_036', text: 'PLANTA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['pl'], category: 'natureza' },
  { id: 'n3_037', text: 'BLUSA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['bl'], category: 'objetos' },
  { id: 'n3_038', text: 'CLUBE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['kl'], category: 'cotidiano' },
  { id: 'n3_039', text: 'GLOBO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['gl'], category: 'objetos' },
  { id: 'n3_040', text: 'FLORESTA', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'cluster_l', targetPhonemes: ['fl'], category: 'natureza' },
  { id: 'n3_041', text: 'BARBA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['r_travado'], category: 'corpo' },
  { id: 'n3_042', text: 'FORNO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['r_travado'], category: 'objetos' },
  { id: 'n3_043', text: 'BALDE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['l_travado'], category: 'objetos' },
  { id: 'n3_044', text: 'JORNAL', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['l_final'], category: 'objetos' },
  { id: 'n3_045', text: 'PASTA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['s_travado'], category: 'alimentos' },
  { id: 'n3_046', text: 'CASTELO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'complex_cvc', targetPhonemes: ['s_travado'], category: 'cotidiano' },
  { id: 'n3_047', text: 'BRINCO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['br'], category: 'objetos' },
  { id: 'n3_048', text: 'TRONCO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['tr'], category: 'natureza' },
  { id: 'n3_049', text: 'MOSCA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['s_travado'], category: 'animais' },
  { id: 'n3_050', text: 'DISCO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_cvc', targetPhonemes: ['s_travado'], category: 'objetos' },
  { id: 'n3_051', text: 'PENTE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'nasal_vowel', targetPhonemes: ['ẽ'], category: 'objetos' },
  { id: 'n3_052', text: 'VENTO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'nasal_vowel', targetPhonemes: ['ẽ'], category: 'natureza' },
  { id: 'n3_053', text: 'CAMPO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'nasal_vowel', targetPhonemes: ['ã'], category: 'natureza' },
  { id: 'n3_054', text: 'POMBA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'nasal_vowel', targetPhonemes: ['õ'], category: 'animais' },
  { id: 'n3_055', text: 'GRAMA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['gr'], category: 'natureza' },
  { id: 'n3_056', text: 'PEDRA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['dr'], category: 'natureza' },
  { id: 'n3_057', text: 'LIVRO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['vr'], category: 'objetos' },
  { id: 'n3_058', text: 'VIDRO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_r', targetPhonemes: ['dr'], category: 'objetos' },
  { id: 'n3_059', text: 'PLACA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['pl'], category: 'objetos' },
  { id: 'n3_060', text: 'FLECHA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['fl', 'ʃ'], category: 'brinquedos' },
  { id: 'n3_061', text: 'ATLETA', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'cluster_l', targetPhonemes: ['tl'], category: 'cotidiano' },
  { id: 'n3_062', text: 'CLASSE', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'cluster_l', targetPhonemes: ['kl'], category: 'cotidiano' },
  { id: 'n3_063', text: 'CACHORRO', level: 3, type: 'word', syllablesCount: 3, syllableStructure: 'digraph_ch', targetPhonemes: ['ʃ', 'rr'], category: 'animais' },
  { id: 'n3_064', text: 'CARRO', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_ccv', targetPhonemes: ['rr'], category: 'cotidiano' },
  { id: 'n3_065', text: 'TERRA', level: 3, type: 'word', syllablesCount: 2, syllableStructure: 'complex_ccv', targetPhonemes: ['rr'], category: 'natureza' },

  // ==========================================
  // NÍVEL 4: PEQUENAS FRASES - 5 a 6s
  // ==========================================
  // Itens obrigatórios
  { id: 'n4_001', text: 'O SAPO PULA.', level: 4, type: 'phrase', syllablesCount: 5, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_002', text: 'A BOLA CAIU.', level: 4, type: 'phrase', syllablesCount: 5, syllableStructure: 'phrase_short', category: 'brinquedos' },
  { id: 'n4_003', text: 'O PATO NADA NO LAGO.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_004', text: 'O GATO BEBE LEITE.', level: 4, type: 'phrase', syllablesCount: 6, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_005', text: 'A MENINA COME PIPOCA.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_006', text: 'O SOL BRILHA NO CÉU.', level: 4, type: 'phrase', syllablesCount: 6, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_007', text: 'O MACACO COME BANANA.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_008', text: 'A BORBOLETA É AZUL.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_009', text: 'O MENINO TOCA O SINO.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'cotidiano' },

  // Itens expandidos Nível 4
  { id: 'n4_010', text: 'O COELHO COME CENOURA.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_011', text: 'O CACHORRO LATE NO QUINTAL.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_012', text: 'O PEIXE NADA NO RIO.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_013', text: 'A ESTRELA BRILHA NA NOITE.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_014', text: 'A FLOR É MUITO CHEIROSA.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_015', text: 'O BEBÊ BRINCA COM O CHOCALHO.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_016', text: 'A VACA DÁ LEITE NA FAZENDA.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_017', text: 'O PASSARINHO CANTA NA ÁRVORE.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_018', text: 'O LEÃO É FORTE E VELOZ.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_019', text: 'O CARRO ANDA NA RUA.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_020', text: 'O MENINO CHUTA A BOLA.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_021', text: 'A MENINA LÊ UM LIVRO.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_022', text: 'O PÁSSARO VOA NO CÉU AZUL.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_023', text: 'O TREM ANDA NO TRILHO.', level: 4, type: 'phrase', syllablesCount: 6, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_024', text: 'A CHUVA MOLHA AS PLANTAS.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_025', text: 'O DIA ESTÁ MUITO LINDO.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_026', text: 'A MAMÃE FEZ UM BOLO GOSTOSO.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'alimentos' },
  { id: 'n4_027', text: 'O PAPAI LÊ O JORNAL.', level: 4, type: 'phrase', syllablesCount: 6, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_028', text: 'EU GOSTO DE DESENHAR.', level: 4, type: 'phrase', syllablesCount: 6, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_029', text: 'O BARCO NAVEGA NO MAR.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_030', text: 'A TARTARUGA ANDA DEVAGAR.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_031', text: 'O GATO DORME NO SOFÁ.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_032', text: 'A FORMIGA CARREGA A FOLHA.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_033', text: 'O MENINO TOMA SUCO DE UVA.', level: 4, type: 'phrase', syllablesCount: 9, syllableStructure: 'phrase_short', category: 'alimentos' },
  { id: 'n4_034', text: 'A MENINA USA UM LAÇO BONITO.', level: 4, type: 'phrase', syllablesCount: 10, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_035', text: 'O FOGO AQUECE A CASA.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_036', text: 'A LUA ILUMINA A NOITE.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'natureza' },
  { id: 'n4_037', text: 'O CIRCO CHEGOU NA CIDADE.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_038', text: 'O CAVALO CORRE NO CAMPO.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_039', text: 'A PIPA VOA NO VENTO.', level: 4, type: 'phrase', syllablesCount: 6, syllableStructure: 'phrase_short', category: 'brinquedos' },
  { id: 'n4_040', text: 'O TUCANO TEM BICO GRANDE.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_041', text: 'O RELÓGIO MARCA AS HORAS.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'cotidiano' },
  { id: 'n4_042', text: 'A SOPA ESTÁ QUENTINHA.', level: 4, type: 'phrase', syllablesCount: 7, syllableStructure: 'phrase_short', category: 'alimentos' },
  { id: 'n4_043', text: 'O ELEFANTE É MUITO GRANDE.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'animais' },
  { id: 'n4_044', text: 'A FADA TEM UMA VARINHA.', level: 4, type: 'phrase', syllablesCount: 8, syllableStructure: 'phrase_short', category: 'cotidiano' }
];

/**
 * Retorna as questões do nível especificado
 */
export function getQuestionsByLevel(level: DifficultyLevel): QuestionItem[] {
  return QUESTION_BANK.filter(q => q.level === level);
}

/**
 * Seleciona itens para uma avaliação:
 * - Se `mode` for 'complete', seleciona uma quantidade balanceada de cada um dos 4 níveis (1 -> 2 -> 3 -> 4);
 * - Se `mode` for um nível numérico (1, 2, 3 ou 4), seleciona itens daquele nível;
 * - Garante que NÃO haja repetição de itens na mesma avaliação;
 * - Faz shuffling aleatório a cada chamada (Fisher-Yates).
 */
export function selectEvaluationItems(
  mode: 'complete' | DifficultyLevel,
  itemsPerLevel: number = 10
): QuestionItem[] {
  function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  if (mode === 'complete') {
    // Avaliação completa: executa níveis 1 -> 2 -> 3 -> 4 em sequência
    const result: QuestionItem[] = [];
    const levels: DifficultyLevel[] = [1, 2, 3, 4];
    
    // Na avaliação completa, se itemsPerLevel for alto, pegamos uma quantidade razoável por nível
    const countPerLevel = itemsPerLevel > 0 ? itemsPerLevel : 10;

    for (const lvl of levels) {
      const candidates = shuffle(getQuestionsByLevel(lvl));
      const selected = candidates.slice(0, countPerLevel);
      result.push(...selected);
    }
    return result;
  } else {
    // Nível individual
    const candidates = shuffle(getQuestionsByLevel(mode));
    if (itemsPerLevel > 0 && itemsPerLevel < candidates.length) {
      return candidates.slice(0, itemsPerLevel);
    }
    return candidates;
  }
}
