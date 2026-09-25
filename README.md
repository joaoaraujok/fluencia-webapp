# FluencIA — Plataforma Educacional de Avaliação da Fluência Oral e Leitura Infantil

O **FluencIA** é uma solução educacional desenvolvida para avaliação diagnóstica e acompanhamento contínuo da fluência de leitura oral de estudantes dos anos iniciais do Ensino Fundamental, estruturado em estrita conformidade com as diretrizes do Ministério da Educação (**MEC**), do Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (**Inep/Saeb**) e da Lei Geral de Proteção de Dados Pessoais (**LGPD**).

---

## 🎯 Principais Características e Funcionalidades

1. **Arquitetura Cliente-Servidor Resiliente:**
   - **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + PWA (Progressive Web App com suporte offline via Dexie/IndexedDB).
   - **Backend:** Node.js + Express 5 + TypeScript + Prisma ORM + PostgreSQL.
2. **Modelo Pedagógico de Avaliação:**
   - **Nível 1 — Pré-Leitor:** Foco no processo de aquisição de leitura (decodificação de palavras isoladas, tempo de prontidão, precisão e comportamento de resposta).
   - **Nível 2 — Leitor:** Foco na leitura fluente de palavras complexas e sentenças (precisão, velocidade, tempo de resposta, regularidade e expressividade).
3. **Cronômetro Independente de 10 Segundos por Palavra:**
   - Tempo regulamentar de 10.000 ms por item com registro em milissegundos do início da fala (`speechStartMs`), término (`speechEndMs`), tempo de resposta (`responseTimeMs`), tentativas, confiança e status detalhado (`CORRETO`, `POSSIVELMENTE_CORRETO`, `INCORRETO`, `SEM_RESPOSTA`, `NAO_RECONHECIDO` e `ERRO_TECNICO`).
4. **Camada Abstrata de Reconhecimento de Voz (`SpeechRecognitionProvider`):**
   - Desacoplamento da Web Speech API do navegador, permitindo futuros provedores de speech-to-text locais ou de nuvem sem alterar as regras de negócio.
5. **Controle de Qualidade Acústica do Ambiente Escolar:**
   - Tela de calibração pré-avaliação com orientações de sala de aula, VU meter em tempo real, detecção de ruído ambiente/clipping e teste rápido de microfone.
6. **Modo Silencioso Durante Resposta:**
   - Sistema 100% silencioso durante a janela de captação de fala da criança, garantindo que nenhum áudio de interface interfira no reconhecimento fonético.
7. **Privacidade e Minimização de Dados (LGPD):**
   - Áudio processado localmente em tempo de execução sem armazenamento permanente de voz infantil.
   - Cadastro restrito de estudantes (sem CPF ou biometria desnecessária).
8. **Controle de Acesso Baseado em Perfis (RBAC):**
   - `SUPERADMIN`: Gestão global, usuários, escolas, turmas, alunos, banco de questões, parâmetros pedagógicos e auditoria imutável.
   - `ADMIN`: Gestão administrativa escolar, turmas, estudantes e visualização/exportação de relatórios.
   - `SUPERVISOR`: Aplicação pedagógica de avaliações, visualização de resultados e emissão de pareceres formativos.
9. **Linguagem Pedagógica e Não Punitiva:**
   - Relatórios e telas que utilizam exclusivamente termos pedagógicos e acolhedores ("oportunidade de prática", "em processo de apropriação"), proibindo qualquer diagnóstico clínico ou rotulação médica (dislexia, TDAH, distúrbios de fala).

---

## 📁 Estrutura do Projeto

```text
fluencia-app/
├── backend/                       # Backend em Node.js + TypeScript + Express
│   ├── prisma/                    # Schema do banco de dados e seeds
│   │   ├── schema.prisma          # Modelos relacionais PostgreSQL
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
│   ├── ARQUITETURA-PROPOSTA.md    # Especificação arquitetural dos 10 pilares
│   └── CADERNO-DE-ORIENTACOES.md  # Caderno de Orientações com 25 seções detalhadas
├── src/                           # Frontend React + TypeScript + PWA
│   ├── components/                # Componentes de UI (admin, children, evaluation, results, etc.)
│   ├── contexts/                  # Contexto de autenticação e sessão JWT
│   ├── data/                      # Banco de questões local para fallback offline
│   ├── services/                  # Provedores de áudio, fala, repositório e API REST
│   ├── styles/                    # Estilos CSS e tokens de design
│   ├── types/                     # Tipagens TypeScript estritas
│   ├── App.tsx                    # Orquestrador da aplicação
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
   Exemplo de `.env`:
   ```env
   NODE_ENV=development
   PORT=3333
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fluencia_db?schema=public"
   JWT_SECRET="sua-chave-secreta-jwt-altamente-segura-e-longa-32-chars-min"
   JWT_EXPIRES_IN="8h"
   CORS_ORIGIN="http://localhost:5173"
   INITIAL_SUPERADMIN_NAME="Administrador Geral FluencIA"
   INITIAL_SUPERADMIN_EMAIL="superadmin@fluencia.edu.br"
   INITIAL_SUPERADMIN_PASSWORD="SenhaTemporariaSegura2026!"
   ```

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
   O backend estará acessível em: `http://localhost:3333`.  
   A documentação interativa OpenAPI/Swagger estará disponível em: `http://localhost:3333/api-docs`.

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
   Certifique-se de que `VITE_API_URL` aponta para o backend:
   ```env
   VITE_API_URL=http://localhost:3333/api/v1
   ```

3. **Inicie a aplicação React com Vite:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em: `http://localhost:5173`.

---

## 🧪 Execução de Testes Automatizados

O projeto conta com suítes de testes automatizados com cobertura completa para regras de negócio, motor de cálculo, persistência offline e segurança.

### Testes do Frontend:
```bash
# Na raiz do projeto:
npm test
```
*Valida reconhecimento de voz, banco de questões, motor fonético, cálculo de similaridade e resiliência offline do repositório.*

### Testes do Backend:
```bash
# No diretório backend/:
cd backend
npm test
```
*Valida autenticação com bcrypt/JWT, controle de acesso RBAC e cálculo imutável de sessões de avaliação.*

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
# No diretório backend/:
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
