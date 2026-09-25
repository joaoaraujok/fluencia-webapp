import { UserProfile } from '../types/auth';
import { School, SchoolClass, Student } from '../types/school';
import { QuestionItem } from '../types/question';
import { EvaluationSession } from '../types/evaluation';

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

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

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status} ao conectar com o servidor`);
      }

      return data.data !== undefined ? data.data : data;
    } catch (err: any) {
      // Se a conexão falhar (offline), relança com indicação clara
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Servidor offline ou inatingível no momento.');
      }
      throw err;
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

  // --- Evaluations ---
  public async submitEvaluation(sessionData: any): Promise<{ session: EvaluationSession }> {
    return this.request<{ session: EvaluationSession }>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  public async getEvaluations(studentId?: string, classId?: string): Promise<{ evaluations: EvaluationSession[] }> {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (classId) params.append('classId', classId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ evaluations: EvaluationSession[] }>(`/evaluations${query}`);
  }

  public async getEvaluationById(id: string): Promise<{ session: EvaluationSession }> {
    return this.request<{ session: EvaluationSession }>(`/evaluations/${id}`);
  }

  // --- Reports ---
  public async getStudentReport(studentId: string): Promise<any> {
    return this.request<any>(`/reports/students/${studentId}`);
  }

  public async getClassReport(classId: string): Promise<any> {
    return this.request<any>(`/reports/classes/${classId}`);
  }

  // --- Analytics ---
  public async getAnalyticsOverview(): Promise<any> {
    return this.request<any>('/analytics/overview');
  }

  // --- Audit ---
  public async getAuditLogs(entity?: string, action?: string, limit: number = 50): Promise<{ logs: any[] }> {
    const params = new URLSearchParams();
    if (entity) params.append('entity', entity);
    if (action) params.append('action', action);
    params.append('limit', limit.toString());
    return this.request<{ logs: any[] }>(`/audit?${params.toString()}`);
  }

  // --- Settings ---
  public async getSettings(): Promise<{ settings: Record<string, any> }> {
    return this.request<{ settings: Record<string, any> }>('/settings');
  }

  public async updateSetting(key: string, value: any, description?: string): Promise<any> {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value, description })
    });
  }
}

export const api = new ApiService();
