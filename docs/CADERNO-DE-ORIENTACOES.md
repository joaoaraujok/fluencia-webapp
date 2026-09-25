# Caderno de Orientações Pedagógicas e Técnicas — FluencIA
**Plataforma de Avaliação da Fluência Oral e Leitura na Alfabetização Infantil**

---

## 1. Apresentação
O **FluencIA** é uma plataforma educacional desenvolvida para apoiar redes de ensino, escolas, coordenadores e professores na avaliação diagnóstica e formativa da fluência oral e leitura de crianças nos anos iniciais do Ensino Fundamental e Educação Infantil. A solução alia tecnologia de reconhecimento de voz e inteligência artificial a princípios da psicolinguística e referenciais pedagógicos oficiais.

---

## 2. Objetivo
Promover um instrumento confiável, ágil e acolhedor para:
* Identificar o estágio de leitura da criança (Pré-leitor e Leitor);
* Mensurar com precisão a taxa de acurácia fonológica e o tempo de reação e resposta articulatória;
* Subsidiar intervenções pedagógicas direcionadas, focadas em estruturas silábicas e fonemas específicos;
* Acompanhar a evolução longitudinal dos estudantes e das turmas ao longo do ano letivo.

---

## 3. Público-Alvo
* **Estudantes:** Crianças em fase de alfabetização (Educação Infantil ao 3º ano do Ensino Fundamental);
* **Educadores:** Professores regentes, professores alfabetizadores e coordenadores pedagógicos;
* **Gestores Educacionais:** Diretores escolares, equipes de secretaria de educação e administradores de rede.

---

## 4. Perfis de Acesso e Responsabilidades (RBAC)

### 4.1 SUPERADMIN (Administração Geral da Rede)
* Acesso irrestrito a todas as configurações globais;
* Criação e gestão de contas de administradores e supervisores;
* Parametrização pedagógica (tempos de resposta, critérios versionados, tolerâncias fonéticas);
* Gestão do banco de itens e questões pedagógicas;
* Acesso à trilha completa e imutável de logs de auditoria.

### 4.2 ADMIN (Gestão Escolar e Secretaria)
* Gestão do cadastro de escolas, turmas e estudantes;
* Consulta e acompanhamento de relatórios consolidados por turma e por escola;
* Análise de indicadores de desempenho e exportação de dados analíticos;
* Acompanhamento da cobertura avaliativa (avaliados vs. pendentes).

### 4.3 SUPERVISOR (Educador / Professor Avaliador)
* Aplicação das sessões de avaliação individual com os estudantes;
* Condução do protocolo de verificação acústica do ambiente escolar;
* Inserção de observações pedagógicas contextuais;
* Consulta aos relatórios diagnósticos dos seus estudantes e de suas turmas;
* Gerenciamento de estudantes sob sua responsabilidade pedagógica.

---

## 5. Primeiro Acesso
1. Acesse o sistema através do navegador web compatível (Google Chrome, Microsoft Edge ou Safari);
2. Clique no botão **"Entrar"** no canto superior direito;
3. Insira suas credenciais institucionais fornecidas pela secretaria ou administração;
4. Para o primeiro acesso do SUPERADMIN de implantação, utilize as credenciais configuradas de forma segura no arquivo `.env` do servidor.

---

## 6. Cadastro da Escola
* Acesse o menu **"Gestão"** → Aba **"Escolas"**;
* Clique em **"Nova Escola"**;
* Preencha os campos obrigatórios: Nome da Unidade Escolar, Código INEP/Municipal, Cidade e UF;
* Salve o registro. Todas as turmas criadas subsequentemente estarão vinculadas à escola selecionada.

---

## 7. Cadastro de Turmas
* Acesse o menu **"Gestão"** → Aba **"Turmas"**;
* Clique em **"Nova Turma"**;
* Selecione a escola de vínculo, o nome da turma (ex: *1º Ano A*), o ano letivo (ex: *2026*), o ano/etapa (ex: *1º Ano*) e o turno (*Manhã*, *Tarde* ou *Integral*);
* Salve os dados.

---

