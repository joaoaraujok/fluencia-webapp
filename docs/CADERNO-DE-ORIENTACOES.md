# Caderno de Orientações Pedagógicas e Técnicas — FluencIA
**Plataforma Institucional de Avaliação da Fluência Oral e Leitura na Alfabetização Infantil**

---

## 1. Apresentação
O **FluencIA** é uma plataforma educacional desenvolvida para apoiar redes de ensino, escolas, coordenadores e professores na avaliação diagnóstica e formativa da fluência oral e leitura de crianças nos anos iniciais do Ensino Fundamental e Educação Infantil. A solução alia tecnologia de ponta de reconhecimento de voz e inteligência artificial a princípios consolidados da psicolinguística e referenciais pedagógicos oficiais.

---

## 2. Objetivo
Promover um instrumento confiável, ágil e acolhedor para:
* Identificar o estágio de leitura da criança dentro dos **6 Níveis Oficiais de Fluência Leitora** (Pré-Leitor 1, 2 e 3; Leitor Iniciante 1 e 2; Leitor Fluente);
* Mensurar com precisão a taxa de acurácia fonológica, a velocidade leitora (PCPM) e a latência de resposta articulatória;
* Subsidiar intervenções pedagógicas direcionadas, focadas em estruturas silábicas e fonemas específicos;
* Acompanhar a evolução longitudinal dos estudantes e das turmas ao longo dos ciclos letivos.

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
* Parametrização pedagógica (tempos regulamentares, critérios versionados, tolerâncias fonéticas);
* Gestão do banco de itens e questões pedagógicas;
* Acesso à trilha completa e imutável de logs de auditoria (`AuditLogs`).

### 4.2 ADMIN (Gestão Escolar e Secretaria)
* Gestão do cadastro de unidades escolares, turmas e estudantes;
* Consulta e acompanhamento de relatórios consolidados por turma e por escola;
* Análise de indicadores de desempenho e exportação de dados analíticos (CSV/Impressão);
* Acompanhamento da cobertura avaliativa (avaliados vs. pendentes).

### 4.3 SUPERVISOR (Educador / Professor Avaliador)
* Aplicação das sessões de avaliação individual com os estudantes;
* Condução do protocolo de verificação acústica do ambiente escolar;
* Inserção de observações pedagógicas contextuais;
* Consulta aos relatórios diagnósticos dos seus estudantes e de suas turmas;
* Gerenciamento de estudantes sob sua responsabilidade pedagógica.

---

## 5. Primeiro Acesso e Manual Integrado In-App
1. Acesse o sistema através de navegador web compatível (Google Chrome, Microsoft Edge ou Safari);
2. **Manual de Uso In-App:** A qualquer momento, clique no botão **"Manual"** ou **"Consultar Guia"** no cabeçalho ou tela inicial para abrir o guia interativo com roteiros, atalhos de teclado e critérios;
3. Para acesso com perfil institucional, clique em **"Entrar"** no canto superior direito;
4. Insira suas credenciais fornecidas pela gestão escolar ou secretaria de educação;
5. Para o primeiro acesso do `SUPERADMIN`, utilize as credenciais configuradas com segurança no ambiente do servidor.

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
4. **Ventiladores e Ar Condicionado:** Não aponte correntes de ar diretamente para o microfone do celular ou computador;
5. **Estabilidade do Dispositivo:** Apoie o celular ou computador de maneira fixa sobre a mesa, evitando manuseios durante o teste;
6. **Distância Recomendada:** Posicione o microfone a uma distância aproximada de **20 a 30 centímetros** da boca da criança;
7. **Toques no Microfone:** Oriente a criança a não cobrir nem encostar os dedos na abertura do microfone.

---

## 10. Passo a Passo para Realizar a Avaliação Adaptativa

O FluencIA adota o modelo de **Avaliação Adaptativa Contínua e Progressiva**. A criança não é pré-classificada antes do teste: o próprio teste diagnóstico determina, com rigor pedagógico, o perfil real de fluência:

