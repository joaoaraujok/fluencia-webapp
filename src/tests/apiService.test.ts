import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../services/api';

// Setup de polyfill para ambiente Node (Vitest)
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  const storage = new LocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    writable: true,
    configurable: true
  });
}

if (typeof globalThis.window === 'undefined') {
  class WindowMock extends EventTarget {}
  const win = new WindowMock();
  Object.defineProperty(globalThis, 'window', {
    value: win,
    writable: true,
    configurable: true
  });
}

if (typeof globalThis.CustomEvent === 'undefined') {
  class CustomEventMock<T = unknown> extends Event {
    detail?: T;
    constructor(type: string, eventInitDict?: { detail?: T; bubbles?: boolean; cancelable?: boolean }) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail;
    }
  }
  Object.defineProperty(globalThis, 'CustomEvent', {
    value: CustomEventMock,
    writable: true,
    configurable: true
  });
}

describe('ApiService - Comunicação Centralizada com a API', () => {
  beforeEach(() => {
    localStorage.clear();
    api.setToken(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve armazenar e recuperar token JWT no localStorage corretamente', () => {
    expect(api.getToken()).toBeNull();

    api.setToken('jwt_test_token_12345');
    expect(api.getToken()).toBe('jwt_test_token_12345');
    expect(localStorage.getItem('fluencia_token')).toBe('jwt_test_token_12345');

    api.logout();
    expect(api.getToken()).toBeNull();
    expect(localStorage.getItem('fluencia_token')).toBeNull();
  });

  it('deve incluir o cabeçalho Authorization Bearer nas requisições autenticadas', async () => {
    api.setToken('bearer_sample_token');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', data: { schools: [] } })
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await api.getSchools();
    expect(result).toEqual({ schools: [] });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/schools'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer bearer_sample_token',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('deve limpar o token e emitir evento fluencia:unauthorized quando receber status 401', async () => {
    api.setToken('expired_or_invalid_token');

    const unauthorizedEventSpy = vi.fn();
    window.addEventListener('fluencia:unauthorized', unauthorizedEventSpy);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ status: 'error', message: 'Sessão expirada' })
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(api.getProfile()).rejects.toThrow('Sessão expirada');

    expect(api.getToken()).toBeNull();
    expect(localStorage.getItem('fluencia_token')).toBeNull();
    expect(unauthorizedEventSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener('fluencia:unauthorized', unauthorizedEventSpy);
  });

  it('deve lançar mensagem clara de offline quando ocorrer TypeError de rede no fetch', async () => {
    const fetchTypeError = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(fetchTypeError));

    await expect(api.getSchools()).rejects.toThrow('Servidor offline ou inatingível no momento.');
  });

  it('deve chamar getUsers e retornar lista tipada de usuários', async () => {
    api.setToken('admin_token');

    const mockUsers = [
      { id: 'u1', name: 'Admin', email: 'admin@fluencia.edu.br', role: 'ADMIN', active: true }
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', data: { users: mockUsers } })
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getUsers();
    expect(res.users).toHaveLength(1);
    expect(res.users[0].name).toBe('Admin');
  });
});