## 8. Cadastro de Alunos (Conformidade com a LGPD)
* Em conformidade com o princípio da **minimização de dados** da LGPD (Lei nº 13.709/2018, Art. 6º, III):
  * Coletam-se exclusivamente dados necessários: Nome completo do estudante, data de nascimento (para cálculo etário escolar), número de matrícula/identificador interno e observações pedagógicas;
  * **Não são solicitados** CPF, dados biométricos sensíveis desnecessários, filiação ou endereço residencial da criança.

---

## 9. Preparação do Ambiente Escolar
A qualidade do áudio e a tranquilidade da criança são determinantes para a fidedignidade da avaliação:
1. **Espaço Físico:** Escolha uma sala silenciosa, arejada e bem iluminada, livre de circulação constante de pessoas;
2. **Fontes de Ruído:** Desligue aparelhos de TV, rádios e alto-falantes próximos;
3. **Conversas Paralelas:** Oriente para que outras crianças ou adultos aguardem em silêncio fora do campo de captação;
4. **Ventiladores e Ar Condicionado:** Não aponte correntes de ar diretamente para o microfone do celular ou notebook;
5. **Estabilidade do Dispositivo:** Apoie o celular ou computador de maneira fixa sobre a mesa, evitando manuseios durante o teste;
6. **Distância Recomendada:** Posicione o microfone a uma distância aproximada de **20 a 30 centímetros** da boca da criança;
7. **Toques no Microfone:** Oriente a criança a não cobrir nem encostar os dedos na abertura do microfone.

---

## 10. Passo a Passo para Realizar a Avaliação Sequencial
O FluencIA adota o modelo de **Avaliação Sequencial Contínua e Progressiva**. A criança não é pré-classificada antes do teste: o próprio teste diagnóstico determina, com precisão pedagógica, o perfil real de fluência:

1. O supervisor clica em **"Estudante"** e seleciona a turma e o aluno que será avaliado;
2. Na tela inicial, clica no botão principal **"Iniciar Avaliação Diagnóstica"** (bateria sequencial padrão de no máximo 30 itens);
3. O sistema exibe automaticamente a **Tela de Verificação do Ambiente**:
   * O supervisor confere a barra de nível de entrada de áudio (VU meter);
   * Solicita que a criança fale uma palavra teste ("Oi" ou seu nome);
   * Marca o checklist de conformidade acústica e clica em **"Iniciar Avaliação com Estudante"**;
4. Inicia-se a contagem regressiva acolhedora (3... 2... 1...);
5. O teste transcorre em **4 etapas pedagógicas sequenciais e progressivas**:
   * **Etapa 1: Palavras Simples (10 itens • 5s cada):** Palavras canônicas dissílabas (CV-CV) para avaliar decodificação inicial;
   * **Etapa 2: Palavras Médias (10 itens • 6s cada):** Palavras com dígrafos (CH, LH, NH), encontros consonantais (PR, TR, FL) e sílabas CVC;
   * **Etapa 3: Palavras Complexas (6 itens • 8s cada):** Palavras polissílabas (4+ sílabas) e estruturas fonéticas complexas;
   * **Etapa 4: Frases Curtas (4 itens • 15s cada):** Sentenças de 3 a 6 palavras para avaliar ritmo, cadência e expressividade discursiva.
6. **Controle Inteligente de Tempo e Resposta:**
   * Durante a fala da criança vigora o **modo silencioso**, sem avisos sonoros que interfiram na captação;
   * Caso a criança leia corretamente, o sistema avança suavemente em 250ms;
   * Caso a criança fale e conclua sua tentativa, um intervalo de silêncio de 1.2s avança o item sem forçar a criança a esperar segundos ociosos;
   * O educador dispõe de controle imediato para avançar (botão **"Avançar"** ou tecla **Espaço / Seta Direita**) caso a criança informe que não sabe a palavra;
7. Ao concluir os 30 itens, o sistema gera o diagnóstico de fluência com cálculo de PCPM e abre o **Dashboard de Resultados**.

---

## 11. Como Interpretar os Resultados Pedagógicos

