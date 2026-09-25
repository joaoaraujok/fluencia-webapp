# Plano Arquitetural e Diagnóstico: FluencIA Plataforma Institucional

Este documento estabelece o diagnóstico da arquitetura legada e a especificação da nova arquitetura institucional do **FluencIA**, em atendimento aos critérios técnicos, pedagógicos, de segurança e LGPD.

---

## 1. Diagnóstico da Arquitetura Atual

### 1.1 Estado do Frontend / PWA
* **Estrutura:** React 19 + TypeScript + Vite + Tailwind CSS v4.
* **Persistência Atual:** Utiliza exclusivamente o banco local `Dexie` (IndexedDB).
* **Limitações Identificadas:**
  * **Isolamento de Dados:** Dados residem exclusivamente no navegador do dispositivo utilizado. A perda do cache ou troca de aparelho acarreta perda integral dos dados.
  * **Ausência de Autenticação/RBAC:** Qualquer pessoa que abre o app acessa todos os dados locais.
  * **Modelo de Estudante Frágil:** Objeto `ChildProfile` não está vinculado a uma estrutura escolar (Escola → Turma → Aluno).
  * **Banco de Questões Estático:** Questões estão hardcoded no arquivo `src/data/questionBank.ts`. Educadores e administradores não conseguem atualizar palavras, níveis ou categorias.
  * **Estrutura Antiga de Níveis:** Possui 4 níveis numéricos genéricos sem alinhamento com a nova diretriz pedagógica:
    * *Nível 1 — Pré-leitor* (decodificação de itens simples, tempo de resposta, comportamento e precisão na aquisição);
    * *Nível 2 — Leitor* (reconhecimento ágil, velocidade, regularidade, precisão em palavras e frases).
  * **Tempo Fixo Inadequado:** Utiliza 3 segundos para palavras e 5 segundos para frases, sem registro detalhado de momentos de início e término da fala (`speechStartMs`, `speechEndMs`, tempo disponível de 10s, distinção entre silêncio, tentativa parcial ou ruído).
  * **Acoplamento no Reconhecimento de Voz:** A classe `speechService.ts` conecta-se diretamente à Web Speech API do navegador, sem uma interface abstrata (`SpeechRecognitionProvider`) que permita plugar outros motores ou registrar metadados de auditoria técnica.

---

## 2. Arquitetura Proposta

