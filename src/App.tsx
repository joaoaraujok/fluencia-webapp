import React, { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { AudioPermissionModal } from './components/common/AudioPermissionModal';
import { HomeScreen } from './components/home/HomeScreen';
import { PreparationScreen } from './components/evaluation/PreparationScreen';
import { TestingScreen } from './components/evaluation/TestingScreen';
import { EnvironmentCheckScreen } from './components/evaluation/EnvironmentCheckScreen';
import { ResultDashboard } from './components/results/ResultDashboard';
import { HistoryView } from './components/history/HistoryView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentSelectionModal } from './components/children/StudentSelectionModal';
import { LoginModal } from './components/auth/LoginModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { InstallAppModal } from './components/common/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useEvaluationEngine } from './hooks/useEvaluationEngine';
import { Student } from './types/school';
import { ChildProfile } from './types/child';
import { DifficultyLevel, QuestionItem } from './types/question';
import { EvaluationMode, EvaluationSession } from './types/evaluation';
import { AppSettings, DEFAULT_SETTINGS } from './types/settings';
import { getStoredSettings, saveStoredSettings } from './services/db';
import { repository } from './services/repository';
import { speechService } from './services/speechService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type ViewMode = 'home' | 'environment_check' | 'evaluating' | 'result' | 'history' | 'admin';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>('home');
  const [activeStudent, setActiveStudent] = useState<Student | ChildProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedItems, setSelectedItems] = useState<QuestionItem[]>([]);
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('complete');
  const [activeSession, setActiveSession] = useState<EvaluationSession | null>(null);

  // Modais
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAudioPermModalOpen, setIsAudioPermModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // PWA
  const { canInstall, isInstalled, isOnline, triggerInstall } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);

  // Carregar configurações locais
  useEffect(() => {
    getStoredSettings().then((loaded) => {
      setSettings(loaded);
      document.body.className = `font-${loaded.fontSize}`;
    });
  }, []);

  const handleUpdateSettings = async (updated: Partial<AppSettings>) => {
    const next = await saveStoredSettings(updated);
    setSettings(next);
    document.body.className = `font-${next.fontSize}`;
  };

  // Motor de Avaliação com janela de 10s e registro preciso
  const engine = useEvaluationEngine({
    items: selectedItems,
    mode: evaluationMode,
    settings,
    activeStudent,
    evaluatorId: user?.id,
    evaluatorName: user?.name,
    onFinished: (session) => {
      setActiveSession(session);
      setView('result');
    }
  });

  // Preparar itens e ir para verificação do ambiente
  const prepareEvaluationFlow = async (mode: EvaluationMode) => {
    if (!speechService.isSupported()) {
      alert(
        'Atenção: Seu navegador atual não possui suporte à Web Speech API.\nRecomendamos Google Chrome, Microsoft Edge ou Safari.'
      );
    }

    const items = await repository.getEvaluationQuestions(mode, settings.itemsPerLevel);
    if (!items || items.length === 0) {
      alert('Nenhum item pedagógico disponível para este nível no momento.');
      return;
    }

    setSelectedItems(items);
    setEvaluationMode(mode);
    setView('environment_check');
  };

  const handleStartCompleteEvaluation = () => {
    prepareEvaluationFlow('complete');
  };

  const handleStartLevelEvaluation = (lvl: DifficultyLevel) => {
    prepareEvaluationFlow(lvl);
  };

  const handleStartAfterEnvironmentCheck = () => {
    setView('evaluating');
  };

  // Dispara o motor quando transita para 'evaluating'
  useEffect(() => {
    if (view === 'evaluating' && selectedItems.length > 0 && engine.phase === 'idle') {
      engine.startEvaluation();
    }
  }, [view, selectedItems, engine.phase]);

  const handleCancelEvaluation = () => {
    if (confirm('Deseja interromper a avaliação atual?')) {
      engine.cancelEvaluation();
      setView('home');
    }
  };

  return (
    <div className="app-container">
      {/* Banner PWA se aplicável */}
      <PWAInstallBanner
        canInstall={canInstall && showInstallBanner && view === 'home'}
        onInstall={() => setIsInstallModalOpen(true)}
        onDismiss={() => setShowInstallBanner(false)}
      />

      {/* Header visível fora da tela de foco infantil */}
      {view !== 'evaluating' && (
        <Header
          activeStudent={activeStudent}
          currentView={view}
          onGoHome={() => setView('home')}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenHistory={() => setView('history')}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenAdmin={() => setView('admin')}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          canInstallPWA={true}
          onInstallPWA={() => setIsInstallModalOpen(true)}
          isOnline={isOnline}
        />
      )}

      {/* Conteúdo Principal */}
      <main className="main-content">
        {view === 'home' && (
          <HomeScreen
            activeStudent={activeStudent}
            onStartCompleteEvaluation={handleStartCompleteEvaluation}
            onStartLevelEvaluation={handleStartLevelEvaluation}
            onOpenHistory={() => setView('history')}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenStudentModal={() => setIsStudentModalOpen(true)}
            onInstallApp={() => setIsInstallModalOpen(true)}
          />
        )}

        {view === 'environment_check' && (
          <EnvironmentCheckScreen
            childName={activeStudent?.name}
            onReadyToStart={handleStartAfterEnvironmentCheck}
            onCancel={() => setView('home')}
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
                currentStage={engine.currentStage}
                globalElapsedSeconds={engine.globalElapsedSeconds}
                globalTimeLimitSec={engine.globalTimeLimitSec}
                timeRemainingSec={engine.timeRemainingSec}
                totalDurationSec={engine.totalItemDurationSec}
                isMicListening={engine.isMicListening}
                liveTranscript={engine.liveTranscript}
                isSuccessFeedback={engine.isSuccessFeedback}
                onCancel={handleCancelEvaluation}
                onSkip={engine.skipCurrentItem}
                onMarkResult={settings.educatorManualControls ? engine.markCurrentItemResult : undefined}
              />
            )}
          </>
        )}

        {view === 'result' && activeSession && (
          <ResultDashboard
            session={activeSession}
            onRestart={() => setView('home')}
            onViewHistory={() => setView('history')}
            onInstallApp={() => setIsInstallModalOpen(true)}
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

        {view === 'admin' && (
          <AdminDashboard onBack={() => setView('home')} />
        )}
      </main>

      {/* Modais Globais */}
      <StudentSelectionModal
        isOpen={isStudentModalOpen}
        activeStudent={activeStudent as Student | null}
        onClose={() => setIsStudentModalOpen(false)}
        onSelectStudent={(st) => setActiveStudent(st)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setView('admin')}
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
        onGranted={() => setIsAudioPermModalOpen(false)}
      />

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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};
