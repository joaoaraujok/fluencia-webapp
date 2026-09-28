# FluencIA — Plataforma Educacional de Avaliação da Fluência Oral e Leitura Infantil

O **FluencIA** é uma solução educacional desenvolvida para avaliação diagnóstica e acompanhamento contínuo da fluência de leitura oral de estudantes dos anos iniciais do Ensino Fundamental, estruturado em estrita conformidade com as diretrizes do Ministério da Educação (**MEC**), do Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (**Inep/Saeb**) e da Lei Geral de Proteção de Dados Pessoais (**LGPD**).

---

## 🎯 Principais Características e Funcionalidades

1. **Arquitetura Cliente-Servidor Resiliente:**
   - **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Design System de alto contraste + PWA com suporte offline via Dexie/IndexedDB.
   - **Backend:** Node.js + Express 5 + TypeScript + Prisma ORM + PostgreSQL.
2. **Motor Adaptativo de Avaliação em 4 Etapas Progressivas:**
   - **Etapa 1 — Letras (10s):** Vogais e consoantes canônicas.
   - **Etapa 2 — Palavras Isoladas (10s):** Decodificação progressiva (simples, médias e complexas).
   - **Etapa 3 — Texto em Contexto (até 60s):** Leitura de pequena narrativa com cálculo de PCPM e precisão textual.
   - **Etapa 4 — Prosódia em Frases (15s):** Sentenças para confirmação de expressividade melódica.
3. **Classificação Oficial em 6 Níveis de Leitura (MEC/Saeb):**
   - *Pré-Leitor 1*, *Pré-Leitor 2*, *Pré-Leitor 3*, *Leitor Iniciante 1*, *Leitor Iniciante 2* e *Leitor Fluente* (≥ 65 PCPM e > 90% precisão).
4. **Manual de Uso e Guia do Educador Integrado (In-App):**
   - Modal interativo acessível em qualquer tela pelo cabeçalho ou home, com roteiro passo a passo, atalhos de teclado (Espaço/Seta para avançar, Tecla 1 para acerto forçado, Tecla 2 para erro, ESC para cancelar) e interpretação das 7 perguntas pedagógicas.
5. **Cronômetro Independente e Teto Global de 4 Minutos (240s):**
   - Janelas regulamentares de 10s para letras/palavras e teto global de 240 segundos para evitar desgaste ou sobrecarga cognitiva da criança.
6. **Camada Abstrata de Reconhecimento de Voz (`SpeechRecognitionProvider`):**
   - Suporte híbrido à Web Speech API nativa do navegador e pipeline neural com Groq Whisper v3 + Google Gemini para emissão de pareceres formativos automatizados.
7. **Controle de Qualidade Acústica do Ambiente Escolar:**
   - Tela de calibração pré-avaliação com orientações de sala de aula, VU meter em tempo real, detecção de ruído ambiente/clipping e teste rápido de microfone.
8. **Modo Silencioso Durante Resposta:**
   - Sistema 100% silencioso durante a janela de captação de fala da criança, garantindo que nenhum áudio de interface interfira no reconhecimento fonético.
9. **Privacidade e Minimização de Dados (LGPD):**
   - Áudio processado localmente em tempo de execução sem armazenamento permanente de voz infantil.
   - Cadastro restrito de estudantes (sem CPF ou biometria desnecessária).
10. **Controle de Acesso Baseado em Perfis (RBAC):**
    - `SUPERADMIN`: Gestão global, usuários, escolas, turmas, alunos, banco de questões, parâmetros pedagógicos e auditoria imutável.
    - `ADMIN`: Gestão administrativa escolar, turmas, estudantes e visualização/exportação de relatórios.
    - `SUPERVISOR`: Aplicação pedagógica de avaliações, visualização de resultados e emissão de pareceres formativos.

---

## 📁 Estrutura do Projeto

