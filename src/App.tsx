import React, { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { AudioPermissionModal } from './components/common/AudioPermissionModal';
import { HomeScreen } from './components/home/HomeScreen';
import { PreparationScreen } from './components/evaluation/PreparationScreen';
import { TestingScreen } from './components/evaluation/TestingScreen';
import { ResultDashboard } from './components/results/ResultDashboard';
import { HistoryView } from './components/history/HistoryView';
import { ChildManagementModal } from './components/children/ChildManagementModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { InstallAppModal } from './components/common/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useEvaluationEngine } from './hooks/useEvaluationEngine';
import { ChildProfile } from './types/child';
import { DifficultyLevel, QuestionItem } from './types/question';
import { EvaluationMode, EvaluationSession } from './types/evaluation';
import { AppSettings, DEFAULT_SETTINGS } from './types/settings';
import { selectEvaluationItems } from './data/questionBank';
import { getStoredSettings, saveStoredSettings } from './services/db';
import { speechService } from './services/speechService';

type ViewMode = 'home' | 'evaluating' | 'result' | 'history';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('home');
  const [activeChild, setActiveChild] = useState<ChildProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedItems, setSelectedItems] = useState<QuestionItem[]>([]);
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('complete');
  const [activeSession, setActiveSession] = useState<EvaluationSession | null>(null);

  // Modais
  const [isChildModalOpen, setIsChildModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAudioPermModalOpen, setIsAudioPermModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [pendingEvaluationAction, setPendingEvaluationAction] = useState<(() => void) | null>(null);

  // PWA Hook
  const { canInstall, isInstalled, isOnline, triggerInstall } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);

  const handleOpenInstallApp = () => {
    setIsInstallModalOpen(true);
  };

  // Carregar configurações do IndexedDB
  useEffect(() => {
    getStoredSettings().then((loaded) => {
      setSettings(loaded);
      // Aplica classe de tamanho de fonte no body
      document.body.className = `font-${loaded.fontSize}`;
    });
  }, []);

  const handleUpdateSettings = async (updated: Partial<AppSettings>) => {
    const next = await saveStoredSettings(updated);
    setSettings(next);
    document.body.className = `font-${next.fontSize}`;
  };

  // Motor de Avaliação
  const engine = useEvaluationEngine({
    items: selectedItems,
    mode: evaluationMode,
    settings,
    activeChild,
    onFinished: (session) => {
      setActiveSession(session);
      setView('result');
    }
  });

  // Função auxiliar para conferir microfone antes de iniciar
  const ensureMicrophoneAndExecute = async (action: () => void) => {
    // Se a Web Speech API não for suportada, informa com transparência
    if (!speechService.isSupported()) {
      alert(
        'Atenção: Seu navegador atual não oferece suporte nativo à Web Speech API.\nRecomendamos o uso do Google Chrome, Microsoft Edge, Samsung Internet ou Safari para reconhecimento de voz.'
      );
    }

    // Tenta obter permissão direta ou abre modal explicativo
    const hasPerm = await speechService.requestMicrophonePermission();
    if (hasPerm) {
      action();
    } else {
      setPendingEvaluationAction(() => action);
      setIsAudioPermModalOpen(true);
    }
  };

  // Iniciar Avaliação Completa (Níveis 1 -> 2 -> 3 -> 4)
  const handleStartCompleteEvaluation = () => {
    ensureMicrophoneAndExecute(() => {
      const items = selectEvaluationItems('complete', settings.itemsPerLevel);
      setSelectedItems(items);
      setEvaluationMode('complete');
      setView('evaluating');
    });
  };

  // Iniciar Avaliação de Nível Específico
  const handleStartLevelEvaluation = (lvl: DifficultyLevel) => {
    ensureMicrophoneAndExecute(() => {
      const items = selectEvaluationItems(lvl, settings.itemsPerLevel);
      setSelectedItems(items);
      setEvaluationMode(lvl);
      setView('evaluating');
    });
  };

  // Dispara o motor assim que selectedItems é montado e a view vira 'evaluating'
  useEffect(() => {
    if (view === 'evaluating' && selectedItems.length > 0 && engine.phase === 'idle') {
      engine.startEvaluation();
    }
  }, [view, selectedItems, engine.phase]);

  const handleCancelEvaluation = () => {
    if (confirm('Deseja interromper a avaliação atual? Os itens já respondidos não serão computados.')) {
      engine.cancelEvaluation();
      setView('home');
    }
  };

  return (
    <div className="app-container">
      {/* Banner de Instalação PWA se elegível */}
      <PWAInstallBanner
        canInstall={canInstall && showInstallBanner && view === 'home'}
        onInstall={handleOpenInstallApp}
        onDismiss={() => setShowInstallBanner(false)}
      />

      {/* Cabeçalho visível em quase todas as telas (exceto durante o foco da avaliação) */}
      {view !== 'evaluating' && (
        <Header
          activeChild={activeChild}
          currentView={view}
          onGoHome={() => setView('home')}
          onOpenChildModal={() => setIsChildModalOpen(true)}
          onOpenHistory={() => setView('history')}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          canInstallPWA={true}
          onInstallPWA={handleOpenInstallApp}
          isOnline={isOnline}
        />
      )}

      {/* Área Principal de Conteúdo */}
      <main className="main-content">
        {view === 'home' && (
          <HomeScreen
            activeChild={activeChild}
            onStartCompleteEvaluation={handleStartCompleteEvaluation}
            onStartLevelEvaluation={handleStartLevelEvaluation}
            onOpenHistory={() => setView('history')}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenChildModal={() => setIsChildModalOpen(true)}
            onInstallApp={handleOpenInstallApp}
          />
        )}

        {view === 'evaluating' && (
          <>
            {engine.phase === 'preparing' && (
              <PreparationScreen
                countdown={engine.preparationCount}
                isMicReady={engine.isMicListening}
              />
            )}

            {engine.phase === 'testing' && engine.currentItem && (
              <TestingScreen
                item={engine.currentItem}
                currentIndex={engine.currentIndex}
                totalItems={engine.totalItems}
                timeRemainingSec={engine.timeRemainingSec}
                totalDurationSec={engine.totalItemDurationSec}
                isMicListening={engine.isMicListening}
                liveTranscript={engine.liveTranscript}
                isSuccessFeedback={engine.isSuccessFeedback}
                onCancel={handleCancelEvaluation}
                onSkip={engine.skipCurrentItem}
              />
            )}
          </>
        )}

        {view === 'result' && activeSession && (
          <ResultDashboard
            session={activeSession}
            onRestart={() => setView('home')}
            onViewHistory={() => setView('history')}
            onInstallApp={handleOpenInstallApp}
          />
        )}

        {view === 'history' && (
          <HistoryView
            onBack={() => setView('home')}
            onSelectSession={(session) => {
              setActiveSession(session);
              setView('result');
            }}
          />
        )}
      </main>

      {/* Modais Globais */}
      <ChildManagementModal
        isOpen={isChildModalOpen}
        activeChild={activeChild}
        onClose={() => setIsChildModalOpen(false)}
        onSelectChild={(child) => setActiveChild(child)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSettings={handleUpdateSettings}
      />

      <AudioPermissionModal
        isOpen={isAudioPermModalOpen}
        onClose={() => setIsAudioPermModalOpen(false)}
        onGranted={() => {
          setIsAudioPermModalOpen(false);
          if (pendingEvaluationAction) {
            pendingEvaluationAction();
            setPendingEvaluationAction(null);
          }
        }}
      />

      {/* Modal de Instalação no Celular */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        canInstallNative={canInstall}
        onNativeInstall={triggerInstall}
        isInstalled={isInstalled}
      />
    </div>
  );
};