| Indicador | Descrição Pedagógica |
|---|---|
| **Diagnóstico Formativo** | Classificação do estágio de leitura: **Pré-Leitor**, **Leitor em Desenvolvimento** ou **Leitor Fluente**. |
| **PCPM (Palavras Corretas Por Minuto)** | Taxa oficial de leitura oral calculada a partir do tempo ativo e número de palavras lidas corretamente. |
| **Acurácia Global (%)** | Percentual de precisão na decodificação (acertos plenos valem 1.0; aproximações fonéticas aceitas valem 0.5). |
| **Tempo Médio de Resposta (s)** | Intervalo médio decorrido entre a exibição do estímulo e a resposta emitida pela criança. |
| **CORRETO** | Resposta emitida em correspondência fonética ou literal com o item-alvo. |
| **POSSIVELMENTE_CORRETO** | Variação fonética típica da infância (ex: diminutivos carinhosos, leve simplificação de encontro consonantal). |
| **INCORRETO** | Palavra dita diverge com clareza da palavra apresentada. |
| **SEM_RESPOSTA** | Silêncio durante a janela disponível do item. |
| **NAO_RECONHECIDO** | Ruído ininteligível ou captura instável do microfone (não confundir com erro da criança!). |
| **ERRO_TECNICO** | Falha de hardware ou microfone desconectado. |

---

## 12. Estágio 1 — Pré-Leitor (Aquisição Inicial)
* **Perfil:** Criança em processo de apropriação do princípio alfabético. Apresenta hesitação prolongada ou necessidade de apoio para sílabas simples;
* **Critérios Diagnósticos:** Acurácia global inferior a 40%, ou acurácia em palavras simples inferior a 50%, ou taxa de leitura inferior a 15 PCPM;
* **Encaminhamento Pedagógico:** Incentivar jogos de consciência fonológica, rimas, aliterações e leitura dialogada de livros ilustrados.

---

## 13. Estágio 2 — Leitor em Desenvolvimento & Leitor Fluente
* **Leitor em Desenvolvimento (Iniciante):**
  * **Perfil:** Decodifica com segurança palavras simples (> 60%), mas oscila em palavras médias/complexas e lê frases de forma silabada ou pausada;
  * **Critérios Diagnósticos:** Acurácia global entre 45% e 79%, taxa entre 15 e 45 PCPM;
  * **Encaminhamento Pedagógico:** Prática com encontros consonantais, dígrafos e leitura repetida de frases para ganho de ritmo.
* **Leitor Fluente:**
  * **Perfil:** Lê palavras simples, médias e polissílabas com rapidez e alta acurácia (> 80%), lendo frases com boa entonação e expressividade;
  * **Critérios Diagnósticos:** Acurácia global superior a 80%, taxa superior a 45-50 PCPM;
  * **Encaminhamento Pedagógico:** Ampliação de vocabulário, leitura autônoma de narrativas mais extensas e compreensão leitora.

---

## 14. Relatório Individual do Estudante
Apresenta:
1. Cabeçalho de identificação com dados escolares e data de aplicação;
2. Indicador geral de precisão e velocidade média;
3. Diagnóstico por habilidade silábica (canônicas, dígrafos, encontros);
4. Seção **"O que praticar"**: Orientações pedagógicas estritamente acolhedoras e afirmativas, indicando palavras-modelo para jogos de rimas, trava-línguas ou leitura compartilhada.

---

## 15. Relatório por Turma
Permite à coordenação pedagógica:
* Identificar quantos estudantes já foram avaliados e quantos restam na turma;
* Analisar a curva de desempenho médio da sala;
* Mapear estruturas silábicas que representam desafio coletivo para guiar o planejamento das próximas aulas.

---

## 16. Acompanhamento da Evolução Longitudinal
As avaliações ficam registradas cronologicamente. Ao realizar novas edições ao longo dos bimestres, o sistema plota gráficos comparativos da evolução da acurácia e da agilidade temporal do mesmo estudante.

---

## 17. Resolução de Problemas com Microfone
* **Aviso de permissão negada:** Clique no ícone de cadeado na barra de endereços do navegador e marque o Microfone como "Permitir".
* **Conexão não segura (HTTP):** Em celulares Android e iOS, o microfone é rigorosamente bloqueado em conexões HTTP normais. Utilize sempre endereço seguro HTTPS ou localhost.

---

