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
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Search,
  MessageSquare,
  Play,
  X,
  Building,
  Eye,
  Sparkles,
  FileText,
  Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { School, SchoolClass, Student } from '../../types/school';
import { QuestionItem } from '../../types/question';
import { UserProfile, UserRole } from '../../types/auth';
import { AnalyticsOverviewResponse, AuditLogItem, ClassReportResponse } from '../../types/api';

interface AdminDashboardProps {
  onBack: () => void;
  onSelectStudentForTest?: (student: Student) => void;
}

type TabType = 'overview' | 'reports' | 'evaluations_review' | 'schools' | 'classes' | 'students' | 'questions' | 'users' | 'audit';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onSelectStudentForTest }) => {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPERADMIN');
  const isAdmin = hasRole('ADMIN');
  const isSupervisor = hasRole('SUPERVISOR');

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Estados de dados
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros e busca
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [classReportData, setClassReportData] = useState<ClassReportResponse | null>(null);

  // Modais de CRUD (Superadmin)
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState<boolean>(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolForm, setSchoolForm] = useState({ name: '', code: '', city: '', state: 'SP' });

  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classForm, setClassForm] = useState({
    schoolId: '',
    name: '',
    gradeYear: '1º Ano',
    schoolYear: new Date().getFullYear(),
    shift: 'MANHA' as 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE'
  });

  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    classId: '',
    name: '',
    registrationNumber: '',
    birthDate: '',
    notes: ''
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    schoolId: string;
    active: boolean;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'SUPERVISOR',
    schoolId: '',
    active: true
  });

  // Modal de Avaliação de Relatório (Admin e Superadmin)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewingSession, setReviewingSession] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({
    adminFeedback: '',
    adminReviewStatus: 'APROVADO'
  });

  // Modal de Detalhes Completos do Relatório (IA + Supervisor + Gestão)
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedReportSession, setSelectedReportSession] = useState<any | null>(null);
  const [reportSupervisorNotes, setReportSupervisorNotes] = useState<string>('');
  const [isEditingReportNotes, setIsEditingReportNotes] = useState<boolean>(false);
  const [isSavingReportNotes, setIsSavingReportNotes] = useState<boolean>(false);

  // Notificações na UI
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

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
        const resCls = await api.getClasses(selectedSchoolFilter || undefined);
        setClasses(resCls.classes || []);
        if (schools.length === 0) {
          const resSch = await api.getSchools();
          setSchools(resSch.schools || []);
        }
      } else if (tab === 'students') {
        const res = await api.getStudents(selectedClassId || undefined, studentSearch || undefined);
        setStudents(res.students || []);
        if (classes.length === 0) {
          const resCls = await api.getClasses();
          setClasses(resCls.classes || []);
        }
      } else if (tab === 'reports') {
        const resCls = await api.getClasses();
        setClasses(resCls.classes || []);
        if (resCls.classes && resCls.classes.length > 0) {
          const cId = selectedClassId || resCls.classes[0].id;
          setSelectedClassId(cId);
          const rep = await api.getClassReport(cId);
          setClassReportData(rep);
        }
      } else if (tab === 'evaluations_review') {
        const res = await api.getEvaluations();
        setEvaluationsList(res.evaluations || []);
      } else if (tab === 'questions') {
        const res = await api.getQuestions(false);
        setQuestions(res.questions || []);
      } else if (tab === 'users' && isSuperAdmin) {
        const res = await api.getUsers();
        setUsersList(res.users || []);
        if (schools.length === 0) {
          const resSch = await api.getSchools();
          setSchools(resSch.schools || []);
        }
      } else if (tab === 'audit' && isSuperAdmin) {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados da aba:', err);
      showNotification(err.message || 'Falha ao carregar dados.', 'error');
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
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Erro ao carregar relatório da turma.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD Escolas (Superadmin)
  const handleOpenSchoolModal = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      setSchoolForm({
        name: school.name,
        code: school.code || '',
        city: school.city,
        state: school.state
      });
    } else {
      setEditingSchool(null);
      setSchoolForm({ name: '', code: '', city: '', state: 'SP' });
    }
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim() || !schoolForm.city.trim() || !schoolForm.state.trim()) {
      alert('Preencha os campos obrigatórios (Nome, Cidade, UF).');
      return;
    }
    try {
      if (editingSchool) {
        await api.updateSchool(editingSchool.id, {
          name: schoolForm.name.trim(),
          code: schoolForm.code.trim() || undefined,
          city: schoolForm.city.trim(),
          state: schoolForm.state.trim().toUpperCase()
        });
        showNotification('Escola atualizada com sucesso!');
      } else {
        await api.createSchool({
          name: schoolForm.name.trim(),
          code: schoolForm.code.trim() || undefined,
          city: schoolForm.city.trim(),
          state: schoolForm.state.trim().toUpperCase()
        });
        showNotification('Nova escola cadastrada com sucesso!');
      }
      setIsSchoolModalOpen(false);
      loadTabData('schools');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao salvar escola.', 'error');
    }
  };

  const handleDeleteSchool = async (school: School) => {
    if (!confirm(`Tem certeza de que deseja remover a escola "${school.name}"? Todas as turmas, alunos e registros vinculados serão excluídos permanentemente.`)) {
      return;
    }
    try {
      await api.deleteSchool(school.id);
      showNotification('Escola removida com sucesso!');
      loadTabData('schools');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao remover escola.', 'error');
    }
  };

  // CRUD Turmas / Salas (Superadmin)
  const handleOpenClassModal = (cls?: SchoolClass) => {
    if (schools.length === 0) {
      api.getSchools().then((r) => setSchools(r.schools || []));
    }
    if (cls) {
      setEditingClass(cls);
      setClassForm({
        schoolId: cls.schoolId,
        name: cls.name,
        gradeYear: cls.gradeYear,
        schoolYear: cls.schoolYear,
        shift: cls.shift as any
      });
    } else {
      setEditingClass(null);
      setClassForm({
        schoolId: schools[0]?.id || '',
        name: '',
        gradeYear: '1º Ano',
        schoolYear: new Date().getFullYear(),
        shift: 'MANHA'
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.schoolId || !classForm.name.trim()) {
      alert('Selecione a escola e preencha o nome da turma.');
      return;
    }
    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          name: classForm.name.trim(),
          gradeYear: classForm.gradeYear.trim(),
          schoolYear: Number(classForm.schoolYear),
          shift: classForm.shift
        });
        showNotification('Turma atualizada com sucesso!');
      } else {
        await api.createClass({
          schoolId: classForm.schoolId,
          name: classForm.name.trim(),
          gradeYear: classForm.gradeYear.trim(),
          schoolYear: Number(classForm.schoolYear),
          shift: classForm.shift
        });
        showNotification('Nova turma criada com sucesso!');
      }
      setIsClassModalOpen(false);
      loadTabData('classes');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao salvar turma.', 'error');
    }
  };

  const handleDeleteClass = async (cls: SchoolClass) => {
    if (!confirm(`Deseja remover a turma "${cls.name}"? Todos os alunos e avaliações desta turma serão excluídos.`)) {
      return;
    }
    try {
      await api.deleteClass(cls.id);
      showNotification('Turma removida com sucesso!');
      loadTabData('classes');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao remover turma.', 'error');
    }
  };

  // CRUD Estudantes / Alunos (Superadmin)
  const handleOpenStudentModal = (student?: Student) => {
    if (classes.length === 0) {
      api.getClasses().then((r) => setClasses(r.classes || []));
    }
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        classId: student.classId,
        name: student.name,
        registrationNumber: student.registrationNumber || '',
        birthDate: student.birthDate ? String(student.birthDate).split('T')[0] : '',
        notes: student.notes || ''
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        classId: selectedClassId || classes[0]?.id || '',
        name: '',
        registrationNumber: '',
        birthDate: '',
        notes: ''
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.classId) {
      alert('Nome do estudante e turma são obrigatórios.');
      return;
    }
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          classId: studentForm.classId,
          name: studentForm.name.trim(),
          registrationNumber: studentForm.registrationNumber.trim() || undefined,
          birthDate: studentForm.birthDate || undefined,
          notes: studentForm.notes.trim() || undefined
        });
        showNotification('Dados do estudante atualizados!');
      } else {
        await api.createStudent({
          classId: studentForm.classId,
          name: studentForm.name.trim(),
          registrationNumber: studentForm.registrationNumber.trim() || undefined,
          birthDate: studentForm.birthDate || undefined,
          notes: studentForm.notes.trim() || undefined
        });
        showNotification('Novo estudante cadastrado!');
      }
      setIsStudentModalOpen(false);
      loadTabData('students');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao salvar estudante.', 'error');
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Deseja remover o(a) estudante "${student.name}"? O histórico de avaliações deste aluno será excluído.`)) {
      return;
    }
    try {
      await api.deleteStudent(student.id);
      showNotification('Estudante removido com sucesso!');
      loadTabData('students');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao remover estudante.', 'error');
    }
  };

  // CRUD Usuários (Admins e Supervisores) (Superadmin)
  const handleOpenUserModal = (u?: UserProfile) => {
    if (schools.length === 0) {
      api.getSchools().then((r) => setSchools(r.schools || []));
    }
    if (u) {
      setEditingUser(u);
      setUserForm({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
        schoolId: u.schoolId || '',
        active: u.active
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'SUPERVISOR',
        schoolId: schools[0]?.id || '',
        active: true
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert('Nome e E-mail são obrigatórios.');
      return;
    }
    if (!editingUser && (!userForm.password || userForm.password.length < 8)) {
      alert('Para novos usuários, a senha inicial deve ter ao menos 8 caracteres.');
      return;
    }

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          schoolId: userForm.role === 'SUPERVISOR' && userForm.schoolId ? userForm.schoolId : null,
          active: userForm.active,
          ...(userForm.password && userForm.password.length >= 8 ? { password: userForm.password } : {})
        });
        showNotification('Usuário atualizado com sucesso!');
      } else {
        await api.createUser({
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          password: userForm.password,
          role: userForm.role,
          schoolId: userForm.role === 'SUPERVISOR' && userForm.schoolId ? userForm.schoolId : null
        });
        showNotification('Novo usuário criado com sucesso!');
      }
      setIsUserModalOpen(false);
      loadTabData('users');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao salvar usuário.', 'error');
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.id === user?.id) {
      alert('Você não pode remover seu próprio usuário conectado.');
      return;
    }
    if (!confirm(`Deseja remover o usuário "${u.name}" (${u.role})?`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      showNotification('Usuário removido/desativado com sucesso!');
      loadTabData('users');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao remover usuário.', 'error');
    }
  };

  // Avaliação de Relatórios (Admin e Superadmin)
  const handleOpenReviewModal = (session: any) => {
    setReviewingSession(session);
    setReviewForm({
      adminFeedback: session.adminFeedback || '',
      adminReviewStatus: session.adminReviewStatus || 'APROVADO'
    });
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSession || !reviewForm.adminFeedback.trim()) {
      alert('Por favor, informe seu parecer avaliativo de gestão.');
      return;
    }
    try {
      await api.reviewEvaluation(reviewingSession.id, {
        adminFeedback: reviewForm.adminFeedback.trim(),
        adminReviewStatus: reviewForm.adminReviewStatus
      });
      showNotification('Parecer de gestão salvo e relatório homologado!');
      setIsReviewModalOpen(false);
      loadTabData('evaluations_review');
    } catch (err: any) {
      showNotification(err.message || 'Falha ao registrar parecer.', 'error');
    }
  };

  // Abertura e manipulação do Relatório Detalhado (IA + Supervisor + Gestão)
  const handleOpenReportDetailModal = async (sessionOrPartial: any) => {
    let sessionData = sessionOrPartial;
    if (sessionOrPartial?.id) {
      try {
        const res = await api.getEvaluationById(sessionOrPartial.id);
        if (res.session) {
          sessionData = res.session;
        }
      } catch (err) {
        console.warn('Utilizando dados disponíveis da sessão:', err);
      }
    }
    setSelectedReportSession(sessionData);
    setReportSupervisorNotes(sessionData.notes || '');
    setIsEditingReportNotes(false);
    setIsReportModalOpen(true);
  };

  const handleSaveReportSupervisorNotes = async () => {
    if (!selectedReportSession?.id) return;
    setIsSavingReportNotes(true);
    try {
      await api.updateEvaluationNotes(selectedReportSession.id, reportSupervisorNotes.trim());
      setSelectedReportSession({ ...selectedReportSession, notes: reportSupervisorNotes.trim() });
      showNotification('Observações do supervisor atualizadas com sucesso!');
      setIsEditingReportNotes(false);
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification(err.message || 'Falha ao atualizar observações.', 'error');
    } finally {
      setIsSavingReportNotes(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Banner de Notificação */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold transition-all animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Topo com Título, Perfil e Badges de Nível */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 leading-tight">
                Painel Institucional & Gestão
              </h2>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                  isSuperAdmin
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : isAdmin
                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isSuperAdmin ? 'SuperAdmin' : isAdmin ? 'Admin' : 'Supervisor'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Conectado como <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
              {isSupervisor && user?.school && (
                <span className="text-indigo-600 font-bold ml-1.5">• Escola Vinculada: {user.school.name}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTabData(activeTab)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas com Permissões Dinâmicas */}
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

        {/* Avaliação de Relatórios de Supervisores (Admin e SuperAdmin) */}
        {(isAdmin || isSuperAdmin) && (
          <button
            onClick={() => setActiveTab('evaluations_review')}
            className={`tab-btn ${activeTab === 'evaluations_review' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>Avaliar Relatórios</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('schools')}
          className={`tab-btn ${activeTab === 'schools' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          <SchoolIcon className="w-4 h-4" />
          <span>{isSupervisor ? 'Minha Escola' : 'Escolas'}</span>
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

        {/* Abas Exclusivas do Superadmin */}
        {isSuperAdmin && (
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

      {/* ABA: Visão Geral */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escolas</span>
              <p className="font-display font-black text-3xl text-indigo-600 mt-1">{overview?.totals?.schools ?? schools.length}</p>
            </div>
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turmas</span>
              <p className="font-display font-black text-3xl text-sky-600 mt-1">{overview?.totals?.classes ?? classes.length}</p>
            </div>
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estudantes</span>
              <p className="font-display font-black text-3xl text-emerald-600 mt-1">{overview?.totals?.students ?? students.length}</p>
            </div>
            <div className="card p-5 bg-white border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avaliações</span>
              <p className="font-display font-black text-3xl text-amber-600 mt-1">{overview?.totals?.evaluations ?? 0}</p>
            </div>
          </div>

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
                  {overview.recentEvaluations.map((ev) => (
                    <li
                      key={ev.id}
                      onClick={() => handleOpenReportDetailModal(ev)}
                      className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                      title="Clique para abrir o relatório completo com IA e observações do supervisor"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-800 group-hover:text-indigo-900">{ev.student?.name}</span>
                      </div>
                      <span className="text-slate-500 font-semibold group-hover:text-indigo-700">
                        {ev.accuracyPercentage}% ({((ev.averageResponseTimeMs || 0)/1000).toFixed(1)}s)
                      </span>
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

      {/* ABA: Relatório de Turma */}
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
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classReportData.students?.map((st) => (
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
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {st.hasEvaluation && st.latestEvaluation && (
                              <button
                                onClick={() => handleOpenReportDetailModal(st.latestEvaluation)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors cursor-pointer"
                                title="Ver relatório com caixa de informações da IA e observações do supervisor"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Relatório</span>
                              </button>
                            )}
                            {onSelectStudentForTest && isSupervisor && (
                              <button
                                onClick={() => {
                                  const fullStudent: Student = {
                                    id: st.id,
                                    schoolId: classReportData.class?.school?.id || '',
                                    classId: selectedClassId,
                                    name: st.name,
                                    registrationNumber: st.registrationNumber,
                                    active: true
                                  };
                                  onSelectStudentForTest(fullStudent);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                                title="Iniciar avaliação diagnóstica com este aluno"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Fazer Teste</span>
                              </button>
                            )}
                          </div>
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

      {/* ABA: Avaliar Relatórios (Admin e Superadmin) */}
      {activeTab === 'evaluations_review' && (isAdmin || isSuperAdmin) && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-800">Homologação e Pareceres de Relatórios</h3>
              <p className="text-xs text-slate-500">
                Avalie os relatórios enviados pelos supervisores, emitindo parecer formativo de gestão.
              </p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full self-start sm:self-auto">
              {evaluationsList.length} relatórios registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase">
                  <th className="py-2.5 px-3">Estudante</th>
                  <th className="py-2.5 px-3">Escola / Turma</th>
                  <th className="py-2.5 px-3">Supervisor</th>
                  <th className="py-2.5 px-3 text-center">Precisão</th>
                  <th className="py-2.5 px-3">Status Gestão</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluationsList.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{ev.student?.name}</span>
                      <span className="text-[11px] text-slate-400">Data: {new Date(ev.createdAt).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{ev.school?.name}</span>
                      <span className="text-xs text-slate-500">{ev.class?.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 block">{ev.evaluator?.name || 'Supervisor'}</span>
                      <span className="text-[11px] text-slate-400">{ev.evaluator?.email}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-slate-800 text-sm">{ev.accuracyPercentage}%</span>
                      <span className="text-[10px] text-slate-400 block">{((ev.averageResponseTimeMs || 0)/1000).toFixed(1)}s</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          ev.adminReviewStatus === 'APROVADO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ev.adminReviewStatus === 'REQUER_ATENCAO'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ev.adminReviewStatus === 'EM_OBSERVACAO'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ev.adminReviewStatus || 'PENDENTE'}
                      </span>
                      {ev.adminFeedback && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 max-w-[200px] truncate" title={ev.adminFeedback}>
                          "{ev.adminFeedback}"
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReportDetailModal(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Visualizar relatório completo com IA e observações"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        <button
                          onClick={() => handleOpenReviewModal(ev)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Avaliar este relatório e emitir parecer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Avaliar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: Escolas */}
      {activeTab === 'schools' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-800">
                {isSupervisor ? 'Minha Escola Vinculada' : 'Escolas Cadastradas'}
              </h3>
              <p className="text-xs text-slate-400">
                {isSupervisor
                  ? 'Você possui acesso apenas às turmas e alunos desta unidade escolar.'
                  : 'Gestão da rede escolar institucional e códigos municipais.'}
              </p>
            </div>

            {/* Apenas Superadmin pode criar novas escolas */}
            {isSuperAdmin && (
              <button
                onClick={() => handleOpenSchoolModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Escola</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {schools.map((sc) => (
              <div key={sc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-900">{sc.name}</h4>
                    {sc.code && (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        INEP: {sc.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sc.city} - {sc.state} • {sc._count?.classes ?? 0} Turmas • {sc._count?.students ?? 0} Alunos
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {sc._count?.classes ?? 0} Turmas
                  </span>

                  {/* Ações de Edição e Exclusão Exclusivas do Superadmin */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleOpenSchoolModal(sc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Editar escola"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchool(sc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remover escola"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Turmas / Salas */}
      {activeTab === 'classes' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-800">Turmas Escolares</h3>
              <p className="text-xs text-slate-400">Salas de aula, séries e turnos de atendimento.</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro por escola para Superadmin e Admin */}
              {!isSupervisor && schools.length > 1 && (
                <select
                  value={selectedSchoolFilter}
                  onChange={(e) => {
                    setSelectedSchoolFilter(e.target.value);
                    setIsLoading(true);
                    api.getClasses(e.target.value || undefined)
                      .then((r) => setClasses(r.classes || []))
                      .finally(() => setIsLoading(false));
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="">Todas as Escolas</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}

              {/* Apenas Superadmin pode criar novas turmas */}
              {isSuperAdmin && (
                <button
                  onClick={() => handleOpenClassModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Turma</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {classes.map((cl) => (
              <div key={cl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{cl.name}</h4>
                    <p className="text-xs font-medium text-slate-500">
                      {cl.gradeYear} • Ano {cl.schoolYear} • Turno {cl.shift}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                    {cl._count?.students ?? 0} Alunos
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-medium truncate max-w-[200px]">{cl.school?.name}</span>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenClassModal(cl)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                        title="Editar turma"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cl)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Remover turma"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Estudantes */}
      {activeTab === 'students' && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-800">Base Geral de Estudantes</h3>
              <p className="text-xs text-slate-400">
                {isSupervisor
                  ? 'Estudantes matriculados na sua escola vinculada.'
                  : 'Todos os alunos cadastrados nas escolas municipais.'}
              </p>
            </div>

            {/* Apenas Superadmin pode cadastrar estudantes */}
            {isSuperAdmin && (
              <button
                onClick={() => handleOpenStudentModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Estudante</span>
              </button>
            )}
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar estudante por nome..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadTabData('students'); }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            {classes.length > 0 && (
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setIsLoading(true);
                  api.getStudents(e.target.value || undefined, studentSearch || undefined)
                    .then((res) => setStudents(res.students || []))
                    .finally(() => setIsLoading(false));
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white"
              >
                <option value="">Todas as Turmas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.school?.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {students.map((st) => (
              <div key={st.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                  <p className="text-xs text-slate-500">
                    Turma: <strong>{st.class?.name || 'Geral'}</strong> • Escola: {st.school?.name || 'Geral'}
                    {st.registrationNumber ? ` • Matrícula: ${st.registrationNumber}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {onSelectStudentForTest && isSupervisor && (
                    <button
                      onClick={() => onSelectStudentForTest(st)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                      title="Iniciar teste diagnóstica com este estudante"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Fazer Teste</span>
                    </button>
                  )}

                  {/* Edição e Exclusão Exclusivas de Superadmin */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
                      <button
                        onClick={() => handleOpenStudentModal(st)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                        title="Editar estudante"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Remover estudante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Banco de Questões */}
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

      {/* ABA: Usuários RBAC (Exclusiva do Superadmin) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-800">Gestão de Usuários e Perfis (RBAC)</h3>
              <p className="text-xs text-slate-400">
                Crie e edite Administradores e Supervisores vinculados às escolas.
              </p>
            </div>
            <button
              onClick={() => handleOpenUserModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {usersList.map((u) => (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                        u.role === 'SUPERADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : u.role === 'ADMIN'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {u.role}
                    </span>
                    {!u.active && (
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {u.email}
                    {u.role === 'SUPERVISOR' && (
                      <span className="text-indigo-600 font-semibold ml-2">
                        • Escola Vinculada: {u.school?.name || 'Nenhuma (Acesso Geral)'}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenUserModal(u)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                    title="Editar usuário"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {u.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      title="Remover usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Trilha de Auditoria (Exclusiva do Superadmin) */}
      {activeTab === 'audit' && isSuperAdmin && (
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

      {/* MODAL: Escola (Criar / Editar) */}
      {isSchoolModalOpen && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingSchool ? 'Editar Escola' : 'Nova Escola'}
              </h3>
              <button onClick={() => setIsSchoolModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Escola *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder="Ex: Escola Municipal Monteiro Lobato"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código INEP / Identificador Municipal</label>
                <input
                  type="text"
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder="Ex: 35012345"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.city}
                    onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={schoolForm.state}
                    onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 uppercase"
                    placeholder="SP"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {editingSchool ? 'Salvar Alterações' : 'Criar Escola'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Turma / Sala (Criar / Editar) */}
      {isClassModalOpen && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingClass ? 'Editar Turma' : 'Nova Turma'}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Escola Vinculada *</label>
                <select
                  required
                  disabled={!!editingClass}
                  value={classForm.schoolId}
                  onChange={(e) => setClassForm({ ...classForm, schoolId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Turma / Sala *</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder="Ex: 1º Ano B - Alfabetização"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Série / Etapa *</label>
                  <input
                    type="text"
                    required
                    value={classForm.gradeYear}
                    onChange={(e) => setClassForm({ ...classForm, gradeYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                    placeholder="Ex: 1º Ano"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ano Letivo *</label>
                  <input
                    type="number"
                    required
                    value={classForm.schoolYear}
                    onChange={(e) => setClassForm({ ...classForm, schoolYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Turno *</label>
                <select
                  value={classForm.shift}
                  onChange={(e) => setClassForm({ ...classForm, shift: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="INTEGRAL">Integral</option>
                  <option value="NOITE">Noite</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {editingClass ? 'Salvar Alterações' : 'Criar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Estudante (Criar / Editar) */}
      {isStudentModalOpen && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Editar Estudante' : 'Novo Estudante'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Turma *</label>
                <select
                  required
                  value={studentForm.classId}
                  onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.gradeYear} ({c.school?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Aluno *</label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder="Nome do aluno"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula Escolar</label>
                  <input
                    type="text"
                    value={studentForm.registrationNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                    placeholder="Ex: 2026-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={studentForm.birthDate}
                    onChange={(e) => setStudentForm({ ...studentForm, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Pedagógicas</label>
                <textarea
                  rows={2}
                  value={studentForm.notes}
                  onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 resize-none"
                  placeholder="Notas para apoio pedagógico ou necessidades específicas..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {editingStudent ? 'Salvar Alterações' : 'Cadastrar Estudante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Usuário (Criar / Editar) - Superadmin */}
      {isUserModalOpen && isSuperAdmin && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário Institucional'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder="Ex: Professora Maria Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Institucional *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder="usuario@fluencia.edu.br"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial * (mínimo 8 caracteres)'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800"
                  placeholder={editingUser ? '••••••••' : 'Senha segura'}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perfil de Acesso (RBAC) *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="SUPERVISOR">SUPERVISOR (Aplica testes e envia relatórios da sua escola)</option>
                  <option value="ADMIN">ADMIN (Gestão, visualiza escolas e avalia relatórios)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Gerencia tudo, escolas, salas, alunos e usuários)</option>
                </select>
              </div>

              {/* Se o perfil for Supervisor, seleciona a escola vinculada */}
              {userForm.role === 'SUPERVISOR' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Escola Vinculada * <span className="text-[11px] text-slate-400 font-normal">(Supervisor só acessa esta escola)</span>
                  </label>
                  <select
                    value={userForm.schoolId}
                    onChange={(e) => setUserForm({ ...userForm, schoolId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                  >
                    <option value="">Selecione a Escola Vinculada</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city}/{s.state})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingUser && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={userForm.active}
                    onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="userActive" className="text-xs font-bold text-slate-700">
                    Usuário Ativo no Sistema
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Avaliar Relatório (Admin e Superadmin) */}
      {isReviewModalOpen && reviewingSession && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  Avaliação e Homologação de Relatório Institucional
                </h3>
                <p className="text-xs text-slate-500">
                  Estudante: <strong>{reviewingSession.student?.name}</strong> • Turma: {reviewingSession.class?.name} • Escola: {reviewingSession.school?.name}
                </p>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* CAIXA DE INFORMAÇÕES: RELATÓRIO DA IA E OBSERVAÇÕES DO SUPERVISOR */}
            <div className="space-y-3 mb-5">
              {/* Relatório da IA */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 border border-indigo-200/90 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Relatório Diagnóstico Gerado pela IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px]">
                      Acurácia: {reviewingSession.accuracyPercentage}%
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold text-[10px]">
                      Tempo: {((reviewingSession.averageResponseTimeMs || 0)/1000).toFixed(1)}s
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed">
                  {reviewingSession.summaryJson?.executiveSummary ||
                   (reviewingSession.accuracyPercentage >= 80
                     ? `A IA apurou excelente padrão de leitura (${reviewingSession.accuracyPercentage}% de precisão). O estudante demonstrou alta correspondência grafema-fonema, tempo ágil de reação e decodificação precisa.`
                     : reviewingSession.accuracyPercentage >= 50
                     ? `A IA apurou desempenho intermediário (${reviewingSession.accuracyPercentage}% de precisão). Apresenta domínio em palavras canônicas, demonstrando oportunidade de apoio na leitura de dígrafos e estruturas silábicas complexas.`
                     : `A IA identificou nível compatível com fase inicial de apropriação (Pré-Leitor, ${reviewingSession.accuracyPercentage}% de precisão). Recomenda-se acompanhamento no princípio alfabético e correspondência grafema-som.`
                   )}
                </p>

                {/* Recomendações da IA */}
                {Array.isArray(reviewingSession.summaryJson?.recommendations) && reviewingSession.summaryJson.recommendations.length > 0 && (
                  <div className="pt-1.5 border-t border-indigo-100 flex flex-wrap gap-1.5 items-center">
                    <span className="font-bold text-slate-700 text-[11px]">Intervenções sugeridas pela IA:</span>
                    {reviewingSession.summaryJson.recommendations.map((rec: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white text-indigo-900 border border-indigo-200 text-[10px] font-semibold">
                        • {rec.title || rec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações do Supervisor */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/50">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>Observações Anotadas pelo Supervisor</span>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">
                    Aplicador: {reviewingSession.evaluator?.name || 'Supervisor'}
                  </span>
                </div>
                {reviewingSession.notes ? (
                  <p className="italic text-slate-800 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                    "{reviewingSession.notes}"
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    Nenhuma anotação complementar foi registrada pelo supervisor no momento da aplicação do teste.
                  </p>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status da Avaliação / Parecer de Gestão *
                </label>
                <select
                  value={reviewForm.adminReviewStatus}
                  onChange={(e) => setReviewForm({ ...reviewForm, adminReviewStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="APROVADO">APROVADO — Diagnóstico validado e homologado sem ressalvas</option>
                  <option value="EM_OBSERVACAO">EM OBSERVAÇÃO — Acompanhar evolução na próxima rodada</option>
                  <option value="REQUER_ATENCAO">REQUER ATENÇÃO — Encaminhar para intervenção pedagógica focal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parecer Avaliativo do Gestor *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewForm.adminFeedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, adminFeedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 resize-none focus:outline-hidden focus:border-sky-500"
                  placeholder="Escreva as diretrizes de acompanhamento para o supervisor e corpo pedagógico..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Homologar Parecer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualização Completa do Relatório (IA + Supervisor + Gestão) */}
      {isReportModalOpen && selectedReportSession && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content max-w-3xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-xl text-slate-900 leading-tight">
                    Relatório da Avaliação de Leitura
                  </h3>
                  {selectedReportSession.adminReviewStatus && (
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        selectedReportSession.adminReviewStatus === 'APROVADO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedReportSession.adminReviewStatus === 'REQUER_ATENCAO'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : selectedReportSession.adminReviewStatus === 'EM_OBSERVACAO'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {selectedReportSession.adminReviewStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Estudante: <strong className="text-slate-800">{selectedReportSession.student?.name}</strong> • Turma: {selectedReportSession.class?.name || 'Turma'} • Escola: {selectedReportSession.school?.name || 'Escola'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Data: {new Date(selectedReportSession.createdAt || Date.now()).toLocaleString('pt-BR')} • Supervisor: {selectedReportSession.evaluator?.name || 'Supervisor'}
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CAIXA DE INFORMAÇÕES: IA + SUPERVISOR + GESTÃO */}
            <div className="space-y-4">
              {/* 1. RELATÓRIO DIAGNÓSTICO GERADO PELA IA */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 border border-indigo-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-5 h-5 text-amber-200" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-base text-slate-900 leading-tight">
                        Relatório Diagnóstico Gerado pela IA
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Síntese automatizada da análise de leitura oral (Whisper Fonético + Google Gemini)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Acurácia: {selectedReportSession.accuracyPercentage}%
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Tempo Médio: {((selectedReportSession.averageResponseTimeMs || 0)/1000).toFixed(1)}s
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 p-4 rounded-xl border border-indigo-100/90 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-indigo-700">
                    Síntese Executiva da IA:
                  </span>
                  <p>
                    {selectedReportSession.summaryJson?.executiveSummary ||
                     (selectedReportSession.accuracyPercentage >= 80
                       ? `A IA identificou alto índice de decodificação e fluência articulatória (${selectedReportSession.accuracyPercentage}% de precisão). O estudante demonstrou agilidade nos tempos de resposta (${((selectedReportSession.averageResponseTimeMs || 0)/1000).toFixed(1)}s) e segurança fonológica nos itens avaliados.`
                       : selectedReportSession.accuracyPercentage >= 50
                       ? `A IA apurou desempenho intermediário (${selectedReportSession.accuracyPercentage}% de precisão). Observou-se prontidão em estruturas canônicas simples e necessidade de apoio no reconhecimento de dígrafos e encontros consonantais.`
                       : `A IA diagnosticou padrão compatível com a fase inicial de alfabetização (Pré-Leitor, ${selectedReportSession.accuracyPercentage}% de precisão). Recomenda-se estímulo lúdico continuado de consciência fonológica e correspondência som-grafema.`)}
                  </p>
                </div>

                {/* Recomendações Pedagógicas da IA */}
                {Array.isArray(selectedReportSession.summaryJson?.recommendations) && selectedReportSession.summaryJson.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Intervenções Pedagógicas Recomendadas pela IA:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedReportSession.summaryJson.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-900">{rec.title}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              rec.priority === 'alta' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {rec.priority || 'sugestão'}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-snug">{rec.description}</p>
                          {Array.isArray(rec.suggestedWords) && rec.suggestedWords.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {rec.suggestedWords.map((w: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                                  {w}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. OBSERVAÇÕES ANOTADAS PELO SUPERVISOR */}
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-amber-950 leading-tight">
                        Observações Anotadas pelo Supervisor
                      </h4>
                      <p className="text-[11px] text-amber-800/80">
                        Anotações comportamentais e contextuais registradas durante a sessão de teste
                      </p>
                    </div>
                  </div>
                  {(isSupervisor || isSuperAdmin) && !isEditingReportNotes && (
                    <button
                      onClick={() => setIsEditingReportNotes(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                      title="Editar observações"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{selectedReportSession.notes ? 'Editar Notas' : 'Adicionar Notas'}</span>
                    </button>
                  )}
                </div>

                {isEditingReportNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={reportSupervisorNotes}
                      onChange={(e) => setReportSupervisorNotes(e.target.value)}
                      placeholder="Insira as observações sobre a atitude da criança, concentração ou fatores de interferência durante o teste..."
                      className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm text-slate-800 resize-none focus:outline-hidden focus:border-amber-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setReportSupervisorNotes(selectedReportSession.notes || '');
                          setIsEditingReportNotes(false);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveReportSupervisorNotes}
                        disabled={isSavingReportNotes}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>{isSavingReportNotes ? 'Salvando...' : 'Salvar Observações'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 text-xs sm:text-sm">
                    {selectedReportSession.notes ? (
                      <p className="italic text-slate-800 font-medium leading-relaxed">
                        "{selectedReportSession.notes}"
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">
                        Nenhuma observação complementar foi registrada pelo supervisor nesta aplicação.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. PARECER DE HOMOLOGAÇÃO DA GESTÃO */}
              <div className="p-5 sm:p-6 rounded-2xl bg-sky-50/70 border border-sky-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-sky-700" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-sky-950 leading-tight">
                        Parecer e Homologação da Gestão Pedagógica
                      </h4>
                      <p className="text-[11px] text-sky-800/80">
                        Avaliação formal realizada pela coordenação / administração escolar
                      </p>
                    </div>
                  </div>

                  {(isAdmin || isSuperAdmin) && (
                    <button
                      onClick={() => {
                        handleOpenReviewModal(selectedReportSession);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      title="Avaliar ou atualizar parecer deste relatório"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{selectedReportSession.adminFeedback ? 'Editar Parecer' : 'Avaliar Relatório'}</span>
                    </button>
                  )}
                </div>

                <div className="bg-white/80 p-3.5 rounded-xl border border-sky-200/80 text-xs sm:text-sm">
                  {selectedReportSession.adminFeedback ? (
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800 leading-relaxed">
                        "{selectedReportSession.adminFeedback}"
                      </p>
                      {selectedReportSession.adminReviewedAt && (
                        <span className="text-[10px] text-slate-400 block pt-1">
                          Homologado em: {new Date(selectedReportSession.adminReviewedAt).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">
                      Este relatório ainda está pendente de avaliação pela coordenação pedagógica.
                    </p>
                  )}
                </div>
              </div>

              {/* 4. TABELA DE ITENS AVALIADOS NA SESSÃO */}
              {Array.isArray(selectedReportSession.items) && selectedReportSession.items.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Itens Avaliados nesta Sessão ({selectedReportSession.items.length})</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase">
                          <th className="py-2 px-2.5">Palavra Alvo</th>
                          <th className="py-2 px-2.5">Leitura Transcrita</th>
                          <th className="py-2 px-2.5 text-center">Tempo Resposta</th>
                          <th className="py-2 px-2.5 text-right">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReportSession.items.map((it: any, i: number) => (
                          <tr key={it.id || i} className="hover:bg-slate-50/80">
                            <td className="py-2 px-2.5 font-bold text-slate-800 font-mono text-xs">{it.targetText}</td>
                            <td className="py-2 px-2.5 text-slate-600 font-mono text-xs">{it.transcript || '—'}</td>
                            <td className="py-2 px-2.5 text-center text-slate-500 font-mono text-xs">
                              {((it.responseTimeMs || 0)/1000).toFixed(1)}s
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  it.status === 'CORRETO'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : it.status === 'POSSIVELMENTE_CORRETO'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {it.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
