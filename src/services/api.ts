import { UserProfile, UserRole } from '../types/auth';
import { School, SchoolClass, Student } from '../types/school';
import { QuestionItem } from '../types/question';
import { EvaluationSession } from '../types/evaluation';
import {
  AuditLogItem,
  AnalyticsOverviewResponse,
  StudentReportResponse,
  ClassReportResponse,
  AudioAnalysisResponse,
  SessionSynthesisResponse
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('fluencia_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('fluencia_token', token);
      } else {
        localStorage.removeItem('fluencia_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('fluencia_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fluencia:unauthorized'));
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status} ao conectar com o servidor`);
      }

      return data.data !== undefined ? data.data : data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          throw new Error('Servidor offline ou inatingível no momento.');
        }
        throw err;
      }
      throw new Error('Erro desconhecido na comunicação com a API.');
    }
  }

  // --- Auth ---
  public async login(credentials: { email: string; password: string }): Promise<{ user: UserProfile; token: string }> {
    const result = await this.request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    this.setToken(result.token);
    return result;
  }

  public async getProfile(): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/auth/me');
  }

  public logout() {
    this.setToken(null);
  }

  // --- Schools ---
  public async getSchools(): Promise<{ schools: School[] }> {
    return this.request<{ schools: School[] }>('/schools');
  }

  public async createSchool(school: Partial<School>): Promise<{ school: School }> {
    return this.request<{ school: School }>('/schools', {
      method: 'POST',
      body: JSON.stringify(school)
    });
  }

  public async updateSchool(id: string, data: Partial<School>): Promise<{ school: School }> {
    return this.request<{ school: School }>(`/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async deleteSchool(id: string): Promise<void> {
    return this.request<void>(`/schools/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Classes ---
  public async getClasses(schoolId?: string): Promise<{ classes: SchoolClass[] }> {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    return this.request<{ classes: SchoolClass[] }>(`/classes${query}`);
  }

  public async createClass(data: Partial<SchoolClass>): Promise<{ class: SchoolClass }> {
    return this.request<{ class: SchoolClass }>('/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateClass(id: string, data: Partial<SchoolClass>): Promise<{ class: SchoolClass }> {
    return this.request<{ class: SchoolClass }>(`/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async deleteClass(id: string): Promise<void> {
    return this.request<void>(`/classes/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Students ---
  public async getStudents(classId?: string, search?: string): Promise<{ students: Student[] }> {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ students: Student[] }>(`/students${query}`);
  }

  public async createStudent(data: Partial<Student>): Promise<{ student: Student }> {
    return this.request<{ student: Student }>('/students', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateStudent(id: string, data: Partial<Student>): Promise<{ student: Student }> {
    return this.request<{ student: Student }>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async deleteStudent(id: string): Promise<void> {
    return this.request<void>(`/students/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Questions ---
  public async getQuestions(activeOnly: boolean = true): Promise<{ questions: QuestionItem[] }> {
    return this.request<{ questions: QuestionItem[] }>(`/questions?activeOnly=${activeOnly}`);
  }

  public async getEvaluationItems(mode: string = 'complete', limit: number = 10): Promise<{ items: QuestionItem[] }> {
    return this.request<{ items: QuestionItem[] }>(`/questions/evaluation-items?mode=${mode}&limit=${limit}`);
  }

  public async createQuestion(data: Partial<QuestionItem>): Promise<{ question: QuestionItem }> {
    return this.request<{ question: QuestionItem }>('/questions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateQuestion(id: string, data: Partial<QuestionItem>): Promise<{ question: QuestionItem }> {
    return this.request<{ question: QuestionItem }>(`/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async deleteQuestion(id: string): Promise<void> {
    return this.request<void>(`/questions/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Users (Admin/Superadmin) ---
  public async getUsers(): Promise<{ users: UserProfile[] }> {
    return this.request<{ users: UserProfile[] }>('/users');
  }

  public async getUserById(id: string): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>(`/users/${id}`);
  }

  public async createUser(data: {
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    schoolId?: string | null;
  }): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateUser(
    id: string,
    data: Partial<{ name: string; email: string; role: UserRole; schoolId?: string | null; active: boolean; password?: string }>
  ): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Evaluations ---
  public async submitEvaluation(sessionData: unknown): Promise<{ session: EvaluationSession }> {
    return this.request<{ session: EvaluationSession }>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  public async getEvaluations(studentId?: string, classId?: string, schoolId?: string): Promise<{ evaluations: any[] }> {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (classId) params.append('classId', classId);
    if (schoolId) params.append('schoolId', schoolId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ evaluations: any[] }>(`/evaluations${query}`);
  }

  public async getEvaluationById(id: string): Promise<{ session: any }> {
    return this.request<{ session: any }>(`/evaluations/${id}`);
  }

  public async reviewEvaluation(id: string, data: { adminFeedback: string; adminReviewStatus: string }): Promise<{ session: any }> {
    return this.request<{ session: any }>(`/evaluations/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async updateEvaluationNotes(id: string, notes: string): Promise<{ session: any }> {
    return this.request<{ session: any }>(`/evaluations/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
  }

  public async analyzeAudioItem(formData: FormData): Promise<AudioAnalysisResponse> {
    return this.request<AudioAnalysisResponse>('/evaluations/analyze-audio', {
      method: 'POST',
      body: formData
    });
  }

  public async generateSessionSynthesis(data: {
    childName?: string;
    accuracyPercentage: number;
    totalItems: number;
    correctCount: number;
    itemsSummary: string;
  }): Promise<SessionSynthesisResponse> {
    return this.request<SessionSynthesisResponse>('/evaluations/generate-session-synthesis', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Reports ---
  public async getStudentReport(studentId: string): Promise<StudentReportResponse> {
    return this.request<StudentReportResponse>(`/reports/students/${studentId}`);
  }

  public async getClassReport(classId: string): Promise<ClassReportResponse> {
    return this.request<ClassReportResponse>(`/reports/classes/${classId}`);
  }

  // --- Analytics ---
  public async getAnalyticsOverview(): Promise<AnalyticsOverviewResponse> {
    return this.request<AnalyticsOverviewResponse>('/analytics/overview');
  }

  // --- Audit ---
  public async getAuditLogs(entity?: string, action?: string, limit: number = 50): Promise<{ logs: AuditLogItem[] }> {
    const params = new URLSearchParams();
    if (entity) params.append('entity', entity);
    if (action) params.append('action', action);
    params.append('limit', limit.toString());
    return this.request<{ logs: AuditLogItem[] }>(`/audit?${params.toString()}`);
  }

  // --- Settings ---
  public async getSettings(): Promise<{ settings: Record<string, unknown> }> {
    return this.request<{ settings: Record<string, unknown> }>('/settings');
  }

  public async updateSetting(key: string, value: unknown, description?: string): Promise<{ message: string; setting: unknown }> {
    return this.request<{ message: string; setting: unknown }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value, description })
    });
  }
}

export const api = new ApiService();
