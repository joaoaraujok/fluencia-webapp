import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  School as SchoolIcon,
  Users,
  BookOpen,
  UserCheck,
  Shield,
  FileSpreadsheet,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { School, SchoolClass, Student } from '../../types/school';
import { QuestionItem } from '../../types/question';

interface AdminDashboardProps {
  onBack: () => void;
}

type TabType = 'overview' | 'schools' | 'classes' | 'students' | 'questions' | 'users' | 'audit' | 'reports';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Estados de dados
  const [overview, setOverview] = useState<any>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classReportData, setClassReportData] = useState<any>(null);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: TabType) => {
    setIsLoading(true);
    try {
      if (tab === 'overview') {
        const data = await api.getAnalyticsOverview();
        setOverview(data);
      } else if (tab === 'schools') {
        const res = await api.getSchools();
        setSchools(res.schools || []);
      } else if (tab === 'classes') {
        const res = await api.getClasses();
        setClasses(res.classes || []);
      } else if (tab === 'students') {
        const res = await api.getStudents(selectedClassId || undefined);
        setStudents(res.students || []);
      } else if (tab === 'questions') {
        const res = await api.getQuestions(false);
        setQuestions(res.questions || []);
      } else if (tab === 'users' && hasRole('SUPERADMIN')) {
        const res: any = await (api as any).request('/users');
        setUsersList(res.users || []);
      } else if (tab === 'audit' && hasRole('SUPERADMIN')) {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs || []);
      } else if (tab === 'reports') {
        const resCls = await api.getClasses();
        setClasses(resCls.classes || []);
        if (resCls.classes && resCls.classes.length > 0) {
          const cId = selectedClassId || resCls.classes[0].id;
          setSelectedClassId(cId);
          const rep = await api.getClassReport(cId);
          setClassReportData(rep);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados da aba:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReportClass = async (classId: string) => {
    setSelectedClassId(classId);
    setIsLoading(true);
    try {
      const rep = await api.getClassReport(classId);
      setClassReportData(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Topo com Título e Perfil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 leading-tight">
              Painel Institucional & Gestão
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Conectado como <strong className="text-slate-800">{user?.name}</strong> ({user?.role})
            </p>
          </div>
        </div>

        <button
          onClick={() => loadTabData(activeTab)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`tab-btn ${activeTab === 'reports' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Relatório de Turma</span>
        </button>

        <button
          onClick={() => setActiveTab('schools')}
          className={`tab-btn ${activeTab === 'schools' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <SchoolIcon className="w-4 h-4" />
          <span>Escolas</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`tab-btn ${activeTab === 'classes' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <Users className="w-4 h-4" />
          <span>Turmas</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`tab-btn ${activeTab === 'students' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Estudantes</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`tab-btn ${activeTab === 'questions' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Banco de Questões</span>
        </button>

        {hasRole('SUPERADMIN') && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`tab-btn ${activeTab === 'users' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Usuários (RBAC)</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`tab-btn ${activeTab === 'audit' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Auditoria</span>
            </button>
          </>
        )}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escolas</span>
              <p className="font-display font-black text-3xl text-indigo-600 mt-1">{overview?.totals?.schools ?? 1}</p>
            </div>
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turmas</span>
              <p className="font-display font-black text-3xl text-sky-600 mt-1">{overview?.totals?.classes ?? 1}</p>
            </div>
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estudantes</span>
              <p className="font-display font-black text-3xl text-emerald-600 mt-1">{overview?.totals?.students ?? 3}</p>
            </div>
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avaliações</span>
              <p className="font-display font-black text-3xl text-amber-600 mt-1">{overview?.totals?.evaluations ?? 0}</p>
            </div>
          </div>

          {/* Médias e Avaliações Recentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 bg-white border-slate-200 space-y-4">
              <h3 className="font-bold text-base text-slate-800">Médias Consolidadas da Rede</h3>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">Precisão Média</span>
                  <p className="font-display font-black text-4xl text-slate-800">{overview?.averages?.accuracy ?? 0}%</p>
                </div>
                <div className="h-10 w-px bg-slate-200"></div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">Tempo Médio Resposta</span>
                  <p className="font-display font-black text-4xl text-slate-800">
                    {((overview?.averages?.responseTimeMs ?? 0) / 1000).toFixed(1)} s
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-white border-slate-200 space-y-3">
              <h3 className="font-bold text-base text-slate-800">Avaliações Recentes</h3>
              {overview?.recentEvaluations && overview.recentEvaluations.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {overview.recentEvaluations.map((ev: any) => (
                    <li key={ev.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50">
                      <span className="font-bold text-slate-800">{ev.student?.name}</span>
                      <span className="text-slate-500 font-semibold">{ev.accuracyPercentage}% ({((ev.averageResponseTimeMs || 0)/1000).toFixed(1)}s)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhuma avaliação recente registrada no servidor.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Relatório por Turma */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {classes.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Selecionar Turma:</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleSelectReportClass(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 w-full max-w-md"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.gradeYear} ({c.school?.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {classReportData && (
            <div className="card p-6 bg-white border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-slate-900">
                    {classReportData.class?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {classReportData.class?.gradeYear} • {classReportData.class?.school?.name} ({classReportData.class?.school?.city}/{classReportData.class?.school?.state})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Avaliados</span>
                    <p className="font-black text-slate-800 text-sm">
                      {classReportData.metrics?.evaluatedCount} de {classReportData.metrics?.totalStudents} estudantes
                    </p>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Média Turma</span>
                    <p className="font-black text-indigo-600 text-sm">
                      {classReportData.metrics?.averageAccuracy}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela de Estudantes da Turma */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-3">Estudante</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Situação</th>
                      <th className="py-2.5 px-3 text-right">Acurácia</th>
                      <th className="py-2.5 px-3 text-right">Tempo Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classReportData.students?.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-800">{st.name}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{st.registrationNumber || '—'}</td>
                        <td className="py-3 px-3">
                          {st.hasEvaluation ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              Avaliado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-800">
                          {st.latestEvaluation ? `${st.latestEvaluation.accuracyPercentage}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 text-xs">
                          {st.latestEvaluation ? `${((st.latestEvaluation.averageResponseTimeMs || 0)/1000).toFixed(1)} s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Escolas */}
      {activeTab === 'schools' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-800">Escolas Cadastradas</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {schools.map((sc) => (
              <div key={sc.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{sc.name}</h4>
                  <p className="text-xs text-slate-400">{sc.city}/{sc.state} {sc.code ? `• Código: ${sc.code}` : ''}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {sc._count?.classes ?? 0} Turmas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turmas */}
      {activeTab === 'classes' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <h3 className="font-bold text-base text-slate-800">Turmas Escolares</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classes.map((cl) => (
              <div key={cl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <h4 className="font-bold text-sm text-slate-800">{cl.name}</h4>
                <p className="text-xs text-slate-500">{cl.gradeYear} • Ano {cl.schoolYear} • Turno {cl.shift}</p>
                <p className="text-xs font-semibold text-slate-400">{cl.school?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estudantes */}
      {activeTab === 'students' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <h3 className="font-bold text-base text-slate-800">Base Geral de Estudantes</h3>
          <div className="divide-y divide-slate-100">
            {students.map((st) => (
              <div key={st.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{st.name}</h4>
                  <p className="text-xs text-slate-400">
                    Turma: {st.class?.name || 'Geral'} {st.registrationNumber ? `• Matrícula: ${st.registrationNumber}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banco de Questões (Nível 1 Pré-Leitor e Nível 2 Leitor) */}
      {activeTab === 'questions' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-800">Banco de Itens e Questões Pedagógicas</h3>
              <p className="text-xs text-slate-400">Classificação oficial: Nível 1 — Pré-Leitor e Nível 2 — Leitor</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {questions.length} itens cadastrados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl border border-slate-200 text-center bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <p className="font-black text-sm text-slate-800 leading-tight">{q.text}</p>
                <span
                  className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded-md mt-1 uppercase ${
                    q.level === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {q.level === 1 ? 'Pré-Leitor' : 'Leitor'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usuários (Superadmin) */}
      {activeTab === 'users' && hasRole('SUPERADMIN') && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <h3 className="font-bold text-base text-slate-800">Usuários do Sistema (Controle RBAC)</h3>
          <div className="divide-y divide-slate-100">
            {usersList.map((u) => (
              <div key={u.id} className="py-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{u.name}</h4>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${
                    u.role === 'SUPERADMIN'
                      ? 'bg-purple-50 text-purple-700'
                      : u.role === 'ADMIN'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auditoria (Superadmin) */}
      {activeTab === 'audit' && hasRole('SUPERADMIN') && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <h3 className="font-bold text-base text-slate-800">Trilha de Auditoria (Logs Imutáveis)</h3>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-indigo-700 uppercase mr-2">[{log.action}]</span>
                  <span className="text-slate-800 font-semibold">{log.entity}</span>
                  <span className="text-slate-400 ml-2">por {log.user?.name || 'Sistema'}</span>
                </div>
                <span className="text-slate-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