1. O educador clica em **"Selecionar Estudante"** e escolhe a turma e o aluno que será avaliado;
2. Na tela inicial, clica no botão principal **"Iniciar Avaliação Diagnóstica"**;
3. O sistema exibe automaticamente a **Tela de Verificação do Ambiente**:
   * O supervisor confere a barra de nível de entrada de áudio (VU meter);
   * Solicita que a criança fale uma palavra teste ("Oi" ou seu nome);
   * Marca o checklist de conformidade acústica e clica em **"Iniciar Avaliação com Estudante"**;
4. Inicia-se a contagem regressiva acolhedora (3... 2... 1...);
5. O teste transcorre na **Jornada Adaptativa de 4 Etapas Progressivas**:
   * **Etapa 1: Reconhecimento de Letras (10s por item):** Vogais e consoantes canônicas. Se acertar menos de 10 letras, encerra como **Pré-Leitor 1**; se $\ge 10$, avança para Palavras;
   * **Etapa 2: Palavras Isoladas (10s por item):** Palavras canônicas (CV-CV), médias e complexas. Se obtiver 0 acertos $\to$ **Pré-Leitor 2**; 1 a 10 acertos $\to$ **Pré-Leitor 3**; 11 a 20 PCPM $\to$ **Leitor Iniciante 1**; $\ge 21$ PCPM $\to$ candidata-se a Leitor Fluente e avança para o Texto;
   * **Etapa 3: Leitura de Texto em Contexto (janela de até 60s):** Pequena narrativa contextualizada. Para confirmação de **Leitor Fluente**, exige-se cumulativamente $\ge 65$ PCPM com precisão fonológica $> 90\%$. Não atingindo, encerra como **Leitor Iniciante 2**;
   * **Etapa 4: Prosódia em Frases (15s por frase):** Apresentada exclusivamente para avaliação de expressividade e cadência do Leitor Fluente.
6. **Controle Inteligente de Tempo e Resposta:**
   * Durante a fala da criança vigora o **modo silencioso**, sem avisos sonoros que interfiram na captação;
   * Caso a criança leia corretamente, o sistema avança suavemente em 250ms;
   * Caso a criança fale e conclua sua tentativa, um intervalo de silêncio de 1.2s avança o item sem forçar a criança a esperar segundos ociosos;
   * **Atalhos do Educador no Teclado:**
     * `Espaço` ou `Seta Direita`: Pular ou avançar item imediatamente;
     * `Tecla 1`: Forçar marcação do item como Correto (em caso de microfone muito baixo);
     * `Tecla 2`: Forçar marcação do item como Incorreto;
     * `ESC`: Interromper com segurança a sessão.
7. Ao concluir, o sistema gera o diagnóstico de fluência com cálculo de PCPM e abre o **Dashboard de Resultados**.

---

## 11. Como Interpretar os Resultados Pedagógicos

| Indicador | Descrição Pedagógica |
|---|---|
| **Diagnóstico Formativo** | Classificação em um dos 6 níveis oficiais: **Pré-Leitor 1, 2 ou 3**, **Leitor Iniciante 1 ou 2**, ou **Leitor Fluente**. |
| **PCPM (Palavras Corretas Por Minuto)** | Taxa oficial de velocidade da leitura oral calculada a partir do tempo ativo e número de palavras lidas corretamente. |
| **Acurácia Global (%)** | Percentual de precisão na decodificação (acertos plenos valem 1.0; aproximações fonéticas aceitas valem 0.5). |
| **Tempo Médio de Resposta (s)** | Intervalo médio decorrido entre a exibição do estímulo e a resposta emitida pela criança. |
| **CORRETO** | Resposta emitida em correspondência fonética ou literal com o item-alvo. |
| **POSSIVELMENTE_CORRETO** | Variação fonética típica da infância (ex: diminutivos carinhosos, leve simplificação de encontro consonantal). |
| **INCORRETO** | Palavra dita diverge com clareza da palavra apresentada. |
| **SEM_RESPOSTA** | Silêncio durante a janela disponível do item. |
| **NAO_RECONHECIDO** | Ruído ininteligível ou captura instável do microfone (não confundir com erro da criança!). |
| **ERRO_TECNICO** | Falha de hardware ou microfone desconectado. |

