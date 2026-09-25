export type FontSizeSetting = 'normal' | 'large' | 'extralarge';
export type SpeechToleranceSetting = 'standard' | 'lenient';

export interface AppSettings {
  id?: string;
  // --- Limites e Tempos Pedagógicos da Avaliação Adaptativa (Oficiais 2026) ---
  globalTimeLimitSec: number;        // Limite global da avaliação (padrão: 240s = 4 minutos)
  durationLetterSec: number;         // Etapa 1: Reconhecimento de letras (padrão: 10s)
  durationWordSec: number;           // Etapa 2: Palavras isoladas (padrão: 10s)
  durationTextSec: number;           // Etapa 3: Leitura de texto em contexto (padrão: 60s)
  durationPhraseSec: number;         // Etapa 4: Prosódia em frases (padrão: 15s)
  maxTestItems: number;              // Limite máximo de itens por bateria (padrão: 30)
  itemsPerLevel: number;             // Quantidade por subnível na etapa de palavras (padrão: 10)

  // --- Reconhecimento de Fala & Acessibilidade Pedagógica ---
  speechTolerance: SpeechToleranceSetting; // 'standard' (rigoroso) ou 'lenient' (flexível para alfabetização)
  phoneticSupportEnabled: boolean;   // Método fônico: aceita palavras âncora ("B de bola" ou "bola" para B)
  autoAdvance: boolean;              // Avançar automaticamente ao reconhecer a resposta correta
  silentModeDuringSpeech: boolean;   // Silêncio absoluto do sistema durante a fala para não poluir áudio
  educatorManualControls: boolean;   // Exibir botões de auxílio pedagógico ("Acertou", "Errou", "Pular") para o educador

  // --- Interface e Áudio ---
  fontSize: FontSizeSetting;         // 'normal', 'large', 'extralarge'
  soundEnabled: boolean;             // Bipes de contagem 3-2-1 e alertas sonoros suaves
  
  // --- Metadados e Versionamento Oficial ---
  evaluationCriteriaVersion: string; // Versão dos critérios pedagógicos (ex: '2026.1')

  // --- Campos de Compatibilidade Retroativa ---
  wordDurationSec?: number;
  phraseDurationSec?: number;
  durationSimpleWordSec?: number;
  durationMediumWordSec?: number;
  durationComplexWordSec?: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'current_settings',
  globalTimeLimitSec: 240,       // 4 minutos oficiais (Regra 3)
  durationLetterSec: 10,         // 10s oficiais para letras (Etapa 1)
  durationWordSec: 10,           // 10s oficiais para palavras isoladas (Etapa 2)
  durationTextSec: 60,           // 60s oficiais para leitura de texto narrativo (Etapa 3)
  durationPhraseSec: 15,         // 15s oficiais para frases curtas (Etapa 4)
  maxTestItems: 30,              // Máximo oficial de 30 itens na jornada completa
  itemsPerLevel: 10,
  speechTolerance: 'standard',
  phoneticSupportEnabled: true,  // Apoio ao método fônico infantil ativado por padrão
  autoAdvance: true,
  silentModeDuringSpeech: true,
  educatorManualControls: true,  // Botões de apoio rápido do educador ativados
  fontSize: 'large',
  soundEnabled: true,
  evaluationCriteriaVersion: '2026.1',

  // Compatibilidade com acessos legados:
  wordDurationSec: 10,
  phraseDurationSec: 15,
  durationSimpleWordSec: 10,
  durationMediumWordSec: 10,
  durationComplexWordSec: 10
};
