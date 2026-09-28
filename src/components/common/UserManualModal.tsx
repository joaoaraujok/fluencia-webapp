import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Play,
  CheckCircle2,
  WifiOff,
  Users,
  Clock,
  Mic,
  Keyboard,
  ShieldCheck,
  Printer,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'protocol' | 'evaluation' | 'metrics' | 'offline' | 'management';
}

type TabKey = 'protocol' | 'evaluation' | 'metrics' | 'offline' | 'management';

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'protocol'
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay cursor-pointer print:static print:p-0 print:bg-white print:block"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-title"
    >
      <div
        className="modal-content !max-w-4xl !p-0 !max-h-[92vh] flex flex-col overflow-hidden cursor-default print:shadow-none print:border-none print:max-w-none print:max-h-none print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal (Fixo no topo) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0 print:bg-white print:border-b-2 print:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs print:hidden">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="manual-title" className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  Manual de Uso &amp; Guia do Educador
                </h2>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  v2026 Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Roteiro prático de aplicação, protocolo adaptativo em 4 etapas e interpretação das métricas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer print:hidden"
              title="Imprimir ou salvar manual em PDF"
              aria-label="Imprimir manual"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer print:hidden"
              aria-label="Fechar manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Navegação por Abas (Fixa) */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 overflow-x-auto no-scrollbar gap-1 sm:gap-2 shrink-0 print:hidden">
          <button
            onClick={() => setActiveTab('protocol')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'protocol'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Protocolo &amp; Níveis</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'evaluation'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Play className="w-4 h-4 text-indigo-600" />
            <span>Passo a Passo</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'metrics'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Métricas &amp; Diagnóstico</span>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'offline'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <WifiOff className="w-4 h-4 text-indigo-600" />
            <span>Offline &amp; PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('management')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'management'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Gestão &amp; Perfis</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico da Aba com Rolagem Suave */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-700 text-sm leading-relaxed print:overflow-visible print:p-0">
          {/* ABA 1: PROTOCOLO PEDAGÓGICO E NÍVEIS */}
          {activeTab === 'protocol' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-indigo-950 text-sm">
                    Fundamentação e Alinhamento Pedagógico
                  </h3>
                  <p className="text-xs text-indigo-900/90 mt-1 leading-relaxed">
                    O FluencIA está estruturado em estrita conformidade com as diretrizes do <strong>Compromisso Nacional Criança Alfabetizada (Decreto 11.556/2023)</strong> e as matrizes do <strong>Saeb Alfabetização (Inep/MEC)</strong>. A avaliação é formativa e diagnóstica, priorizando o acolhimento da criança.
                  </p>
                </div>
              </div>

              {/* As 4 Etapas da Jornada */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>A Jornada Adaptativa em 4 Etapas</span>
                </h4>
                <p className="text-xs text-slate-500">
                  A criança progride apenas enquanto demonstra domínio da etapa anterior, garantindo que o teste não gere frustração ou desgaste desnecessário.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-1.5">
                      <span>ETAPA 1</span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono text-[11px]">10s / item</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">Reconhecimento de Letras</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Vogais e consoantes do alfabeto. Se a criança acertar menos de 10 letras, o teste encerra como <strong>Pré-Leitor 1</strong>.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-1.5">
                      <span>ETAPA 2</span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono text-[11px]">10s / item</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">Palavras Isoladas</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Palavras simples (CV-CV), médias e complexas. Se a criança atingir ≥ 21 PCPM, ela avança para a leitura de texto.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-1.5">
                      <span>ETAPA 3</span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono text-[11px]">Até 60s</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">Texto em Contexto</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pequena narrativa contextualizada. Para ser considerado <strong>Leitor Fluente</strong>, a criança deve atingir ≥ 65 PCPM com &gt; 90% de precisão.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-1.5">
                      <span>ETAPA 4</span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono text-[11px]">15s / frase</span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">Prosódia em Frases</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Apresentada <em>exclusivamente</em> para confirmação de expressividade, entonação e ritmo de crianças leitoras fluentes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela dos 6 Níveis Oficiais */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Os 6 Níveis Oficiais de Fluência Leitora</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5 whitespace-nowrap">Nível</th>
                        <th className="py-3 px-3.5">Critério de Classificação</th>
                        <th className="py-3 px-3.5">Encaminhamento Pedagógico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-amber-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                            Pré-Leitor 1
                          </span>
                        </td>
                        <td className="py-3 px-3.5">&lt; 10 letras reconhecidas na Etapa 1.</td>
                        <td className="py-3 px-3.5">Atividades de consciência fonológica, rimas e conhecimento do alfabeto.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-amber-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                            Pré-Leitor 2
                          </span>
                        </td>
                        <td className="py-3 px-3.5">≥ 10 letras, mas 0 palavras isoladas lidas.</td>
                        <td className="py-3 px-3.5">Síntese fonêmica inicial e junção de sílabas canônicas (CV).</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-amber-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                            Pré-Leitor 3
                          </span>
                        </td>
                        <td className="py-3 px-3.5">1 a 10 palavras isoladas lidas corretamente.</td>
                        <td className="py-3 px-3.5">Ampliação de vocabulário básico e leitura de palavras simples familiares.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-blue-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800">
                            Leitor Iniciante 1
                          </span>
                        </td>
                        <td className="py-3 px-3.5">11 a 20 PCPM em palavras isoladas.</td>
                        <td className="py-3 px-3.5">Prática de dígrafos e encontros consonantais para ganho de agilidade.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3 px-3.5 font-bold text-blue-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800">
                            Leitor Iniciante 2
                          </span>
                        </td>
                        <td className="py-3 px-3.5">≥ 21 PCPM em palavras, mas não atinge fluência plena no texto (&lt;65 PCPM ou &lt;90% acurácia).</td>
                        <td className="py-3 px-3.5">Leitura repetida de pequenos parágrafos para automatizar a decodificação textual.</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 bg-emerald-50/30">
                        <td className="py-3 px-3.5 font-bold text-emerald-700 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                            Leitor Fluente
                          </span>
                        </td>
                        <td className="py-3 px-3.5">≥ 65 PCPM com &gt; 90% de precisão no texto narrativo e boa prosódia.</td>
                        <td className="py-3 px-3.5">Leitura autônoma de livros infantis, interpretação textual e inferências.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Limite de Tempo e Proteção */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-0.5 text-amber-900">Teto Global de 4 Minutos (240 segundos)</strong>
                  O sistema possui um limite de tempo máximo absoluto de 240 segundos para toda a sessão. Caso este tempo seja atingido, a avaliação é imediatamente concluída e o diagnóstico é gerado com base em todas as evidências já coletadas, evitando sobrecarga ou estresse para a criança.
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: PASSO A PASSO DA APLICAÇÃO */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4">
                <h4 className="font-display font-bold text-base text-slate-900">
                  Roteiro Prático de Aplicação em Sala de Aula
                </h4>

                <div className="space-y-3.5">
                  <div className="flex gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      1
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-900 block text-sm">Selecionar o Estudante e a Turma</strong>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Clique em &quot;Selecionar Estudante&quot; no topo da tela ou na página inicial. Escolha a escola, turma e confirme o nome do aluno antes de iniciar.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      2
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-900 block text-sm">Preparação Acústica (Verificação do Ambiente)</strong>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Ao clicar em &quot;Iniciar Avaliação&quot;, a tela de verificação acústica é aberta. Posicione o dispositivo a <strong>20-30 cm</strong> da boca da criança. Peça para a criança dizer &quot;Oi&quot; ou falar o próprio nome para checar a barra verde de nível de voz (VU meter). Marque o checklist e confirme.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      3
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-900 block text-sm">Contagem Regressiva e Leitura dos Itens</strong>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Após a contagem 3... 2... 1..., as palavras ou letras surgem na tela em fonte limpa e destacada. A criança tem até 10 segundos por item para ler. Vigora o <strong>modo silencioso</strong> (sem bipes ou sons que distraiam a criança).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      4
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-900 block text-sm">Avanço Suave e Automático</strong>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Quando a criança lê a palavra correta, o sistema detecta e avança suavemente em 250ms. Se a criança fizer uma tentativa parcial ou terminar a fala, uma pausa de silêncio de 1.2s avança o item sem forçar a criança a esperar segundos em silêncio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Painel de Atalhos de Teclado */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-indigo-600" />
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Atalhos de Teclado &amp; Controle do Educador
                  </h5>
                </div>
                <p className="text-xs text-slate-600">
                  O educador possui controle total durante a aplicação através de atalhos rápidos de teclado:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-700 font-medium">Pular ou Avançar Item</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Espaço / Seta Direita
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-700 font-medium">Forçar Marcação como Correto</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Tecla 1
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-700 font-medium">Forçar Marcação como Incorreto</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Tecla 2
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-700 font-medium">Interromper Avaliação</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      ESC
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Boas Práticas Acústicas */}
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs uppercase tracking-wider">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  <span>Checklist de Ouro para a Sala de Aula</span>
                </div>
                <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside">
                  <li>Evite conversas paralelas de outros alunos próximas ao microfone.</li>
                  <li>Não aponte ventiladores ou ar-condicionado diretamente para o dispositivo.</li>
                  <li>Em celulares, mantenha o aparelho apoiado sobre a mesa (evite segurar com as mãos cobrindo o microfone).</li>
                </ul>
              </div>
            </div>
          )}

          {/* ABA 3: MÉTRICAS E RESULTADOS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-3">
                <h4 className="font-display font-bold text-base text-slate-900">
                  Como Interpretar o Painel de Resultados
                </h4>
                <p className="text-xs text-slate-500">
                  O painel apresenta indicadores quantitativos auditáveis e um parecer pedagógico claro sem jargões clínicos.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1 shadow-2xs">
                    <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      PCPM (Palavras Corretas Por Minuto)
                    </div>
                    <div className="text-sm font-bold text-slate-900">Velocidade Leitora</div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Calculado pela razão entre as palavras decodificadas corretamente e o tempo decorrido. Indica se a decodificação está automatizada ou ainda exige alto esforço cognitivo.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1 shadow-2xs">
                    <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Acurácia Global (%)
                    </div>
                    <div className="text-sm font-bold text-slate-900">Precisão Fonológica</div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Porcentagem de itens lidos com exatidão fonética. Acertos plenos pontuam 100%; pequenas variações infantis fonéticas aceitas pontuam 50%.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      Tempo Médio de Resposta (s)
                    </div>
                    <div className="text-sm font-bold text-slate-900">Latência de Decodificação</div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Intervalo médio entre o estímulo aparecer na tela e a criança emitir a primeira vocalização. Tempos abaixo de 1.5s indicam alta prontidão.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1 shadow-2xs">
                    <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      Status de Itens Auditáveis
                    </div>
                    <div className="text-sm font-bold text-slate-900">Auditoria Detalhada</div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Cada item é classificado em <em>Correto</em>, <em>Possivelmente Correto</em>, <em>Incorreto</em>, <em>Sem Resposta</em> ou <em>Não Reconhecido</em> (ruído de microfone).
                    </p>
                  </div>
                </div>
              </div>

              {/* O Resumo Executivo das 7 Perguntas */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    As 7 Perguntas Pedagógicas do Resumo Executivo
                  </h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <strong>1. Nível Atual:</strong> Em qual dos 6 estágios a criança se encontra?
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <strong>2. O que consegue fazer:</strong> Habilidades já dominadas com segurança.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <strong>3. Principais dificuldades:</strong> Tipos de sílabas ou fonemas em que hesita.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <strong>4. Dados que sustentam:</strong> Evidências numéricas e taxa de PCPM.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <strong>5. Qualidade da leitura:</strong> Fluida, silabada, lenta ou expressiva.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <strong>6. Pontos de atenção:</strong> O que necessita mediação imediata do educador.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs col-span-1 sm:col-span-2">
                    <strong>7. Recomendações em sala:</strong> Sugestões de práticas, rimas, jogos e leitura compartilhada.
                  </div>
                </div>
              </div>

              {/* Aviso Ético */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-950 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-0.5 text-rose-900">Natureza Formativa e Pedagógica</strong>
                  O FluencIA não realiza diagnóstico clínico de dislexia, TDAH ou transtornos de fala. A ferramenta é um apoio técnico à alfabetização e a palavra final é sempre do professor regente e da equipe pedagógica.
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: MODO OFFLINE E PWA */}
          {activeTab === 'offline' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  <span>Arquitetura Offline-First (Sem Dependência de Internet)</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O FluencIA foi concebido para funcionar com excelência em escolas públicas e regiões com sinal instável ou ausente de internet. Todos os dados coletados durante a avaliação são gravados localmente no banco de dados seguro do navegador (IndexedDB/Dexie) com identificadores universais únicos (UUIDv4).
                </p>
              </div>

              {/* Como Funciona a Sincronização */}
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-900 text-sm">
                  Fluxo de Sincronização com o Servidor Central
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1.5 shadow-2xs">
                    <span className="font-bold text-indigo-600">Passo 1</span>
                    <div className="font-semibold text-slate-800 text-sm">Avaliação na Sala</div>
                    <p className="text-slate-500 leading-relaxed">
                      O teste transcorre sem necessidade de internet. A avaliação é salva instantaneamente na memória local com status <code>pending</code>.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1.5 shadow-2xs">
                    <span className="font-bold text-indigo-600">Passo 2</span>
                    <div className="font-semibold text-slate-800 text-sm">Aviso no Cabeçalho</div>
                    <p className="text-slate-500 leading-relaxed">
                      O botão âmbar no topo do aplicativo exibirá o número de avaliações pendentes (ex: &quot;3 pendentes&quot;).
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1.5 shadow-2xs">
                    <span className="font-bold text-indigo-600">Passo 3</span>
                    <div className="font-semibold text-slate-800 text-sm">Sincronização em 1 Clique</div>
                    <p className="text-slate-500 leading-relaxed">
                      Ao conectar o aparelho ao Wi-Fi, clique no botão &quot;Sincronizar&quot; ou deixe a reconexão automática transmitir os dados em lote com idempotência.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instalação do PWA */}
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/50 space-y-3">
                <h5 className="font-semibold text-indigo-950 text-sm">
                  Como Instalar o Aplicativo no Dispositivo (PWA)
                </h5>
                <ul className="text-xs text-indigo-900 space-y-2 list-disc list-inside">
                  <li><strong>No Computador (Chrome/Edge):</strong> Clique no botão &quot;Instalar&quot; no cabeçalho ou no ícone de monitor na barra de endereços do navegador.</li>
                  <li><strong>No Celular Android (Chrome):</strong> Toque no menu de três pontos (⋮) e selecione &quot;Adicionar à tela inicial&quot; ou &quot;Instalar aplicativo&quot;.</li>
                  <li><strong>No iPhone/iPad (Safari):</strong> Toque no ícone de Compartilhar (quadrado com seta para cima) e selecione &quot;Adicionar à Tela de Início&quot;.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ABA 5: GESTÃO E PERFIS */}
          {activeTab === 'management' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-3">
                <h4 className="font-display font-bold text-base text-slate-900">
                  Perfis de Acesso e Matriz de Permissões (RBAC)
                </h4>
                <p className="text-xs text-slate-500">
                  O sistema protege os dados escolares através de autenticação institucional com tokens JWT e controle estrito de permissões.
                </p>

                <div className="space-y-2.5">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          SUPERADMIN
                        </span>
                        <span className="text-sm font-semibold text-slate-900">Administrador Geral da Rede</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Acesso total: criação de usuários, gestão de critérios versionados, parametrização de banco de itens e visualização de logs imutáveis de auditoria.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          ADMIN
                        </span>
                        <span className="text-sm font-semibold text-slate-900">Gestor Escolar / Diretor</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Gestão das unidades escolares, cadastro de turmas, alunos, acompanhamento de relatórios consolidados e exportação analítica.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          SUPERVISOR
                        </span>
                        <span className="text-sm font-semibold text-slate-900">Professor / Avaliador</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Aplicação das sessões de leitura com as crianças, verificação acústica de sala de aula, consulta de relatórios dos seus estudantes e anotações formativas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conformidade com a LGPD e Minimização de Dados */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Conformidade com a LGPD (Lei nº 13.709/2018)</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong>Minimização:</strong> Coletam-se exclusivamente nome, data de nascimento e matrícula interna. Jamais são solicitados CPF, endereço residencial ou filiação.</li>
                  <li><strong>Privacidade do Áudio:</strong> Nenhum arquivo de áudio de voz infantil é armazenado ou mantido em servidores de nuvem. A análise ocorre de forma volátil em memória.</li>
                  <li><strong>Auditoria:</strong> Todas as alterações de cadastros e notas ficam registradas com carimbo de tempo, IP e identificador do usuário.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Fechamento e Botões de Apoio (Fixo no rodapé) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0 print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Consulte o Caderno de Orientações na pasta docs do projeto para especificações pedagógicas completas.</span>
          </div>

          <button
            onClick={onClose}
            className="btn-primary text-xs px-6 py-2 cursor-pointer w-full sm:w-auto"
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
