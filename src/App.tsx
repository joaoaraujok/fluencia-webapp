import React, { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { AudioPermissionModal } from './components/common/AudioPermissionModal';
import { HomeScreen } from './components/home/HomeScreen';
import { PreparationScreen } from './components/evaluation/PreparationScreen';
import { TestingScreen } from './components/evaluation/TestingScreen';
import { ComprehensionScreen } from './components/evaluation/ComprehensionScreen';
import { EnvironmentCheckScreen } from './components/evaluation/EnvironmentCheckScreen';
import { StudentSelectionModal } from './components/children/StudentSelectionModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useEvaluationEngine } from './hooks/useEvaluationEngine';
import { Lock } from 'lucide-react';
import { Student } from './types/school';
import { ChildProfile } from './types/child';
import { DifficultyLevel, QuestionItem } from './types/question';
import { EvaluationMode, EvaluationSession } from './types/evaluation';
import { AppSettings, DEFAULT_SETTINGS } from './types/settings';
import { getStoredSettings, saveStoredSettings } from './services/db';
import { repository } from './services/repository';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Carregamento dinâmico sob demanda (Code-splitting) para redução drástica do bundle inicial
const ResultDashboard = React.lazy(() =>
  import('./components/results/ResultDashboard').then((m) => ({ default: m.ResultDashboard }))
);
const HistoryView = React.lazy(() =>
  import('./components/history/HistoryView').then((m) => ({ default: m.HistoryView }))
);
const AdminDashboard = React.lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const LoginModal = React.lazy(() =>
  import('./components/auth/LoginModal').then((m) => ({ default: m.LoginModal }))
);
const SettingsModal = React.lazy(() =>
  import('./components/settings/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const InstallAppModal = React.lazy(() =>
  import('./components/common/InstallAppModal').then((m) => ({ default: m.InstallAppModal }))
);
const UserManualModal = React.lazy(() =>
  import('./components/common/UserManualModal').then((m) => ({ default: m.UserManualModal }))
);

type ViewMode = 'home' | 'environment_check' | 'evaluating' | 'result' | 'history' | 'admin';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const isSuperAdminOrAdmin = isAuthenticated && (hasRole('SUPERADMIN') || hasRole('ADMIN'));
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
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

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
    if (isSuperAdminOrAdmin) {
      alert('SuperAdmins e Administradores possuem perfil exclusivo de gestão e avaliação de relatórios, não realizando testes diretamente com as crianças.');
      return;
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
          onOpenManual={() => setIsManualModalOpen(true)}
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
            onOpenManual={() => setIsManualModalOpen(true)}
            onOpenAdmin={() => setView('admin')}
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

            {engine.phase === 'testing' && engine.currentStage === 'comprehension' && (
              <ComprehensionScreen
                questions={engine.comprehensionQuestions}
                textTitle={engine.lastReadTextTitle}
                onSubmitAnswers={engine.submitComprehensionAnswers}
                onCancel={handleCancelEvaluation}
              />
            )}

            {engine.phase === 'testing' && engine.currentStage !== 'comprehension' && engine.currentItem && (
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
                isAnalyzingAi={engine.isAnalyzingAi}
                onCancel={handleCancelEvaluation}
                onSkip={engine.skipCurrentItem}
                onMarkResult={settings.educatorManualControls ? engine.markCurrentItemResult : undefined}
              />
            )}
          </>
        )}

        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-16 space-y-3 text-slate-500 animate-fadeIn" role="status" aria-live="polite">
              <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
              <span className="text-xs font-medium text-slate-600">Carregando...</span>
            </div>
          }
        >
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
            isAuthenticated ? (
              <AdminDashboard
                onBack={() => setView('home')}
                onSelectStudentForTest={(student) => {
                  setActiveStudent(student);
                  prepareEvaluationFlow('complete');
                }}
              />
            ) : (
              <div className="card p-8 max-w-md mx-auto text-center space-y-4 my-12 bg-white border-slate-200 animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900">Acesso Restrito</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  O painel de gestão é exclusivo para profissionais cadastrados (SuperAdmin, Admin e Supervisor). Sem login institucional, você pode apenas realizar avaliações e testes diagnósticos.
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => setView('home')}
                    className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                  >
                    Voltar ao Início
                  </button>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="btn-primary text-xs px-4 py-2 cursor-pointer"
                  >
                    Entrar com Conta
                  </button>
                </div>
              </div>
            )
          )}
        </React.Suspense>
      </main>

      {/* Modais Globais */}
      <StudentSelectionModal
        isOpen={isStudentModalOpen}
        activeStudent={activeStudent as Student | null}
        onClose={() => setIsStudentModalOpen(false)}
        onSelectStudent={(st) => setActiveStudent(st)}
      />

      <React.Suspense fallback={null}>
        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onSuccess={() => setView('admin')}
          />
        )}

        {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            settings={settings}
            onClose={() => setIsSettingsModalOpen(false)}
            onSaveSettings={handleUpdateSettings}
          />
        )}

        {isInstallModalOpen && (
          <InstallAppModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
            canInstallNative={canInstall}
            onNativeInstall={triggerInstall}
            isInstalled={isInstalled}
          />
        )}

        {isManualModalOpen && (
          <UserManualModal
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
          />
        )}
      </React.Suspense>

      <AudioPermissionModal
        isOpen={isAudioPermModalOpen}
        onClose={() => setIsAudioPermModalOpen(false)}
        onGranted={() => setIsAudioPermModalOpen(false)}
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
