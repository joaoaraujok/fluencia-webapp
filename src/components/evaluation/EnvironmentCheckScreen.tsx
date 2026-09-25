import React, { useEffect, useState } from 'react';
import {
  Mic,
  CheckCircle2,
  ShieldCheck,
  Tv,
  Users,
  Wind,
  Smartphone,
  Info,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import { audioService } from '../../services/audioService';
import { speechService } from '../../services/speechService';

interface EnvironmentCheckScreenProps {
  onReadyToStart: () => void;
  onCancel: () => void;
  childName?: string;
}

export const EnvironmentCheckScreen: React.FC<EnvironmentCheckScreenProps> = ({
  onReadyToStart,
  onCancel,
  childName
}) => {
  const [micGranted, setMicGranted] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const [noiseStatus, setNoiseStatus] = useState<'silence' | 'optimal' | 'noisy' | 'clipping'>('silence');
  const [testTranscript, setTestTranscript] = useState<string>('');
  const [speechTested, setSpeechTested] = useState<boolean>(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState<boolean>(false);

  useEffect(() => {
    // 1. Inicia monitoramento de áudio do microfone
    let active = true;
    audioService
      .startMicMonitoring((vol) => {
        if (!active) return;
        setMicVolume(vol);

        if (vol === 0) {
          setNoiseStatus('silence');
        } else if (vol > 85) {
          setNoiseStatus('clipping');
        } else if (vol > 45) {
          setNoiseStatus('noisy');
        } else {
          setNoiseStatus('optimal');
        }
      })
      .then((res) => {
        if (res.success) {
          setMicGranted(true);
        }
      });

    return () => {
      active = false;
      audioService.stopMicMonitoring();
      speechService.abort();
    };
  }, []);

  const handleTestSpeech = () => {
    setIsTestingAudio(true);
    setTestTranscript('');

    speechService.startSession(
      () => {},
      (err) => console.warn('Erro teste:', err)
    );

    speechService.prepareNextItem({
      expectedText: 'TESTE',
      onTranscriptUpdate: (t) => {
        setTestTranscript(t);
        if (t.trim().length > 0) {
          setSpeechTested(true);
        }
      }
    });

    setTimeout(() => {
      speechService.stopSession();
      setIsTestingAudio(false);
      setSpeechTested(true);
    }, 4000);
  };

  const isEnvironmentReady = micGranted && instructionsAccepted;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Topo com botão de fechar / cancelar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Controle de Qualidade Acústica</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Preparação do Ambiente Escolar
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Estudante em avaliação: <span className="font-bold text-slate-800">{childName || 'Estudante'}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Cancelar e voltar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid de Verificação e Orientações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel Esquerdo: Instruções de Sala de Aula */}
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            <span>Orientações para o Avaliador</span>
          </h3>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <Tv className="w-4 h-4" />
              </span>
              <span><strong>Ambiente silencioso:</strong> Desligue TV, rádio ou aparelhos com som no recinto.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </span>
              <span><strong>Evite conversas paralelas:</strong> O microfone pode captar vozes de fundo.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <Wind className="w-4 h-4" />
              </span>
              <span><strong>Ventilador ou ar direto:</strong> Não aponte vento para a entrada do microfone.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </span>
              <span><strong>Dispositivo estável:</strong> Mantenha sobre a mesa a cerca de 20 a 30 cm da criança.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span><strong>Acolhimento:</strong> Deixe a criança confortável e sem pressão de desempenho.</span>
            </li>
          </ul>

          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={instructionsAccepted}
                onChange={(e) => setInstructionsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                O ambiente e dispositivo estão devidamente preparados
              </span>
            </label>
          </div>
        </div>

        {/* Painel Direito: Calibração em Tempo Real do Microfone */}
        <div className="card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-indigo-400" />
              <span>Sensibilidade do Microfone</span>
            </h3>
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                noiseStatus === 'optimal'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : noiseStatus === 'noisy'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : noiseStatus === 'clipping'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {noiseStatus === 'optimal'
                ? 'Nível Ótimo'
                : noiseStatus === 'noisy'
                ? 'Ruído Elevado'
                : noiseStatus === 'clipping'
                ? 'Saturação / Clipping'
                : 'Aguardando Som'}
            </span>
          </div>

          {/* VU Meter Visual */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-bold">
              <span>Nível de Entrada</span>
              <span>{micVolume}%</span>
            </div>
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micVolume > 85
                    ? 'bg-rose-500'
                    : micVolume > 45
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, micVolume)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400">
              Peça para a criança falar "Oi" ou o próprio nome para verificar a barra verde.
            </p>
          </div>

          {/* Teste Rápido de Captura */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Teste de Voz Rápido:</span>
              <button
                onClick={handleTestSpeech}
                disabled={isTestingAudio}
                className="text-xs font-bold text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAudio ? 'animate-spin' : ''}`} />
                <span>{isTestingAudio ? 'Ouvindo...' : 'Falar Palavra Teste'}</span>
              </button>
            </div>

            {testTranscript ? (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <span>Captado: "{testTranscript}"</span>
                {speechTested && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-700/50">
                    Voz OK
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                {isTestingAudio ? 'Fale algo em direção ao microfone...' : 'Clique em "Falar Palavra Teste" para testar o reconhecimento.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé com botão para prosseguir */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center sm:text-left">
          O teste terá duração de <strong>10 segundos por palavra</strong> com cronômetro independente.
        </p>

        <button
          onClick={onReadyToStart}
          disabled={!isEnvironmentReady}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md ${
            isEnvironmentReady
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 scale-100 hover:scale-[1.02]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Iniciar Avaliação com Estudante</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