## 18. Funcionamento Offline e PWA
O FluencIA foi desenvolvido sob o paradigma **Offline-First**:
* Todas as telas, sons sintetizados e lógica de avaliação funcionam sem conexão à internet;
* Durante a aplicação em salas sem Wi-Fi, os dados são salvos de forma íntegra no banco local do dispositivo (`IndexedDB`);
* Cada avaliação recebe um identificador universal único (UUIDv4) para evitar qualquer risco de duplicidade.

---

## 19. Sincronização de Dados
1. Assim que o dispositivo reconecta-se à internet, o sistema detecta o evento de conectividade;
2. Um aviso no cabeçalho exibe a quantidade de itens pendentes de sincronização;
3. O supervisor pode clicar no botão **"Sincronizar"** para transmitir as avaliações com segurança para o banco PostgreSQL central.

---

## 20. Política de Privacidade de Áudio
* **Não Armazenamento de Voz Infantil:** Em respeito absoluto à infância e ao Marco Legal da Primeira Infância, **o áudio da criança não é gravado nem mantido permanentemente em nenhum servidor**;
* O fluxo de áudio é analisado de forma volátil e transitória em memória para extração estrita das métricas fonéticas (texto, confiança, timestamps de início e fim da fala);
* Logo após a extração, o buffer de áudio é imediatamente descartado.

---

## 21. Boas Práticas Pedagógicas
* **Clima Lúdico e Acolhedor:** Trate a avaliação como uma brincadeira de leitura com o computador/celular;
* **Sem Punições:** O sistema não emite sons estridentes de erro nem apresenta mensagens punitivas ("Você errou");
* **Respeito ao Tempo:** Deixe a criança tentar pronunciar no seu próprio ritmo dentro da janela de 10 segundos.

---

## 22. Limitações da Tecnologia e Papel do Educador
> **Aviso Fundamental:** O reconhecimento automático de fala e a inteligência artificial constituem ferramentas de apoio à triagem e coleta de dados diagnósticos. **Elas não substituem a escuta qualificada, a sensibilidade e o parecer pedagógico do educador.** Qualquer decisão curricular deve ter como protagonista o professor regente e a coordenação pedagógica.

---

## 23. Referências e Critérios Pedagógicos

### 23.1 Critérios Oficiais e Documentados
* **Brasil. Ministério da Educação (MEC):** *Compromisso Nacional Criança Alfabetizada*, instituído pelo Decreto nº 11.556, de 12 de junho de 2023;
* **Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (Inep):** *Matrizes de Referência da Alfabetização e Sistema de Avaliação da Educação Básica (Saeb Alfabetização)*;
* **Base Nacional Comum Curricular (BNCC):** Habilidades de decodificação e fluência de leitura no ciclo de alfabetização (códigos EF12LP01, EF01LP16, EF12LP02).

### 23.2 Métricas Internas e Critérios do FluencIA
* **Janela Temporal:** 10,0 segundos por item, com registro de `speechStartMs` e `speechEndMs`;
* **Tolerância Fonética Infantil:** Reconhecimento de diminutivos carinhosos e homófonos canônicos;
* **Distinção Técnica:** Isolamento explícito de ruído ambiente (`NAO_RECONHECIDO`) frente a desvios de leitura (`INCORRETO`).

---

---

## 24. Protocolo Oficial do Motor Adaptativo de Fluência Leitora

O sistema opera sob um **motor adaptativo rigoroso e progressivo**, calibrado para crianças do 1º e 2º ano do Ensino Fundamental, com duração total máxima de **4 minutos (240 segundos)**.

### 24.1 Os 6 Níveis Pedagógicos de Leitura

