# Especificação Arquitetural e Técnica Oficial — FluencIA Plataforma Institucional

Este documento estabelece a especificação arquitetural oficial, consolidada e em produção do **FluencIA**, atendendo rigorosamente aos critérios técnicos, pedagógicos, de segurança institucional, acessibilidade e conformidade com a LGPD (Lei nº 13.709/2018).

---

## 1. Visão Geral da Arquitetura (Client-Server Institucional)

O FluencIA opera sob uma arquitetura desacoplada cliente-servidor, orientada a microcamadas de domínio, offline-first e alta disponibilidade para redes públicas e privadas de ensino:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend (PWA / SPA)                          │
│  - React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS v4               │
│  - Design System com Design Tokens CSS centralizados em index.css       │
│  - SpeechRecognitionProvider (Abstração de Fala Web Speech / IA Groq)  │
│  - Offline Repository (Dexie 4.0 / IndexedDB + Fila de Sync UUIDv4)    │
│  - Code-Splitting por rotas e modais dinâmicos (React.lazy / Suspense) │
│  - Manual de Uso & Guia do Educador In-App (UserManualModal)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST API / JSON / JWT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Backend (Node.js REST)                        │
│  - Express 5 + TypeScript + Zod Validation Schema                      │
│  - Camada de Segurança (Helmet, CORS, Express-Rate-Limit, BCrypt)      │
│  - RBAC Guard (SUPERADMIN, ADMIN, SUPERVISOR)                          │
│  - Módulos de Domínio (Auth, Schools, Classes, Students, Evaluations)  │
│  - Pipeline de Áudio IA (Groq Whisper v3 + Google Gemini)             │
│  - Documentação OpenAPI 3.0 / Swagger UI (/api-docs)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prisma ORM 6.x (Migrações Tipadas)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Banco Central (PostgreSQL)                      │
│  - Modelos Relacionais Normalizados (Escolas, Turmas, Alunos, Sessões) │
│  - Índices Compostos de Alta Performance (B-Tree Otimizados)           │
│  - Banco de Questões e Critérios Versionados (2026.1)                  │
│  - Trilha Imutável de Auditoria (AuditLogs com IP, User e Diffs)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend & PWA (Progressive Web App)

### 2.1 Stack Tecnológica
* **Core:** React 19, TypeScript 5.7, Vite 6.
* **Estilização:** Tailwind CSS v4 com sistema de design tokens nativos CSS (`--font-display`, `--color-primary`, `--color-surface`, `--color-border`), garantindo alto contraste e leitura confortável para educadores e crianças.
* **Persistência Local (Offline-First):** Dexie.js 4.0 (IndexedDB) com cache de escolas, turmas, estudantes, questões pedagógicas e fila de sincronização idempotente.
* **Otimização de Pacotes (Code-Splitting):** Chunks manuais configurados no Vite Rollup (`vendor-react`, `vendor-icons`, `vendor-db`) e carregamento sob demanda via `React.lazy` para:
  * `ResultDashboard` (Dashboard de métricas pós-avaliação);
  * `AdminDashboard` (Painel institucional de gestão);
  * `HistoryView` (Histórico longitudinal de avaliações);
  * `UserManualModal` (Manual interativo do usuário);
  * `SettingsModal`, `LoginModal` e `InstallAppModal`.

