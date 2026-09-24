import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  Sliders,
  Type,
  Trash2,
  Clock,
  Check,
  Activity,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { AppSettings, FontSizeSetting } from '../../types/settings';
import { clearAllEvaluations } from '../../services/db';
import { speechService } from '../../services/speechService';
import { audioService } from '../../services/audioService';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings
}) => {
  const [itemsPerLevel, setItemsPerLevel] = useState<number>(settings.itemsPerLevel);
  const [wordDurationSec, setWordDurationSec] = useState<number>(settings.wordDurationSec);
  const [phraseDurationSec, setPhraseDurationSec] = useState<number>(settings.phraseDurationSec);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled);
  const [fontSize, setFontSize] = useState<FontSizeSetting>(settings.fontSize);

  // Calibração e Teste de Microfone
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micHeard, setMicHeard] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);

  // Sincroniza com as configurações passadas quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setItemsPerLevel(settings.itemsPerLevel);
      setWordDurationSec(settings.wordDurationSec);
      setPhraseDurationSec(settings.phraseDurationSec);
      setSoundEnabled(settings.soundEnabled);
      setFontSize(settings.fontSize);
      setMicTesting(false);
      setMicVolume(0);
      setMicHeard('');
      setMicError(null);
    }
  }, [isOpen, settings]);

  // Limpeza de recursos de áudio ao fechar
  useEffect(() => {
    return () => {
      audioService.stopMicMonitoring();
      speechService.abort();
    };
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    audioService.stopMicMonitoring();
    speechService.abort();
    setMicTesting(false);

    onSaveSettings({
      itemsPerLevel,
      wordDurationSec,
      phraseDurationSec,
      soundEnabled,
      fontSize
    });
    onClose();
  };

  const handleClose = () => {
    audioService.stopMicMonitoring();
    speechService.abort();
    setMicTesting(false);
    onClose();
  };

  const handleToggleMicTest = async () => {
    if (micTesting) {
      audioService.stopMicMonitoring();
      speechService.stopListening();
      setMicTesting(false);
      setMicVolume(0);
      return;
    }

    setMicError(null);
    setMicHeard('');
    setMicVolume(0);

    // 1. Inicia o monitoramento de decibéis/volume da voz em tempo real
    const monitorResult = await audioService.startMicMonitoring((volume) => {
      setMicVolume(volume);
    });

    if (!monitorResult.success) {
      setMicError(monitorResult.error || 'Não foi possível acessar o microfone.');
      return;
    }

    setMicTesting(true);

    // 2. Inicia reconhecimento de fala simultâneo
    speechService.startListening(
      (transcript) => {
        setMicHeard(transcript);
      },
      (listening) => {
        if (!listening && !micTesting) {
          audioService.stopMicMonitoring();
          setMicTesting(false);
        }
      },
      (err) => {
        console.warn('Erro de reconhecimento durante teste:', err);
        if (err === 'not-allowed') {
          setMicError('Acesso ao microfone bloqueado no navegador.');
          audioService.stopMicMonitoring();
          setMicTesting(false);
        }
      }
    );
  };

  const handleClearHistory = async () => {
    if (confirm('Tem certeza de que deseja apagar todo o histórico local?')) {
      await clearAllEvaluations();
      alert('Histórico apagado com sucesso.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-xl">
        {/* Cabeçalho do Modal com Respiro e Ícone Agradável */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
                Configurações da Avaliação
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Personalize ritmo, tempos, exibição e calibre o microfone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Blocos Arejados e Bem Espaçados */}
        <div className="space-y-6">
          {/* BLOCO 1: Quantidade de Palavras por Nível */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Quantidade de Itens por Nível</span>
              </label>
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                {itemsPerLevel === 0 ? 'Todas as questões' : `${itemsPerLevel} palavras`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { val: 5, label: '5 itens' },
                { val: 10, label: '10 itens' },
                { val: 15, label: '15 itens' },
                { val: 0, label: 'Todas' }
              ].map(({ val, label }) => {
                const isSelected = itemsPerLevel === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setItemsPerLevel(val)}
                    style={{
                      backgroundColor: isSelected ? '#4F46E5' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      borderColor: isSelected ? '#4F46E5' : '#CBD5E1'
                    }}
                    className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-1.5 text-center shadow-xs cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-indigo-300 ring-offset-1'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 pt-0.5 leading-relaxed">
              {itemsPerLevel === 0 ? (
                <span>Apresentará <strong>todas as palavras e frases cadastradas</strong> no banco de dados.</span>
              ) : (
                <span>Sorteará <strong>{itemsPerLevel} palavras ou frases</strong> balanceadas por etapa de teste.</span>
              )}
            </p>
          </div>

          {/* BLOCO 2: Tempos de Exibição */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Tempo de Resposta na Tela</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-600">
                  Palavras (Níveis 1, 2 e 3)
                </span>
                <select
                  value={wordDurationSec}
                  onChange={(e) => setWordDurationSec(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
                >
                  <option value={2}>2 segundos (Rápido)</option>
                  <option value={3}>3 segundos (Padrão)</option>
                  <option value={4}>4 segundos (Amplo)</option>
                  <option value={5}>5 segundos (Estendido)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-600">
                  Frases (Nível 4)
                </span>
                <select
                  value={phraseDurationSec}
                  onChange={(e) => setPhraseDurationSec(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
                >
                  <option value={4}>4 segundos</option>
                  <option value={5}>5 segundos (Padrão)</option>
                  <option value={6}>6 segundos (Recomendado)</option>
                  <option value={7}>7 segundos (Estendido)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BLOCO 3: Tamanho da Fonte */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-4 h-4 text-indigo-600" />
              <span>Tamanho das Palavras na Tela</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Grande (Padrão)' },
                { id: 'extralarge', label: 'Extra Grande' }
              ].map((f) => {
                const isSelected = fontSize === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontSize(f.id as FontSizeSetting)}
                    style={{
                      backgroundColor: isSelected ? '#4F46E5' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      borderColor: isSelected ? '#4F46E5' : '#CBD5E1'
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all text-center flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-indigo-300 ring-offset-1'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BLOCO 4: Calibração em Tempo Real do Microfone (VU Meter) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block leading-tight">
                    Calibração do Microfone
                  </span>
                  <span className="text-[11px] text-indigo-700/80 font-medium">
                    Teste o volume e reconhecimento antes de iniciar
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleMicTest}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                  micTesting
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {micTesting ? 'Parar Teste' : 'Testar Escuta'}
              </button>
            </div>

            {/* Painel Interativo de Teste em Andamento */}
            {micTesting ? (
              <div className="p-3.5 rounded-xl bg-white border border-indigo-200 space-y-3 animate-fadeIn shadow-2xs">
                {/* VU Meter Visual (Barra de Volume) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-indigo-600">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Nível de captação de voz:
                    </span>
                    <span className="tabular-nums font-black text-slate-900">
                      {micVolume}%
                    </span>
                  </div>

                  {/* Barra Progressiva Multicolorida */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        micVolume > 60
                          ? 'bg-amber-500'
                          : micVolume > 15
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.max(4, micVolume)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Transcrição de Voz Detectada */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                  {micHeard ? (
                    <div className="text-slate-800">
                      🎙️ Reconhecido: <strong className="text-indigo-600 font-black">"{micHeard}"</strong>
                    </div>
                  ) : (
                    <div className="text-indigo-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span>Fale algo agora perto do microfone...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : micError ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{micError}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Clique no botão para verificar se o microfone do seu aparelho está captando som com clareza.
              </p>
            )}
          </div>

          {/* BLOCO 5: Sons e Efeitos Suaves */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 transition-all hover:bg-slate-100/60">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">Sons e Efeitos Suaves</div>
                <div className="text-xs text-slate-500">Bips da contagem 3-2-1 e encerramento</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* BLOCO 6: Limpeza de Dados do Aplicativo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-colors p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar histórico do app</span>
            </button>
          </div>
        </div>

        {/* Rodapé com Botões de Ação Arejados */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            className="btn-primary flex-1 py-3.5 text-sm font-bold justify-center shadow-sm hover:shadow-md cursor-pointer"
          >
            Salvar Alterações
          </button>
          <button
            onClick={handleClose}
            className="btn-secondary py-3.5 text-sm font-bold justify-center cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
