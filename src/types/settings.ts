export type FontSizeSetting = 'normal' | 'large' | 'extralarge';

export interface AppSettings {
  id?: string;
  itemsPerLevel: number; // 5, 10, 15 ou 0 (todas)
  wordDurationSec: number; // padrão 3s
  phraseDurationSec: number; // padrão 5–6s
  soundEnabled: boolean;
  fontSize: FontSizeSetting;
  speechTolerance: 'standard' | 'lenient'; // leniente para crianças menores
  autoAdvance: boolean; // padrão true
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'current_settings',
  itemsPerLevel: 10,
  wordDurationSec: 3,
  phraseDurationSec: 5,
  soundEnabled: true,
  fontSize: 'large',
  speechTolerance: 'standard',
  autoAdvance: true
};
