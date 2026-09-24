import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Share,
  MoreVertical,
  PlusSquare,
  Sparkles,
  X,
  CheckCircle2,
  Maximize2,
  Zap,
  ShieldCheck,
  WifiOff,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { FluenciaLogo } from './FluenciaLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  canInstallNative: boolean;
  onNativeInstall: () => Promise<boolean>;
  isInstalled?: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  canInstallNative,
  onNativeInstall,
  isInstalled = false
}) => {
  const [activeTab, setActiveTab] = useState<'benefits' | 'android' | 'ios'>('benefits');
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'manual_needed'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Iniciando...');
  const progressTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Limpa timers ao desmontar ou fechar
  const clearAllTimers = () => {
    progressTimerRef.current.forEach(t => clearTimeout(t));
    progressTimerRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      setInstallStatus('idle');
      setProgress(0);
      setActiveTab('benefits');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    clearAllTimers();
    setInstallStatus('installing');
    setProgress(15);
    setStatusMessage('Preparando pacote e ícones de alta resolução...');

    // Animação progressiva da barra de carregamento
    const t1 = setTimeout(() => {
      setProgress(42);
      setStatusMessage('Registrando recursos offline e Service Worker...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(76);
      setStatusMessage('Configurando modo tela cheia standalone (sem barras)...');
    }, 850);

    const t3 = setTimeout(async () => {
      setProgress(90);
      setStatusMessage('Solicitando confirmação do dispositivo...');

      if (canInstallNative) {
        try {
          const success = await onNativeInstall();
          if (success) {
            setProgress(100);
            setStatusMessage('Aplicativo instalado com sucesso!');
            setInstallStatus('success');
          } else {
            // Usuário fechou ou cancelou o prompt nativo
            setProgress(100);
            setStatusMessage('Instalação cancelada ou pendente.');
            setInstallStatus('manual_needed');
          }
        } catch (e) {
          console.error(e);
          setProgress(100);
          setInstallStatus('manual_needed');
        }
      } else {
        // Dispositivo que não dispara prompt automático (ex: iOS Safari ou Chrome desktop já pareado)
        setProgress(100);
        setStatusMessage('Recursos prontos no dispositivo!');
        // Se for iOS ou navegador sem prompt automático, mostra o passo a passo final
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
          setActiveTab('ios');
        } else {
          setActiveTab('android');
        }
        setInstallStatus('manual_needed');
      }
    }, 1400);

    progressTimerRef.current = [t1, t2, t3];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-scaleUp flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <FluenciaLogo size="md" variant="icon" />
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-amber-300 mb-1">
                <Sparkles className="w-3 h-3" /> Aplicativo Nativo & IA
              </span>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl leading-tight text-white flex items-center gap-1">
                Instalar Fluenc<span className="text-amber-300">IA</span>
              </h3>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed mt-2">
            Experiência 100% de app real: sem barra de pesquisa, sem abas do navegador e com foco total na criança.
          </p>

          {/* Abas de Navegação */}
          <div className="flex items-center bg-black/20 p-1 rounded-2xl mt-4 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('benefits')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'benefits'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Benefícios & Instalação</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🤖</span>
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🍎</span>
              <span>iPhone / iPad</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* ABA 1: BENEFÍCIOS E INSTALAÇÃO DIRETA */}
          {activeTab === 'benefits' && (
            <div className="space-y-5">
              {/* Já instalado */}
              {isInstalled && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-sm">Aplicativo já instalado!</p>
                    <p className="text-emerald-700">Você já está desfrutando da versão completa standalone.</p>
                  </div>
                </div>
              )}

              {/* Grid de Benefícios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Tela Cheia Sem Navegador
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Sem barra de pesquisa, botões de voltar ou abas. A criança não sai da avaliação por engano.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Abertura com 1 Toque
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Ícone fixado direto na sua tela inicial, iniciando instantaneamente como qualquer app da Play Store.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Disponível Offline
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Textos, palavras, áudios e histórico ficam guardados no aparelho, prontos para uso mesmo sem internet.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      100% Leve e Seguro
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Ocupa quase zero de memória e protege a privacidade dos dados de voz dos pequenos.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD DE AÇÃO / BARRA DE CARREGAMENTO */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
                {installStatus === 'idle' && (
                  <div className="space-y-3">
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm font-bold text-slate-800">
                        Pronto para instalar?
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Clique abaixo para iniciar a instalação direta e configurar o app na sua tela de início.
                      </p>
                    </div>

                    <button
                      onClick={handleDirectInstall}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <Download className="w-5 h-5 text-amber-300" />
                      <span>Instalar Aplicativo Agora</span>
                    </button>
                  </div>
                )}

                {installStatus === 'installing' && (
                  <div className="space-y-3.5 py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        <span className="text-xs font-extrabold text-slate-800">
                          Instalando Aplicativo...
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {progress}%
                      </span>
                    </div>

                    {/* Barra de Progresso Animada */}
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/25 animate-pulse" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium text-center italic">
                      {statusMessage}
                    </p>
                  </div>
                )}

                {installStatus === 'success' && (
                  <div className="text-center py-2 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        Instalação Concluída!
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                        O ícone do <strong>FluencIA</strong> foi adicionado ao seu dispositivo. Abra pela tela inicial para usar em tela cheia sem navegador!
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="btn-primary w-full py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    >
                      <span>Excelente, Concluir</span>
                    </button>
                  </div>
                )}

                {installStatus === 'manual_needed' && (
                  <div className="space-y-3 py-1">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900">
                        <p className="font-bold">Recursos preparados!</p>
                        <p className="text-amber-700 mt-0.5">
                          Para fixar na sua tela sem barras do navegador, selecione as abas <strong>Android</strong> ou <strong>iPhone</strong> acima para os 2 toques finais.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDirectInstall}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                      <button
                        onClick={() => setActiveTab('android')}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Ver Como Concluir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: PASSO A PASSO ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                <span className="font-bold">No Google Chrome para Android:</span>
                <span className="text-[11px] bg-white px-2 py-0.5 rounded-full font-bold text-indigo-600 shadow-2xs">
                  Modo App
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold flex items-center gap-1 text-slate-900">
                    <span>Abra o menu do Chrome</span>
                    <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Toque nos <strong>três pontinhos verticais</strong> no canto superior direito do navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold flex items-center gap-1 text-slate-900">
                    <span>Selecione "Instalar aplicativo"</span>
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Toque na opção <strong>Instalar aplicativo</strong> (ou <strong>Adicionar à tela inicial</strong>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900">Confirme a Instalação</p>
                  <p className="text-slate-500 mt-0.5">
                    O aplicativo será compilado no aparelho e abrirá como um app independente, <strong>sem barra de pesquisa nem controles do Chrome</strong>!
                  </p>
                </div>
              </div>

              {canInstallNative && (
                <button
                  onClick={handleDirectInstall}
                  className="btn-primary w-full py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 mt-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tentar Instalação Direta Agora</span>
                </button>
              )}
            </div>
          )}

          {/* ABA 3: PASSO A PASSO IOS */}
          {activeTab === 'ios' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
                <span className="font-bold">No Safari (iPhone ou iPad):</span>
                <span className="text-[11px] bg-white px-2 py-0.5 rounded-full font-bold text-blue-600 shadow-2xs">
                  Tela Cheia
                </span>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold flex items-center gap-1 text-slate-900">
                    <span>Toque no botão Compartilhar</span>
                    <Share className="w-3.5 h-3.5 text-blue-500" />
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta apontando para cima) na barra inferior.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold flex items-center gap-1 text-slate-900">
                    <span>Adicionar à Tela de Início</span>
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700" />
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Role a folha de opções para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900">Toque em Adicionar</p>
                  <p className="text-slate-500 mt-0.5">
                    Toque em <strong>Adicionar</strong> no canto superior direito. O app abrirá em tela cheia, sem barra de navegação do Safari!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Versão PWA Standalone</span>
          </div>

          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