```text
fluencia-app/
├── backend/                       # Backend em Node.js + TypeScript + Express
│   ├── prisma/                    # Schema do banco de dados e seeds
│   │   ├── schema.prisma          # Modelos relacionais PostgreSQL com índices compostos
│   │   └── seed.ts                # Seed inicial com SUPERADMIN seguro e 48+ questões
│   ├── src/
│   │   ├── config/                # Variáveis de ambiente validadas e prisma client
│   │   ├── docs/                  # Configuração OpenAPI/Swagger (/api-docs)
│   │   ├── middlewares/           # JWT, RBAC, auditoria e tratamento de erros
│   │   ├── modules/               # Módulos de domínio (auth, users, schools, evaluations, etc.)
│   │   ├── shared/                # Utilitários e helpers compartilhados
│   │   ├── tests/                 # Testes unitários e de integração do backend
│   │   ├── app.ts                 # Aplicação Express configurada
│   │   └── server.ts              # Ponto de entrada do servidor HTTP
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docs/                          # Documentação técnica e pedagógica
│   ├── ARQUITETURA-DO-SISTEMA.md  # Especificação técnica e arquitetural oficial
│   ├── ARQUITETURA-PROPOSTA.md    # Especificação consolidada dos pilares de engenharia
│   └── CADERNO-DE-ORIENTACOES.md  # Caderno de Orientações com 24 seções detalhadas
├── src/                           # Frontend React + TypeScript + PWA
│   ├── components/                # Componentes de UI (admin, children, evaluation, common, etc.)
│   │   └── common/UserManualModal.tsx # Manual interativo in-app
│   ├── contexts/                  # Contexto de autenticação e sessão JWT
│   ├── data/                      # Banco de questões local para fallback offline
│   ├── services/                  # Provedores de áudio, fala, repositório e API REST
│   ├── styles/                    # Design tokens e folhas de estilo CSS
│   ├── types/                     # Tipagens TypeScript estritas
│   ├── App.tsx                    # Orquestrador da aplicação com code-splitting
│   └── main.tsx                   # Ponto de montagem React
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## 🚀 Guia de Instalação e Execução

### Pré-requisitos
- **Node.js**: Versão 20.x ou superior recomendada.
- **PostgreSQL**: Instância em execução (localmente via Docker ou serviço gerenciado).
- **Gerenciador de Pacotes**: `npm`.

---

### Comandos Unificados de Governança (Executados na Raiz)

Para agilizar a operação, o projeto conta com comandos unificados centralizados no `package.json` raiz:

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor frontend Vite (`http://localhost:5173`) |
| `npm run dev:backend` | Inicia o servidor backend Express com tsx watch (`http://localhost:3001`) |
| `npm run build` | Compila o frontend (`tsc -b && vite build`) com code-splitting e PWA |
| `npm run build:backend` | Compila o backend TypeScript para produção (`backend/dist`) |
| `npm test` | Executa os 62 testes unitários e de integração do frontend com Vitest |
| `npm run test:backend` | Executa os 12 testes unitários e de integração do backend com Vitest |
| `npm run test:all` | Executa a suíte unificada de testes (frontend + backend = 74 testes) |

---

### 1. Configurando e Executando o Backend

1. **Acesse o diretório do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie o arquivo `.env` a partir do `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Preencha as variáveis no arquivo `.env`. Para obter as chaves gratuitas de IA:
   - **Groq Cloud (Whisper Large v3 Turbo)**: Crie uma conta gratuita em [Groq Console](https://console.groq.com/keys) e gere sua API Key.
   - **Google Gemini (SDK Oficial)**: Gere sua chave de API gratuita no [Google AI Studio](https://aistudio.google.com/app/apikey).

4. **Execute as Migrações do Banco de Dados:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Execute os Seeds Iniciais (SUPERADMIN + 48 Questões Oficiais + Escola Piloto):**
   ```bash
   npm run db:seed
   ```

6. **Inicie o Servidor em Modo de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   O backend estará acessível em: `http://localhost:3001`.  
   A documentação interativa OpenAPI/Swagger estará disponível em: `http://localhost:3001/api-docs`.