---

## 12. Os 6 Níveis Pedagógicos de Leitura e Encaminhamentos

1. **PRÉ-LEITOR 1:** A criança identificou menos de 10 letras corretamente na etapa inicial. Indica fase inicial da apropriação do sistema de escrita alfabética.
   * *Encaminhamento:* Atividades lúdicas de consciência fonológica, rimas, aliterações e exploração do alfabeto.
2. **PRÉ-LEITOR 2:** A criança identificou 10 ou mais letras, mas obteve 0 acertos na decodificação de palavras isoladas. Indica transição: domínio gráfico das letras sem consolidação da síntese fonêmica.
   * *Encaminhamento:* Exercícios de síntese de sílabas canônicas (CV) e associação som-letra em palavras simples.
3. **PRÉ-LEITOR 3:** A criança conseguiu decodificar corretamente de 1 a 10 palavras isoladas. Demonstra decodificação emergente, ainda com forte silabação e tempo de reação prolongado.
   * *Encaminhamento:* Leitura de palavras familiares com apoio imagético e ampliação de vocabulário de uso frequente.
4. **LEITOR INICIANTE 1:** A criança atingiu taxa de 11 a 20 PCPM em palavras isoladas. Possui decodificação funcional consolidada para termos simples, com hesitações moderadas.
   * *Encaminhamento:* Prática com encontros consonantais, dígrafos e pequenas frases para ganho de ritmo.
5. **LEITOR INICIANTE 2:** A criança atingiu $\ge 21$ PCPM em palavras, mas na leitura de texto em contexto não atingiu simultaneamente os critérios para leitura fluente (&lt; 65 PCPM ou &lt; 90% de precisão).
   * *Encaminhamento:* Leitura repetida e compartilhada de narrativas curtas para automatizar o fluxo textual.
6. **LEITOR FLUENTE:** Atinge cumulativamente no texto narrativo:
   * Pelo menos **65 palavras corretas por minuto (PCPM)**;
   * Mais de **90% de precisão no texto**;
   * Automaticidade consolidada e leitura predominantemente contínua;
   * Respeito à pontuação e entonação melódica adequada confirmada na leitura de frases.
   * *Encaminhamento:* Leitura autônoma de livros infantis, inferências e interpretação leitora profunda.

---

## 13. Limite Global de Tempo e Proteção da Criança
* **Teto Absoluto de 4 Minutos (240 segundos):** Toda sessão possui limite de 240s. Atingido o limite, o teste é encerrado imediatamente e o relatório é gerado com base nas evidências acumuladas, impedindo cansaço ou constrangimento para a criança.

---

## 14. Relatório Individual do Estudante
Apresenta:
1. Cabeçalho de identificação com dados escolares e data de aplicação;
2. Indicador geral de precisão e velocidade média (PCPM);
3. Diagnóstico por habilidade silábica (canônicas, dígrafos, encontros);
4. **Resumo Executivo das 7 Perguntas Pedagógicas:**
   * 1. Nível atual de leitura da criança;
   * 2. O que a criança consegue fazer com autonomia;
   * 3. Principais dificuldades observadas;
   * 4. Dados empíricos que sustentam a classificação;
   * 5. Qualidade do ritmo e prosódia da leitura;
   * 6. Habilidades que demandam atenção imediata;
   * 7. Recomendações práticas e afirmativas para a sala de aula.
5. Seção **"O que praticar"**: Orientações pedagógicas afirmativas e acolhedoras.

---

## 15. Relatório por Turma
Permite à coordenação pedagógica:
* Identificar quantos estudantes já foram avaliados e quantos restam na turma;
* Analisar a curva de desempenho médio da sala e distribuição pelos 6 níveis;
* Mapear estruturas silábicas que representam desafio coletivo para guiar o planejamento das próximas aulas;
* Exportar dados analíticos em formato tabular (CSV).

---

