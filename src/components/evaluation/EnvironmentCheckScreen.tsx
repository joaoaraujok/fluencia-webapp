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
import { api } from '../../services/api';

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
  const [testPedagogicalNote, setTestPedagogicalNote] = useState<string>('');
  const [speechTested, setSpeechTested] = useState<boolean>(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState<boolean>(false);

  useEffect(() => {
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
      audioService.stopItemRecording().catch(() => {});
    };
  }, []);

  const handleTestSpeech = async () => {
    setIsTestingAudio(true);
    setTestTranscript('');
    setTestPedagogicalNote('');

    await audioService.ensureMicStream();
    audioService.startItemRecording();

    setTimeout(async () => {
      try {
        const audioBlob = await audioService.stopItemRecording();
        if (audioBlob && audioBlob.size > 100) {
          const formData = new FormData();
          const extension = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
          formData.append('audioFile', audioBlob, `test_env_${Date.now()}.${extension}`);
          formData.append('targetText', 'TESTE');
          formData.append('itemType', 'word');

          const aiRes = await api.analyzeAudioItem(formData);
          if (aiRes) {
            setTestTranscript(aiRes.transcript || '(Sem voz detectada)');
            setTestPedagogicalNote(aiRes.pedagogicalNote || 'Áudio avaliado com sucesso.');
            setSpeechTested(true);
          }
        } else {
          setTestTranscript('(Nenhum som captado)');
        }
      } catch (err) {
        console.warn('Erro no teste de IA:', err);
        setTestTranscript('Erro de conexão com o servidor de IA');
      } finally {
        setIsTestingAudio(false);
      }
    }, 2800);
  };

  const isEnvironmentReady = micGranted && instructionsAccepted;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Topo com Identificação e Botão de Retorno */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preparação Acústica</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Ambiente e Microfone
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Estudante: <span className="font-semibold text-slate-800">{childName || 'Não selecionado'}</span>
          </p>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Cancelar e voltar à tela inicial"
          aria-label="Cancelar e voltar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid de Verificação em Tema Claro Confortável */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Painel Esquerdo: Orientações de Aplicação */}
        <div className="card p-5 space-y-4 bg-white">
          <h2 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Condições para a Avaliação</span>
          </h2>

          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Tv className="w-3.5 h-3.5" />
              </span>
              <span><strong>Ambiente silencioso:</strong> Evite salas com TV, música ou ruídos contínuos.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5" />
              </span>
              <span><strong>Conversas externas:</strong> Não deve haver outras vozes próximas durante a leitura.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Wind className="w-3.5 h-3.5" />
              </span>
              <span><strong>Corrente de ar:</strong> Não direcione ventilador ou ar-condicionado direto no microfone.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Smartphone className="w-3.5 h-3.5" />
              </span>
              <span><strong>Posicionamento:</strong> Aparelho sobre a mesa a cerca de 25 cm da criança.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span><strong>Acolhimento:</strong> Transmita calma e tranquilidade antes de iniciar.</span>
            </li>
          </ul>

          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={instructionsAccepted}
                onChange={(e) => setInstructionsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Confirmo que o ambiente está adequado e silencioso
              </span>
            </label>
          </div>
        </div>

        {/* Painel Direito: Sensibilidade e Monitoramento do Microfone (Clean Light) */}
        <div className="card p-5 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-600" />
              <span>Sensibilidade do Microfone</span>
            </h2>

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                noiseStatus === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : noiseStatus === 'noisy'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : noiseStatus === 'clipping'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {noiseStatus === 'optimal'
                ? 'Nível Ideal'
                : noiseStatus === 'noisy'
                ? 'Ruído Alto'
                : noiseStatus === 'clipping'
                ? 'Muito Alto'
                : 'Silêncio'}
            </span>
          </div>

          {/* Medidor VU Suave */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Captação de Entrada</span>
              <span className="font-mono">{micVolume}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micVolume > 85
                    ? 'bg-rose-500'
                    : micVolume > 45
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, micVolume)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              Peça para a criança dizer uma palavra para observar a barra verde.
            </p>
          </div>

          {/* Teste Rápido de Áudio */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Teste de Reconhecimento:</span>
              <button
                onClick={handleTestSpeech}
                disabled={isTestingAudio}
                className="btn-secondary text-xs px-2.5 py-1 rounded"
              >
                <RefreshCw className={`w-3 h-3 text-slate-500 ${isTestingAudio ? 'animate-spin' : ''}`} />
                <span>{isTestingAudio ? 'Ouvindo...' : 'Falar Palavra'}</span>
              </button>
            </div>

            {testTranscript ? (
              <div className="p-2.5 rounded bg-white border border-slate-200 text-xs text-slate-800 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span>Transcrito: "{testTranscript}"</span>
                  {speechTested && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-sans font-semibold">
                      Validado
                    </span>
                  )}
                </div>
                {testPedagogicalNote && (
                  <p className="text-[11px] text-slate-600 font-sans italic">
                    Análise: {testPedagogicalNote}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                {isTestingAudio ? 'Gravando amostra de teste...' : 'Teste opcional para verificar o áudio antes da avaliação.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé: Ação de Continuidade com Hierarquia Clara */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center sm:text-left">
          Tempo regulamentar de <strong>10 segundos</strong> por item com registro em milissegundos.
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="btn-secondary w-full sm:w-auto text-xs px-4 py-2.5"
          >
            Voltar
          </button>

          <button
            onClick={onReadyToStart}
            disabled={!isEnvironmentReady}
            className="btn-primary w-full sm:w-auto text-xs px-5 py-2.5 font-semibold"
            aria-label="Avançar para o início da avaliação"
          >
            <span>Iniciar Avaliação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