---

### 2. Configurando e Executando o Frontend

1. **Na raiz do projeto (`fluencia-app/`):**
   ```bash
   cd ..
   npm install
   ```

2. **Configure o arquivo de variáveis de ambiente:**
   Crie `.env` a partir de `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Certifique-se de que `VITE_API_URL` aponta para a porta do backend (`3001`):
   ```env
   VITE_API_URL=http://localhost:3001/api/v1
   ```

3. **Inicie a aplicação React com Vite:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em: `http://localhost:5173`.

---

## ⚡ Performance e Code-Splitting

A aplicação implementa otimizações arquiteturais de carregamento e runtime:
- **Code-Splitting via `React.lazy` e `Suspense`:** Componentes de rotas pesadas e modais administrativos (`ResultDashboard`, `AdminDashboard`, `SettingsModal`, `HistoryView`, `InstallAppModal`) são carregados sob demanda. O bundle inicial de entrada foi reduzido de **615 kB para 366 kB (-40%)**.
- **Chunking Estratégico no Rollup/Vite:** Separação limpa de bibliotecas de terceiros (`vendor-react`, `vendor-icons`, `vendor-db`).
- **Indexação Relacional Otimizada no Prisma:** Índices compostos e simples em `EvaluationSession(studentId, evaluatedAt)`, `EvaluationSession(schoolId, evaluatedAt)`, `EvaluationItem(sessionId)`, `Student(classId, active)` e `AuditLog(action, createdAt)` garantem buscas analíticas rápidas sem N+1 queries.

---

## 🧪 Execução de Testes Automatizados

O projeto conta com suítes de testes automatizados com cobertura completa para regras de negócio, motor de cálculo fonético, comunicação com API e persistência offline.

### Teste Unificado Completo:
```bash
# Na raiz do projeto:
npm run test:all
```
*Executa 74 testes no total (62 testes no frontend e 12 no backend) cobrindo regras pedagógicas, classificação adaptativa, debounce/deduplicação de áudio, RBAC, autenticação e tolerância a falhas de rede.*

### Testes Isolados por Camada:
- **Frontend (62 testes):** `npm test`
- **Backend (12 testes):** `npm run test:backend`

---

## 📦 Build para Produção

### Frontend:
```bash
# Na raiz:
npm run build
```
*Gera o pacote otimizado e arquivos do PWA/Service Worker na pasta `dist/`.*

### Backend:
```bash
# Na raiz: npm run build:backend (ou em backend/: npm run build && npm start)
npm run build
npm start
```
*Compila o código TypeScript para JavaScript em `backend/dist/` e executa com Node.js em modo de produção.*

---

## 📚 Documentação Técnica e Pedagógica

Para detalhes aprofundados sobre a fundamentação pedagógica, protocolos de aplicação e arquitetura de software, consulte:

1. [Caderno de Orientações do Educador (docs/CADERNO-DE-ORIENTACOES.md)](docs/CADERNO-DE-ORIENTACOES.md)
   - Contém 25 capítulos detalhando desde a preparação do ambiente, interpretação de indicadores pedagógicos, contingência sem internet até conformidade com LGPD.
2. [Documento de Arquitetura Proposta (docs/ARQUITETURA-PROPOSTA.md)](docs/ARQUITETURA-PROPOSTA.md)
   - Contém o diagnóstico comparativo, modelo relacional ER do banco, matriz de permissões RBAC, especificações de endpoints e estratégias de contingência.

---

## 📄 Licença e Termos de Uso

Este projeto foi construído para fins educacionais e diagnóstico de aprendizagem formativa. Nenhum resultado emitido pelo sistema deve ser considerado diagnóstico médico ou psicológico.