### 2.1 Visão Geral (Client-Server Institucional)
```
┌────────────────────────────────────────────────────────┐
│                   Frontend (PWA)                       │
│  - React 19 + TypeScript + Tailwind v4                 │
│  - SpeechRecognitionProvider (Abstração de Fala)       │
│  - Offline Repository (Dexie Cache + Fila de Sync)     │
│  - Interface Dupla: Modo Avaliação & Painel Educador   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST API / JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend (Node.js)                    │
│  - Express + TypeScript + Zod Validation               │
│  - Camada de Segurança (Helmet, RateLimit, CORS, JWT)  │
│  - RBAC Guard (SUPERADMIN, ADMIN, SUPERVISOR)          │
│  - Módulos de Domínio (Auth, Schools, Classes, etc.)   │
│  - OpenAPI / Swagger Documentation                     │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM (Migrações Tipadas)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Banco Central (PostgreSQL)                 │
│  - Usuários, Escolas, Turmas, Alunos                   │
│  - Banco de Questões e Critérios Versionados           │
│  - Avaliações, Métricas de Fala e Logs de Auditoria    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Modelo do Banco de Dados Centralizado (PostgreSQL / Prisma)

* **User:** `id`, `name`, `email`, `passwordHash`, `role` (`SUPERADMIN`, `ADMIN`, `SUPERVISOR`), `active`, `lastLoginAt`, `createdAt`, `updatedAt`.
* **School:** `id`, `name`, `code`, `city`, `state`, `active`, `createdAt`, `updatedAt`.
* **SchoolClass:** `id`, `schoolId`, `name`, `gradeYear`, `schoolYear`, `shift`, `active`, `createdAt`, `updatedAt`.
* **Student:** `id`, `classId`, `schoolId`, `name`, `birthDate`, `registrationNumber`, `active`, `notes`, `createdAt`, `updatedAt`.
* **Question:** `id`, `text`, `level` (1=Pré-leitor, 2=Leitor), `type`, `syllableStructure`, `syllablesCount`, `category`, `difficulty`, `targetPhonemes`, `active`, `order`, `metadata`, `version`, `createdAt`, `updatedAt`.
* **EvaluationCriteria:** `id`, `version` (ex: "2026.1"), `timing` (5s simples, 6s médias, 8s complexas, 15s frases), `maxItemsPerEvaluation` (30), `toleranceSetting`, `active`, `rulesJson`, `createdAt`, `createdByUserId`.
* **EvaluationSession:** `id` (UUIDv4 idempotente), `studentId`, `evaluatorId`, `classId`, `schoolId`, `criteriaVersion`, `status`, `mode`, `totalItems` (máx. 30), `correctCount`, `possibleCount`, `incorrectCount`, `noResponseCount`, `unrecognizedCount`, `accuracyPercentage`, `averageResponseTimeMs`, `wordsPerMinute` (PCPM), `pedagogicalDiagnosis`, `summaryJson`, `syncStatus`, `createdAt`, `completedAt`.
* **EvaluationItem:** `id`, `sessionId`, `questionId`, `targetText`, `level`, `itemType`, `syllableStructure`, `category`, `transcript`, `normalizedTranscript`, `status`, `responseTimeMs`, `availableTimeMs` (5000 a 15000ms), `speechStartMs`, `speechEndMs`, `confidence`, `similarity`, `numberOfAttempts`, `recognitionQuality`, `provider`, `errorObservation`, `phonemeFindings`, `createdAt`.
* **AuditLog:** `id`, `userId`, `action`, `entity`, `entityId`, `oldValue`, `newValue`, `ipAddress`, `userAgent`, `createdAt`.
* **PedagogicalSetting:** `key`, `value`, `description`, `updatedAt`, `updatedByUserId`.

---

## 4. Matriz de Permissões (RBAC)

| Módulo / Operação | SUPERADMIN | ADMIN | SUPERVISOR |
|---|---|---|---|
| Autenticação (Login, Refresh, Perfil) | Sim | Sim | Sim |
| Criar / Editar / Desativar Usuários | Sim | Não | Não |
| Configurações Globais / Auditoria | Sim | Não | Não |
| Banco de Questões e Critérios | Sim | Apenas Visualização | Apenas Visualização |
| Gestão de Escolas e Turmas | Sim | Sim | Leitura de suas turmas |
| Gestão de Alunos | Sim | Sim | Sim (suas turmas) |
| Aplicar Avaliação com Criança | Sim | Não | Sim |
| Relatórios Individuais e por Turma | Sim | Sim | Sim |
| Exportação de Relatórios (PDF / CSV) | Sim | Sim | Sim |

---

## 5. Fluxo Oficial do Motor Adaptativo de Fluência Leitora
1. **Identificação Escolar:** Seleção da turma e confirmação dos dados do estudante.
2. **Controle de Qualidade do Áudio e Ambiente:**
   - Verificação de microfone, contexto seguro (HTTPS) e checklist acústico de sala de aula.
   - Teste de áudio rápido e VU meter em tempo real com detecção de ruído/clipping.
3. **Limite Global e Cronômetros Rígidos:**
   - **Limite Global de 4 minutos (240 segundos):** Se atingido, interrompe imediatamente a avaliação, compila todos os dados coletados e gera o relatório diagnóstico com as evidências acumuladas.
   - **Letras e Palavras:** Limite máximo de 10 segundos por item.
   - **Frases Curtas:** Limite máximo de 15 segundos por item.
   - **Texto em Contexto:** Janela de leitura de até 60 segundos.
4. **Sequência Adaptativa Obrigatória e Critérios de Parada:**
   - **Etapa 1 — Letras (10s):** Se < 10 acertos $\to$ encerra como **PRÉ-LEITOR 1**. Se $\ge 10$ acertos $\to$ avança para Palavras.
   - **Etapa 2 — Palavras Isoladas (10s):**
     * 0 acertos $\to$ encerra como **PRÉ-LEITOR 2**.
     * 1 a 10 acertos $\to$ encerra como **PRÉ-LEITOR 3**.
     * 11 a 20 PCPM $\to$ encerra como **LEITOR INICIANTE 1**.
     * 21+ PCPM $\to$ candidata a Leitor Iniciante 2/Fluente $\to$ avança para a Etapa 3 (Texto).
   - **Etapa 3 — Leitura de Texto em Contexto (até 60s):**
     * Critérios simultâneos de fluência: $\ge 65$ PCPM + $> 90\%$ de precisão + automaticidade e respeito à pontuação.
     * Se atingir $\to$ confirma **LEITOR FLUENTE** e avança para Etapa 4 (Frases).
     * Se NÃO atingir $\to$ encerra como **LEITOR INICIANTE 2** (nunca apresenta frases).
   - **Etapa 4 — Prosódia em Frases (15s):** Apresentada exclusivamente para confirmação da expressividade prosódica e cadência do Leitor Fluente.
5. **Relatório Técnico e Resumo Executivo para o Supervisor:**
   - Resumo Executivo respondendo às 7 perguntas pedagógicas fundamentais.
   - Seção de Evidências da Classificação com dados quantitativos auditáveis.
   - Rastreabilidade item a item no formato `Palavra esperada → resposta da criança → tipo de erro`, tempos de reação e notas de confiança ASR.

---

## 6. Estratégia de Reconhecimento de Fala
* Interface abstrata `SpeechRecognitionProvider`:
  * Permite desacoplar a aplicação da API do navegador.
  * Suporta motor local, Web Speech e futuros motores neurais sem reescrever o motor de análise.
  * Registra em cada item o atributo `provider: 'browser-web-speech'`.

---

## 7. Estratégia Offline / PWA
* **Cache Inteligente:** Turmas, alunos e questões ficam em cache no Dexie.
* **Fila de Sincronização:** Avaliações realizadas sem internet recebem identificador UUID v4 e entram na fila com status `pending`.
* **Sincronização Automática:** Acionada quando o evento `online` dispara ou sob demanda do educador.

---

## 8. Estratégia de Relatórios
* **Individual:** Identificação completa, precisão, tempo médio, discriminação fonética, pontos de atenção observados e recomendações práticas.
* **Por Turma:** Total avaliado, distribuição por nível, média temporal, habilidades desafiadoras e alertas pedagógicos.
* **Critérios:** Separação clara entre referências oficiais (MEC/Inep/Compromisso Nacional Criança Alfabetizada) e métricas internas do FluencIA. Sem jargões clínicos ou diagnósticos médicos.

---

## 9. Estratégia de Segurança e LGPD
* **Minimização:** Apenas dados estritamente necessários para a avaliação da fluência são coletados.
* **Privacidade de Áudio:** Processamento em tempo real sem armazenamento permanente de gravações de voz infantil.
* **Criptografia e Sessão:** Senhas com hash Bcrypt, tokens JWT com expiração, rate limiting e sanitização.
* **Auditoria:** Registro imutável de alterações em cadastros, critérios e avaliações.

---

## 10. Plano de Migração e Fases
* **Fase 1:** Backend Node.js + TypeScript + Prisma + PostgreSQL + Seeds + RBAC.
* **Fase 2:** Migração do banco de questões e critérios versionados para a API.
* **Fase 3:** Refatoração do frontend com `SpeechRecognitionProvider`, verificação de ambiente e janela de 10s.
* **Fase 4:** Telas de gestão escolar (Escolas, Turmas, Alunos, Usuários, Auditoria).
* **Fase 5:** Relatórios individuais e por turma com exportação.
* **Fase 6:** Documentação técnica e Caderno de Orientações Pedagógicas.