### 2.2 Manual do Usuário Integrado (In-App User Guide)
Disponibilizado diretamente na interface através do componente [`UserManualModal`](file:///c:/Users/joao/Documents/fluencia-app/src/components/common/UserManualModal.tsx), permitindo consulta imediata pelo educador em qualquer tela:
* **Aba 1 (Protocolo & Níveis):** Fundamentação no Compromisso Nacional Criança Alfabetizada, jornada adaptativa em 4 etapas e tabela dos 6 níveis.
* **Aba 2 (Passo a Passo da Aplicação):** Roteiro de aplicação em sala de aula, verificação acústica com VU meter, modo silencioso e mapa de atalhos de teclado.
* **Aba 3 (Métricas & Resultados):** Definições de PCPM, acurácia global, latência temporal e o Resumo Executivo das 7 perguntas.
* **Aba 4 (Modo Offline & PWA):** Mecanismo de gravação local, indicador de pendências e sincronização em 1 clique.
* **Aba 5 (Gestão & Perfis):** Papéis RBAC, minimização de dados e conformidade estrita com a LGPD.

---

## 3. Backend, Segurança e API RESTful

### 3.1 Stack Tecnológica
* **Runtime:** Node.js 20+ com Express 5 e TypeScript.
* **Validação de Entrada:** Schemas Zod estritos em todos os endpoints públicos e protegidos.
* **Autenticação:** Tokens JWT stateless com expiração e verificação de assinatura digital.
* **Hashing de Senhas:** BCrypt com salt rounds recomendados para proteção contra ataques de força bruta.
* **Segurança HTTP:** Helmet (cabeçalhos de segurança estritos), CORS configurável via variáveis de ambiente, sanitização e Rate Limiting diferenciado para rotas de autenticação (limite contra brute force) e rotas de dados.

### 3.2 Matriz de Controle de Acesso Baseado em Perfis (RBAC)

| Funcionalidade / Recurso | SUPERADMIN | ADMIN | SUPERVISOR |
| :--- | :---: | :---: | :---: |
| Autenticação (Login, Refresh, Me) | Sim | Sim | Sim |
| Gestão de Usuários (Criar, Editar, Desativar) | Sim | Não | Não |
| Configurações Globais e Parâmetros Pedagógicos | Sim | Não | Não |
| Consulta de Trilha de Auditoria Geral (`AuditLogs`) | Sim | Não | Não |
| Gestão do Banco de Questões e Critérios Versionados | Sim | Apenas Leitura | Apenas Leitura |
| Gestão de Escolas e Turmas | Sim | Sim | Leitura de suas turmas |
| Gestão de Estudantes | Sim | Sim | Sim (suas turmas) |
| Aplicação da Avaliação de Fluência | Sim | Não | Sim |
| Consulta e Exportação de Relatórios (CSV/PDF) | Sim | Sim | Sim (seus estudantes) |

---

## 4. Modelo de Dados e Índices de Performance (PostgreSQL / Prisma)

O modelo relacional do Prisma ORM inclui índices compostos e filtros de soft-delete para garantir respostas de API em menos de 50ms mesmo sob grandes volumes de registros:

```prisma
// Principais modelos relacionais
model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role      @default(SUPERVISOR) // SUPERADMIN, ADMIN, SUPERVISOR
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model School {
  id        String        @id @default(uuid())
  name      String
  code      String        @unique
  city      String
  state     String
  active    Boolean       @default(true)
  classes   SchoolClass[]
}

model SchoolClass {
  id         String    @id @default(uuid())
  schoolId   String
  name       String
  gradeYear  String
  schoolYear Int
  shift      String
  active     Boolean   @default(true)
  students   Student[]

  @@index([schoolId, active])
  @@index([schoolId, schoolYear, gradeYear])
}

model Student {
  id                 String              @id @default(uuid())
  classId            String
  schoolId           String
  name               String
  birthDate          DateTime
  registrationNumber String?
  active             Boolean             @default(true)
  notes              String?
  sessions           EvaluationSession[]

  @@index([classId, active])
  @@index([schoolId, active])
}

model EvaluationSession {
  id                    String           @id @default(uuid()) // UUID v4 idempotente
  studentId             String
  evaluatorId           String
  classId               String
  schoolId              String
  criteriaVersion       String           @default("2026.1")
  status                String           // completed, in_progress, interrupted
  mode                  String           // complete, level1, level2
  totalItems            Int
  correctCount          Int
  possibleCount         Int
  incorrectCount        Int
  noResponseCount       Int
  unrecognizedCount     Int
  accuracyPercentage    Float
  averageResponseTimeMs Float
  wordsPerMinute        Float            // PCPM
  pedagogicalDiagnosis  String
  summaryJson           Json?
  syncStatus            String           @default("synced")
  createdAt             DateTime         @default(now())
  completedAt           DateTime?
  items                 EvaluationItem[]

  @@index([studentId, createdAt])
  @@index([classId, createdAt])
  @@index([schoolId, createdAt])
}

model EvaluationItem {
  id                   String            @id @default(uuid())
  sessionId            String
  questionId           String?
  targetText           String
  level                String
  itemType             String
  syllableStructure    String?
  transcript           String?
  normalizedTranscript String?
  status               String            // CORRETO, POSSIVELMENTE_CORRETO, INCORRETO, SEM_RESPOSTA, NAO_RECONHECIDO
  responseTimeMs       Float
  availableTimeMs      Int               @default(10000)
  speechStartMs        Float?
  speechEndMs          Float?
  confidence           Float             @default(0)
  similarity           Float             @default(0)
  provider             String            @default("browser-web-speech")
  session              EvaluationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
}
```

---

## 5. Motor Adaptativo de Avaliação da Leitura

O motor de avaliação do FluencIA implementa uma jornada adaptativa contínua, estruturada para proteger o estudante contra estresse e sobrecarga cognitiva:

### 5.1 As 4 Etapas Progressivas
1. **Etapa 1 — Reconhecimento de Letras (10s por item):** Identificação de vogais e consoantes canônicas. Se a criança acertar menos de 10 letras, a avaliação é concluída como **Pré-Leitor 1**. Se acertar $\ge 10$, avança para a Etapa 2.
2. **Etapa 2 — Palavras Isoladas (10s por item):** Decodificação progressiva (simples, médias e complexas). Se acertar 0 palavras $\to$ **Pré-Leitor 2**; 1 a 10 palavras $\to$ **Pré-Leitor 3**; 11 a 20 PCPM $\to$ **Leitor Iniciante 1**; $\ge 21$ PCPM $\to$ avança para a Etapa 3.
3. **Etapa 3 — Leitura de Texto em Contexto (janela de até 60s):** Pequena narrativa contextualizada. Para atingir o nível **Leitor Fluente**, o estudante deve atingir simultaneamente $\ge 65$ PCPM com precisão fonológica $> 90\%$. Se não atingir, conclui como **Leitor Iniciante 2**.
4. **Etapa 4 — Prosódia em Frases (15s por frase):** Apresentada exclusivamente para confirmação de expressividade, entonação e ritmo dos estudantes confirmados como Leitor Fluente.

### 5.2 Limites Temporais e Parada Rápida
* **Teto Global da Sessão:** 4 minutos (240 segundos). Atingido o limite, a sessão é encerrada com aproveitamento integral dos dados coletados até o momento.
* **Cronômetro por Item:** Janela regulamentar de 10 segundos para letras e palavras, 15 segundos para frases e até 60 segundos para texto.
* **Avanço Ágil e Debounce:** Em caso de resposta correta reconhecida, o sistema avança suavemente em 250ms. Em caso de silêncio após tentativa de fala, avança em 1.2s.
* **Atalhos do Educador:** Tecla `Espaço` ou `Seta Direita` para pular; tecla `1` para forçar acerto; tecla `2` para forçar erro; tecla `ESC` para interrupção segura.

---

## 6. Pipeline de Fala e Inteligência Artificial

A camada de reconhecimento de fala adota a interface abstrata [`SpeechRecognitionProvider`](file:///c:/Users/joao/Documents/fluencia-app/src/services/speechService.ts), garantindo total desacoplamento da interface:
* **Modo Padrão (Web Speech API):** Execução local no dispositivo sem consumo de banda, com suporte nativo aos navegadores Google Chrome, Edge e Safari.
* **Pipeline Neural (Groq Whisper v3 + Google Gemini):** Transcrição de altíssima fidelidade fonológica via Groq Whisper v3 e parecer pedagógico formativo automatizado via Gemini.
* **Modo Silencioso:** Durante a captação da fala, nenhum áudio de feedback da interface é reproduzido para não contaminar o espectrograma captado.
* **Controle de Ruído:** O sistema distingue tecnicamente desvio fonológico da criança (`INCORRETO`) de captura inaudível ou ruído externo (`NAO_RECONHECIDO`).

---

## 7. Estratégia de Testes Automatizados e Confiabilidade

O ecossistema conta com **74 testes automatizados** distribuídos entre frontend e backend, garantindo 100% de estabilidade:

* **Frontend (62 testes no Vitest):**
  * `analysisEngine.test.ts`: 21 testes de classificação de PCPM, métricas temporais, tolerâncias fonéticas e acurácia.
  * `adaptiveEngine.test.ts`: 14 testes cobrindo transições de etapas, critérios de parada e classificação dos 6 níveis.
  * `questionBank.test.ts`: 8 testes de integridade do banco de questões offline.
  * `speechService.test.ts`: 8 testes da abstração `SpeechRecognitionProvider`, timestamps e janela de 10s.
  * `apiService.test.ts`: 5 testes de integração com o cliente HTTP.
  * `audioAiPipeline.test.ts`: 4 testes do fluxo de contingência neural.
  * `repository.test.ts`: 2 testes de persistência Dexie e fila de sincronização offline.
* **Backend (12 testes no Vitest + Supertest):**
  * `auth.test.ts`: 5 testes de autenticação JWT, login, me e bloqueio por senha incorreta.
  * `schools.test.ts`: 4 testes de CRUD e RBAC de unidades escolares.
  * `evaluations.test.ts`: 3 testes de criação de sessões, cálculo de médias e persistência de itens.

---

## 8. Governança e Comandos do Sistema

| Comando | Escopo | Finalidade |
| :--- | :--- | :--- |
| `npm run dev` | Frontend | Inicia o servidor Vite em `http://localhost:5173` |
| `npm run dev:backend` | Backend | Inicia a API REST Express em `http://localhost:3001` |
| `npm run build` | Frontend | Compilação com verificação tipada rigorosa (`tsc -b && vite build`) |
| `npm run build:backend` | Backend | Compila o backend TypeScript para produção em `backend/dist` |
| `npm test` | Frontend | Executa os 62 testes automatizados do frontend |
| `npm run test:backend` | Backend | Executa os 12 testes automatizados do backend |
| `npm run test:all` | Geral | Executa todos os 74 testes integrados do ecossistema |
| `npm run db:migrate` | Backend | Aplica as migrações relacionais do Prisma no PostgreSQL |
| `npm run db:seed` | Backend | Popula o banco com SUPERADMIN padrão e questões curriculares |