1. **PRÉ-LEITOR 1:** A criança identificou menos de 10 letras corretamente durante a etapa inicial de reconhecimento de letras. Indica fase inicial da apropriação do sistema de escrita alfabética. A progressão para palavras é interrompida.
2. **PRÉ-LEITOR 2:** A criança identificou 10 ou mais letras corretamente, porém não conseguiu decodificar palavras isoladas de forma autônoma na etapa 2 (0 acertos). Indica transição alfabética: domínio das letras sem consolidação da síntese fonêmica em palavras completas.
3. **PRÉ-LEITOR 3:** A criança conseguiu ler corretamente de 1 a 10 palavras isoladas. Demonstra decodificação emergente inicial, com silabação e tempo de reação prolongado. Não avança para a etapa textual.
4. **LEITOR INICIANTE 1:** A criança leu corretamente de 11 a 20 palavras isoladas por minuto (ou em 60s). Apresenta decodificação funcional consolidada para termos simples, com hesitações moderadas.
5. **LEITOR INICIANTE 2:** A criança atingiu taxa de 21 ou mais palavras por minuto em lista isolada, mas na leitura de texto em contexto **não atingiu simultaneamente os critérios cumulativos para ser considerada leitora fluente**.
6. **LEITOR FLUENTE:** Atinge simultaneamente na leitura textual:
   * Pelo menos **65 palavras corretas por minuto (PCPM)**;
   * Mais de **90% de precisão no texto**;
   * Automaticidade consolidada e leitura predominantemente contínua;
   * Baixa frequência de silabação e pausas funcionais;
   * Respeito adequado à pontuação e expressividade prosódica;
   * Confirmação na leitura de frases curtas com adequada melodia e ritmo.

### 24.2 Sequência Adaptativa Obrigatória

$$\text{LETRAS (10s)} \xrightarrow{\ge 10 \text{ acertos}} \text{PALAVRAS ISOLADAS (10s)} \xrightarrow{\ge 21 \text{ PCPM}} \text{TEXTO EM CONTEXTO (até 60s)} \xrightarrow[\text{critérios cumulativos}]{\text{LEITOR FLUENTE}} \text{FRASES (15s)}$$

* **Frases Curtas:** Somente são apresentadas para estudantes confirmados como **Leitor Fluente**. Nunca são apresentadas para Pré-leitores ou Leitores Iniciantes.
* **Critério de Parada:** Crianças com desempenho insuficiente não sofrem sobrecarga cognitiva desnecessária; a avaliação é encerrada no nível em que a evidência de domínio for consistente.

### 24.3 Limites de Tempo Rígidos

* **Tempo Global:** Máximo absoluto de **4 minutos = 240 segundos**. Atingidos os 240s, a avaliação é interrompida imediatamente, os dados parciais coletados são compilados e o relatório é gerado com base nas evidências acumuladas.
* **Letras:** Limite de 10 segundos por letra.
* **Palavras:** Limite de 10 segundos por palavra.
* **Frases:** Limite de 15 segundos por frase.
* **Texto:** Janela de leitura de até 60 segundos.

### 24.4 Resumo Executivo e Evidências para o Supervisor

O relatório final é estruturado para apoiar a prática pedagógica do educador sem exigir cálculos estatísticos complexos:
* **Resumo Executivo (7 Perguntas):** Nível atual, o que a criança consegue fazer, principais dificuldades, dados que sustentam a classificação, qualidade da leitura, habilidades que demandam atenção e aspectos práticos para trabalhar em sala.
* **Evidências da Classificação:** Parágrafos técnicos explicativos com números empíricos auditáveis (acertos, precisão, PCPM, silabações e tempos de reação).
* **Rastreabilidade Item a Item:** Apresentação transparente no formato: `Palavra esperada → resposta da criança → tipo de erro`, incluindo detecção de baixa confiança no áudio quando o microfone registrar ruído.

---

## 25. Perguntas Frequentes (FAQ)

**P: A criança falou uma palavra correta mas em tom muito baixo e o sistema não captou. O que fazer?**  
*R:* O professor pode usar o atalho de pular ou repetir a avaliação do nível após orientar a criança a falar mais perto do microfone.

**P: Posso avaliar mais de uma turma no mesmo aparelho?**  
*R:* Sim. No seletor de estudante, basta trocar a turma ativa. Os dados locais ficam sincronizados e organizados por escola e turma.

**P: Por que o teste encerrou antes dos 4 minutos?**  
*R:* O teste é adaptativo. Se a criança demonstrou evidência consolidada em determinada etapa (por exemplo, menos de 10 letras reconhecidas ou de 1 a 10 palavras), o sistema encerra a avaliação para evitar desgaste da criança e define o diagnóstico com as evidências obtidas.

**P: A plataforma emite diagnóstico clínico de dislexia ou TDAH?**  
*R:* **Não.** O FluencIA é estritamente pedagógico e formativo. É proibida qualquer tentativa de utilizar relatórios automatizados como laudos médicos ou diagnósticos clínicos.
