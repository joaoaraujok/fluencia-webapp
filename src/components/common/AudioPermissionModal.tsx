import React, { useState } from 'react';
import { Mic, CheckCircle2, AlertCircle, RefreshCw, X, ShieldAlert, Smartphone } from 'lucide-react';
import { speechService } from '../../services/speechService';

interface AudioPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted: () => void;
}

export const AudioPermissionModal: React.FC<AudioPermissionModalProps> = ({
  isOpen,
  onClose,
  onGranted
}) => {
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<
    'idle' | 'granted' | 'denied' | 'insecure_context' | 'not_supported' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const isSecure = speechService.isSecureEnvironment();

  const handleRequestPermission = async () => {
    setIsRequesting(true);

    const result = await speechService.checkAndRequestPermission();
    setIsRequesting(false);

    if (result.granted) {
      setPermissionState('granted');
      onGranted();
    } else {
      setPermissionState(result.state);
      setErrorMessage(result.message || 'Acesso ao microfone não concedido.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content text-center max-w-lg">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
          <Mic className="w-10 h-10 animate-bounce" />
        </div>

        <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">
          Permissão de Microfone
        </h2>

        <p className="text-sm sm:text-base text-slate-600 mb-5 font-medium leading-relaxed">
          Precisamos ouvir a criança falar para analisar a fluência oral e fornecer o relatório pedagógico em tempo real.
        </p>

        {/* Diagnóstico de Contexto Não Seguro (HTTP em celular via IP de rede local) */}
        {!isSecure && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs sm:text-sm text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Conexão HTTP no Celular</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              Os navegadores de celular (Chrome e Safari) <strong>não exibem o diálogo de microfone</strong> quando conectados via endereço IP não criptografado (HTTP).
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 text-[11px] leading-relaxed text-slate-700">
              <strong>Como usar no celular durante os testes locais:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>No Chrome Android: acesse <code className="bg-amber-100 px-1 rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>, adicione a URL atual e reinicie.</li>
                <li>Ou teste diretamente no navegador do computador em <strong>localhost:5173</strong>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Mensagem de Bloqueio se o usuário negou anteriormente */}
        {permissionState === 'denied' && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs sm:text-sm text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-700">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Acesso ao Microfone Bloqueado</span>
            </div>
            <p className="leading-relaxed text-rose-800">
              Para liberar: clique no ícone de <strong>cadeado</strong> ou <strong>configurações do site</strong> ao lado da barra de endereços do navegador e mude o Microfone para <strong>Permitir</strong>.
            </p>
          </div>
        )}

        {/* Outro erro */}
        {(permissionState === 'not_supported' || permissionState === 'error') && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs sm:text-sm text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="btn-primary w-full py-3.5 text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Solicitando ao navegador...</span>
              </>
            ) : permissionState === 'denied' ? (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Tentar Novamente</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Autorizar Microfone</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Agora não, voltar ao início
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          🔒 <strong>Privacidade protegida:</strong> O áudio é processado localmente no dispositivo para avaliação pedagógica.
        </p>
      </div>
    </div>
  );
};