## 16. Acompanhamento da Evolução Longitudinal
As avaliações ficam registradas cronologicamente. Ao realizar novas edições ao longo dos bimestres, o sistema plota gráficos comparativos da evolução da acurácia e da agilidade temporal do mesmo estudante.

---

## 17. Resolução de Problemas com Microfone
* **Aviso de permissão negada:** Clique no ícone de cadeado na barra de endereços do navegador e marque o Microfone como "Permitir".
* **Conexão não segura (HTTP):** Em celulares Android e iOS, o microfone é rigorosamente bloqueado em conexões HTTP normais. Utilize sempre endereço seguro HTTPS ou localhost.
* **Volume Baixo:** Aproxime o dispositivo para 20-30 cm da criança e use o VU meter da tela de calibração.

---

## 18. Funcionamento Offline e PWA
O FluencIA opera sob o paradigma **Offline-First**:
* Todas as telas, itens pedagógicos e lógicas avaliativas funcionam sem conexão à internet;
* Durante a aplicação em salas sem sinal Wi-Fi, os dados são salvos com integridade no banco local do dispositivo (`IndexedDB/Dexie`);
* Cada avaliação recebe um identificador universal único (UUIDv4) para prevenir duplicações.

---

## 19. Sincronização de Dados
1. Ao restabelecer a conexão com a internet, o sistema detecta o evento de conectividade;
2. O botão âmbar no cabeçalho exibe a quantidade de avaliações pendentes;
3. O supervisor pode clicar no botão **"Sincronizar"** para transmitir com segurança os registros para o banco PostgreSQL central em lote idempotente.

---

## 20. Política de Privacidade de Áudio
* **Não Armazenamento de Voz Infantil:** Em respeito absoluto à infância e ao Marco Legal da Primeira Infância, **o áudio da criança não é gravado nem mantido permanentemente em nenhum servidor**;
* O fluxo de áudio é analisado de forma volátil e transitória em memória para extração estrita das métricas fonéticas (texto, confiança, timestamps de início e fim da fala);
* Logo após a extração, o buffer de áudio é imediatamente descartado.

---

## 21. Boas Práticas Pedagógicas
* **Clima Lúdico e Acolhedor:** Trate a avaliação como uma atividade de leitura interativa com o computador/celular;
* **Sem Punições:** O sistema não emite sons estridentes de erro nem apresenta mensagens punitivas ("Você errou");
* **Respeito ao Tempo:** Deixe a criança tentar pronunciar no seu próprio ritmo dentro da janela regulamentar de 10 segundos.

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
* **Janela Temporal:** 10,0 segundos por item (letras e palavras), com registro de `speechStartMs` e `speechEndMs`;
* **Tolerância Fonética Infantil:** Reconhecimento de diminutivos carinhosos e homófonos canônicos;
* **Distinção Técnica:** Isolamento explícito de ruído ambiente (`NAO_RECONHECIDO`) frente a desvios de leitura (`INCORRETO`).

---

## 24. Perguntas Frequentes (FAQ)

**P: A criança falou uma palavra correta mas em tom muito baixo e o sistema não captou. O que fazer?**  
*R:* O professor pode usar o atalho de teclado `1` para forçar acerto imediato, ou a tecla `Espaço` para pular e repetir a avaliação do nível após orientar a criança a falar mais perto do microfone.

**P: Posso avaliar mais de uma turma no mesmo aparelho?**  
*R:* Sim. No seletor de estudante, basta trocar a turma ativa. Os dados locais ficam organizados por escola e turma e são sincronizados com o servidor central.

**P: Por que o teste encerrou antes dos 4 minutos?**  
*R:* O teste é adaptativo. Se a criança demonstrou evidência consolidada em determinada etapa (por exemplo, menos de 10 letras reconhecidas ou de 1 a 10 palavras), o sistema encerra a avaliação para evitar desgaste da criança e define o diagnóstico com as evidências obtidas.

**P: A plataforma emite diagnóstico clínico de dislexia ou TDAH?**  
*R:* **Não.** O FluencIA é estritamente pedagógico e formativo. É proibida qualquer tentativa de utilizar relatórios automatizados como laudos médicos ou diagnósticos clínicos.
