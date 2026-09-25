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
  Sparkles,
  ShieldCheck,
  BookOpen,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { AppSettings, FontSizeSetting, SpeechToleranceSetting, DEFAULT_SETTINGS } from '../../types/settings';
import { clearAllEvaluations } from '../../services/db';
import { speechService } from '../../services/speechService';
import { audioService } from '../../services/audioService';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
}

type SettingsTab = 'timing' | 'pedagogy' | 'audio_mic' | 'display';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('timing');

  // --- Estados de Configuração da Versão 2026 ---
  const [globalTimeLimitSec, setGlobalTimeLimitSec] = useState<number>(settings.globalTimeLimitSec ?? 240);
  const [durationLetterSec, setDurationLetterSec] = useState<number>(settings.durationLetterSec ?? 10);
  const [durationWordSec, setDurationWordSec] = useState<number>(settings.durationWordSec ?? 10);
  const [durationTextSec, setDurationTextSec] = useState<number>(settings.durationTextSec ?? 60);
  const [durationPhraseSec, setDurationPhraseSec] = useState<number>(settings.durationPhraseSec ?? 15);
  const [maxTestItems, setMaxTestItems] = useState<number>(settings.maxTestItems ?? 30);

  // Pedagógico & Fala
  const [speechTolerance, setSpeechTolerance] = useState<SpeechToleranceSetting>(settings.speechTolerance ?? 'standard');
  const [phoneticSupportEnabled, setPhoneticSupportEnabled] = useState<boolean>(settings.phoneticSupportEnabled ?? true);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(settings.autoAdvance ?? true);
  const [silentModeDuringSpeech, setSilentModeDuringSpeech] = useState<boolean>(settings.silentModeDuringSpeech ?? true);
  const [educatorManualControls, setEducatorManualControls] = useState<boolean>(settings.educatorManualControls ?? true);

  // Visual & Sons
  const [fontSize, setFontSize] = useState<FontSizeSetting>(settings.fontSize ?? 'large');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled ?? true);

  // Calibração e Teste de Microfone
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micHeard, setMicHeard] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);

  // Sincroniza com as configurações passadas quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setGlobalTimeLimitSec(settings.globalTimeLimitSec ?? 240);
      setDurationLetterSec(settings.durationLetterSec ?? 10);
      setDurationWordSec(settings.durationWordSec ?? 10);
      setDurationTextSec(settings.durationTextSec ?? 60);
      setDurationPhraseSec(settings.durationPhraseSec ?? 15);
      setMaxTestItems(settings.maxTestItems ?? 30);

      setSpeechTolerance(settings.speechTolerance ?? 'standard');
      setPhoneticSupportEnabled(settings.phoneticSupportEnabled ?? true);
      setAutoAdvance(settings.autoAdvance ?? true);
      setSilentModeDuringSpeech(settings.silentModeDuringSpeech ?? true);
      setEducatorManualControls(settings.educatorManualControls ?? true);

      setFontSize(settings.fontSize ?? 'large');
      setSoundEnabled(settings.soundEnabled ?? true);

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
      globalTimeLimitSec,
      durationLetterSec,
      durationWordSec,
      durationTextSec,
      durationPhraseSec,
      maxTestItems,
      speechTolerance,
      phoneticSupportEnabled,
      autoAdvance,
      silentModeDuringSpeech,
      educatorManualControls,
      fontSize,
      soundEnabled,
      // Retrocompatibilidade
      wordDurationSec: durationWordSec,
      phraseDurationSec: durationPhraseSec
    });
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as configurações para os padrões oficiais do protocolo pedagógico?')) {
      setGlobalTimeLimitSec(DEFAULT_SETTINGS.globalTimeLimitSec);
      setDurationLetterSec(DEFAULT_SETTINGS.durationLetterSec);
      setDurationWordSec(DEFAULT_SETTINGS.durationWordSec);
      setDurationTextSec(DEFAULT_SETTINGS.durationTextSec);
      setDurationPhraseSec(DEFAULT_SETTINGS.durationPhraseSec);
      setMaxTestItems(DEFAULT_SETTINGS.maxTestItems);
      setSpeechTolerance(DEFAULT_SETTINGS.speechTolerance);
      setPhoneticSupportEnabled(DEFAULT_SETTINGS.phoneticSupportEnabled);
      setAutoAdvance(DEFAULT_SETTINGS.autoAdvance);
      setSilentModeDuringSpeech(DEFAULT_SETTINGS.silentModeDuringSpeech);
      setEducatorManualControls(DEFAULT_SETTINGS.educatorManualControls);
      setFontSize(DEFAULT_SETTINGS.fontSize);
      setSoundEnabled(DEFAULT_SETTINGS.soundEnabled);
    }
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

    // 1. Inicia monitoramento de decibéis/volume da voz em tempo real
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
    if (confirm('Tem certeza de que deseja apagar todo o histórico local de avaliações?')) {
      await clearAllEvaluations();
      alert('Histórico local apagado com sucesso.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Topo do Modal com Versão e Identidade Oficial */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-xl text-slate-900 leading-tight">
                  Configurações da Avaliação
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {settings.evaluationCriteriaVersion || '2026.1'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Protocolo oficial de fluência oral • 4 Etapas Adaptativas
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação das Configurações */}
        <div className="flex border-b border-slate-200 bg-white px-5 sm:px-6 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('timing')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'timing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tempos & Limites</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pedagogy')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pedagogy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Critérios Pedagógicos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio_mic')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'audio_mic'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Microfone & VU Meter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'display'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Exibição & Sons</span>
          </button>
        </div>

        {/* Conteúdo da Aba com Rolagem Macia */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ABA 1: TEMPOS & LIMITES OFICIAIS */}
          {activeTab === 'timing' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Limite Global de 4 Minutos (Regra 3) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Limite Global da Avaliação (Regra 3)</span>
                  </label>
                  <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                    {Math.floor(globalTimeLimitSec / 60)} minutos ({globalTimeLimitSec}s)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 180, label: '3 min (180s)' },
                    { val: 240, label: '4 min (240s) • Oficial' },
                    { val: 300, label: '5 min (300s)' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setGlobalTimeLimitSec(opt.val)}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all text-center cursor-pointer ${
                        globalTimeLimitSec === opt.val
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Ao atingir este tempo, o teste é interrompido graciosamente e os dados são processados para gerar o nível com as evidências disponíveis.
                </p>
              </div>

              {/* Tempos por Etapa do Protocolo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Duração Máxima por Item nas 4 Etapas</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Etapa 1: Letras */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>Etapa 1: Letras</span>
                      <span className="text-indigo-600 font-black">{durationLetterSec}s</span>
                    </div>
                    <select
                      value={durationLetterSec}
                      onChange={(e) => setDurationLetterSec(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
                    >
                      <option value={8}>8 segundos (Rápido)</option>
                      <option value={10}>10 segundos (Padrão Oficial)</option>
                      <option value={12}>12 segundos (Estendido)</option>
                    </select>
                  </div>

                  {/* Etapa 2: Palavras */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>Etapa 2: Palavras</span>
                      <span className="text-indigo-600 font-black">{durationWordSec}s</span>
                    </div>
                    <select
                      value={durationWordSec}
                      onChange={(e) => setDurationWordSec(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
                    >
                      <option value={8}>8 segundos</option>
                      <option value={10}>10 segundos (Padrão Oficial)</option>
                      <option value={12}>12 segundos (Estendido)</option>
                    </select>
                  </div>

                  {/* Etapa 3: Texto */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>Etapa 3: Texto em Contexto</span>
                      <span className="text-indigo-600 font-black">{durationTextSec}s</span>
                    </div>
                    <select
                      value={durationTextSec}
                      onChange={(e) => setDurationTextSec(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
                    >
                      <option value={45}>45 segundos</option>
                      <option value={60}>60 segundos (Padrão Oficial)</option>
                      <option value={90}>90 segundos (Estendido)</option>
                    </select>
                  </div>

                  {/* Etapa 4: Frases */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>Etapa 4: Frases Curtas</span>
                      <span className="text-indigo-600 font-black">{durationPhraseSec}s</span>
                    </div>
                    <select
                      value={durationPhraseSec}
                      onChange={(e) => setDurationPhraseSec(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
                    >
                      <option value={12}>12 segundos</option>
                      <option value={15}>15 segundos (Padrão Oficial)</option>
                      <option value={20}>20 segundos (Estendido)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Limite Total da Bateria */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Bateria Sequencial Completa
                  </div>
                  <div className="text-xs text-slate-500">
                    Máximo de itens no teste progressivo (letras até frases)
                  </div>
                </div>
                <div className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                  {maxTestItems} itens
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CRITÉRIOS PEDAGÓGICOS E FALA */}
          {activeTab === 'pedagogy' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Apoio ao Método Fônico */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Apoio ao Método Fônico nas Letras</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aceita palavras-âncora do método fônico (ex: <em>"B de bola"</em>, <em>"bola"</em>, <em>"sapo"</em> ao ver a letra correspondente). Altamente recomendado para turmas de alfabetização do 1º ano.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={phoneticSupportEnabled}
                    onChange={(e) => setPhoneticSupportEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Tolerância de Articulação Infantil */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Tolerância Fonética Articulatória
                  </div>
                  <p className="text-xs text-slate-500">
                    Calibração do motor de fonemas para troca de letras e trocas fonológicas naturais infantis.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSpeechTolerance('standard')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      speechTolerance === 'standard'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Padrão Oficial</span>
                      {speechTolerance === 'standard' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Acurácia estrita conforme diretrizes SAEB / MEC.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpeechTolerance('lenient')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      speechTolerance === 'lenient'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Flexível (1º Ano)</span>
                      {speechTolerance === 'lenient' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Acolhe pequenas trocas dialetais e hesitações leves.
                    </p>
                  </button>
                </div>
              </div>

              {/* Controles Manuais do Educador (Modo Supervisor) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Controles Rápidos do Educador na Tela</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Exibe botões e atalhos táteis de auxílio (<em>"Acertou"</em> [1], <em>"Errou"</em> [2], <em>"Pular"</em> [Espaço]) no cabeçalho do teste para intervenção caso a criança sussurre ou haja ruído na sala.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={educatorManualControls}
                    onChange={(e) => setEducatorManualControls(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Avanço Automático */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">
                    Avanço Automático por Reconhecimento
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Avança para a próxima palavra/letra automaticamente em 250ms com celebração visual verde assim que a criança acertar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* ABA 3: MICROFONE & VU METER */}
          {activeTab === 'audio_mic' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Painel VU Meter e Teste de Voz */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider block">
                        Calibração e Medidor VU de Voz
                      </span>
                      <span className="text-[11px] text-indigo-700/80 font-medium">
                        Verifique o nível de entrada e precisão da Web Speech API
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMicTest}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${
                      micTesting
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {micTesting ? 'Parar Teste' : 'Iniciar Teste de Áudio'}
                  </button>
                </div>

                {/* VU Meter Interativo */}
                {micTesting ? (
                  <div className="p-4 rounded-xl bg-white border border-indigo-200 space-y-3.5 animate-fadeIn shadow-2xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-indigo-600">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          Volume do Sinal de Áudio:
                        </span>
                        <span className="tabular-nums font-black text-slate-900 text-sm">
                          {micVolume}%
                        </span>
                      </div>

                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-75 ${
                            micVolume > 65
                              ? 'bg-amber-500'
                              : micVolume > 15
                              ? 'bg-emerald-500'
                              : 'bg-indigo-400'
                          }`}
                          style={{ width: `${Math.max(4, micVolume)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-xs">
                      {micHeard ? (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                          🎙️ Voz Reconhecida: <span className="text-emerald-700 font-black">"{micHeard}"</span>
                        </div>
                      ) : (
                        <div className="text-indigo-600 flex items-center gap-2 font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          <span>Fale algo agora no microfone para testar...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : micError ? (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{micError}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clique em <strong>Iniciar Teste de Áudio</strong> para verificar a captação e assegurar que o navegador possui permissão do microfone.
                  </p>
                )}
              </div>

              {/* Silêncio do Sistema Durante a Fala */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">
                    Silenciar Sistema Durante a Captação
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Evita que bipes do sistema ou sons de cronômetro toquem enquanto o microfone está escutando a criança, eliminando ecos acústicos.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={silentModeDuringSpeech}
                    onChange={(e) => setSilentModeDuringSpeech(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* ABA 4: EXIBIÇÃO & SONS */}
          {activeTab === 'display' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Tamanho da Fonte */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>Tamanho das Letras e Palavras na Tela</span>
                </label>

                <div className="grid grid-cols-3 gap-2.5">
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
                        className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sons Gerais do Aplicativo */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Sons e Efeitos Sonoros</div>
                    <div className="text-xs text-slate-500">Bipes de contagem 3-2-1 e sino de transição</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Limpeza de Histórico Local */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar histórico local do app</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Ação Padronizados */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões Oficiais</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1 sm:flex-none py-2.5 px-5 text-sm font-bold justify-center cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary flex-1 sm:flex-none py-2.5 px-6 text-sm font-bold justify-center shadow-sm hover:shadow-md cursor-pointer"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
