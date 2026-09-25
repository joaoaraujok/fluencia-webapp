import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import { env } from '../config/env.js';
import { Role, QuestionLevel, ItemType, Shift } from '@prisma/client';

async function seed() {
  console.log('🌱 Iniciando seed da base de dados institucional do FluencIA...');

  // 1. Criar SUPERADMIN inicial seguro a partir das variáveis de ambiente (sem senha hardcoded!)
  const superAdminEmail = env.SUPERADMIN_EMAIL.toLowerCase();
  let superAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!superAdmin) {
    const passwordHash = await bcrypt.hash(env.SUPERADMIN_PASSWORD, 10);
    superAdmin = await prisma.user.create({
      data: {
        name: env.SUPERADMIN_NAME,
        email: superAdminEmail,
        passwordHash,
        role: Role.SUPERADMIN,
        active: true
      }
    });
    console.log(`✅ SUPERADMIN criado: ${superAdmin.email}`);
  } else {
    console.log(`ℹ️ SUPERADMIN já existe: ${superAdmin.email}`);
  }

  // 2. Criar ADMIN e SUPERVISOR de demonstração pedagógica
  const adminEmail = 'admin@fluencia.edu.br';
  let demoAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!demoAdmin) {
    const passwordHash = await bcrypt.hash('Fluencia@2026Admin', 10);
    demoAdmin = await prisma.user.create({
      data: {
        name: 'Coordenação Pedagógica',
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        active: true
      }
    });
    console.log(`✅ ADMIN criado: ${demoAdmin.email}`);
  }

  const supervisorEmail = 'supervisor@fluencia.edu.br';
  let demoSupervisor = await prisma.user.findUnique({ where: { email: supervisorEmail } });
  if (!demoSupervisor) {
    const passwordHash = await bcrypt.hash('Fluencia@2026Supervisor', 10);
    demoSupervisor = await prisma.user.create({
      data: {
        name: 'Professor Avaliador',
        email: supervisorEmail,
        passwordHash,
        role: Role.SUPERVISOR,
        active: true
      }
    });
    console.log(`✅ SUPERVISOR criado: ${demoSupervisor.email}`);
  }

  // 3. Criar Critérios Versionados Iniciais ("2026.1")
  const criteriaVersion = env.EVALUATION_CRITERIA_VERSION;
  let criteria = await prisma.evaluationCriteria.findUnique({
    where: { version: criteriaVersion }
  });

  if (!criteria) {
    criteria = await prisma.evaluationCriteria.create({
      data: {
        version: criteriaVersion,
        wordDurationSec: env.EVALUATION_DEFAULT_WORD_DURATION_SEC, // 10 segundos
        toleranceSetting: 'standard',
        active: true,
        createdByUserId: superAdmin.id,
        rulesJson: {
          officialMecReference: 'Compromisso Nacional Criança Alfabetizada (Decreto nº 11.556/2023) / SAEB Alfabetização',
          maxTimePerItemSec: 10,
          silentModeDuringSpeech: true,
          levels: {
            preLeitor: 'Aquisição de leitura, decodificação, precisão e comportamento de resposta',
            leitor: 'Leitor fluente: precisão, velocidade, tempo de resposta, regularidade e prosódia'
          },
          evaluationFlow: {
            mode: 'sequential',
            maxItemsPerEvaluation: 30,
            itemDistribution: {
              simpleWords: 10,
              mediumWords: 10,
              complexWords: 6,
              phrases: 4
            },
            timing: {
              simpleWordSeconds: 5,
              mediumWordSeconds: 6,
              complexWordSeconds: 8,
              phraseSeconds: 15
            },
            silentModeDuringSpeech: true
          },
          statusClassification: [
            'CORRETO',
            'POSSIVELMENTE_CORRETO',
            'INCORRETO',
            'SEM_RESPOSTA',
            'NAO_RECONHECIDO',
            'ERRO_TECNICO'
          ]
        }
      }
    });
    console.log(`✅ Critérios Pedagógicos Versionados [${criteria.version}] configurados.`);
  }

  // 4. Criar Escola e Turma Modelo
  let school = await prisma.school.findFirst({
    where: { name: 'Escola Modelo de Ensino Fundamental' }
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Escola Modelo de Ensino Fundamental',
        code: 'EMEF-001-MEC',
        city: 'São Paulo',
        state: 'SP',
        active: true
      }
    });
    console.log(`✅ Escola criada: ${school.name}`);
  }

  let schoolClass = await prisma.schoolClass.findFirst({
    where: { schoolId: school.id, name: '1º Ano A - Alfabetização' }
  });

  if (!schoolClass) {
    schoolClass = await prisma.schoolClass.create({
      data: {
        schoolId: school.id,
        name: '1º Ano A - Alfabetização',
        gradeYear: '1º Ano',
        schoolYear: 2026,
        shift: Shift.MANHA,
        active: true
      }
    });
    console.log(`✅ Turma criada: ${schoolClass.name}`);
  }

  // 5. Criar Estudantes Modelo para Demonstração Inicial (com minimização de dados LGPD)
  const existingStudents = await prisma.student.count({ where: { classId: schoolClass.id } });
  if (existingStudents === 0) {
    await prisma.student.createMany({
      data: [
        {
          schoolId: school.id,
          classId: schoolClass.id,
          name: 'Ana Beatriz Souza',
          birthDate: new Date('2019-04-12'),
          registrationNumber: 'MAT-2026-001',
          notes: 'Participativa e atenta durante as atividades orais.'
        },
        {
          schoolId: school.id,
          classId: schoolClass.id,
          name: 'Lucas Gabriel Martins',
          birthDate: new Date('2019-08-23'),
          registrationNumber: 'MAT-2026-002',
          notes: 'Em fase de transição para leitura de trissílabas.'
        },
        {
          schoolId: school.id,
          classId: schoolClass.id,
          name: 'Sofia Helena Lima',
          birthDate: new Date('2019-02-15'),
          registrationNumber: 'MAT-2026-003',
          notes: 'Apresenta boa decodificação de dissílabas simples.'
        }
      ]
    });
    console.log(`✅ Estudantes criados para a turma.`);
  }

  // 6. Carga do Banco de Questões (3 Níveis de Dificuldade de Palavras + Frases Curtas)
  const existingQuestions = await prisma.question.count();
  if (existingQuestions === 0) {
    const questionsData = [
      // ==========================================
      // DIFICULDADE 1: PALAVRAS SIMPLES (5s)
      // ==========================================
      { text: 'BOLA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos', difficulty: 1 },
      { text: 'PATO', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais', difficulty: 1 },
      { text: 'BOCA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'corpo', difficulty: 1 },
      { text: 'MALA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'objetos', difficulty: 1 },
      { text: 'DADO', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos', difficulty: 1 },
      { text: 'SAPO', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais', difficulty: 1 },
      { text: 'VACA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais', difficulty: 1 },
      { text: 'LUA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'natureza', difficulty: 1 },
      { text: 'PIPA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'brinquedos', difficulty: 1 },
      { text: 'GATO', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'animais', difficulty: 1 },
      { text: 'BOLO', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'alimentos', difficulty: 1 },
      { text: 'CASA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'canonical_cv_cv', category: 'cotidiano', difficulty: 1 },
      { text: 'PIPOCA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'alimentos', difficulty: 1 },
      { text: 'BONECA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'brinquedos', difficulty: 1 },
      { text: 'PANELA', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'objetos', difficulty: 1 },
      { text: 'MACACO', level: QuestionLevel.PRE_LEITOR, type: ItemType.WORD, syllablesCount: 3, syllableStructure: 'canonical_cv_cv_cv', category: 'animais', difficulty: 1 },

      // ==========================================
      // DIFICULDADE 2: PALAVRAS MÉDIAS (Dígrafos e Encontros) (6s)
      // ==========================================
      { text: 'CHUVA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'digraph_ch', category: 'natureza', difficulty: 2 },
      { text: 'CHAVE', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'digraph_ch', category: 'objetos', difficulty: 2 },
      { text: 'MILHO', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'digraph_lh', category: 'alimentos', difficulty: 2 },
      { text: 'FOLHA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'digraph_lh', category: 'natureza', difficulty: 2 },
      { text: 'NINHO', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'digraph_nh', category: 'natureza', difficulty: 2 },
      { text: 'LINHA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'digraph_nh', category: 'objetos', difficulty: 2 },
      { text: 'PRATO', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'cluster_r', category: 'objetos', difficulty: 2 },
      { text: 'COBRA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'cluster_r', category: 'animais', difficulty: 2 },
      { text: 'TRATOR', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'cluster_r', category: 'cotidiano', difficulty: 2 },
      { text: 'FLOR', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 1, syllableStructure: 'cluster_l', category: 'natureza', difficulty: 2 },
      { text: 'PLANTA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'cluster_l', category: 'natureza', difficulty: 2 },
      { text: 'BLUSA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'cluster_l', category: 'objetos', difficulty: 2 },
      { text: 'PORTA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'complex_cvc', category: 'cotidiano', difficulty: 2 },
      { text: 'BARCO', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 2, syllableStructure: 'complex_cvc', category: 'cotidiano', difficulty: 2 },

      // ==========================================
      // DIFICULDADE 3: PALAVRAS COMPLEXAS (Polissílabas) (8s)
      // ==========================================
      { text: 'BORBOLETA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'complex_cvc', category: 'natureza', difficulty: 3 },
      { text: 'CHOCOLATE', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'digraph_ch', category: 'alimentos', difficulty: 3 },
      { text: 'DINOSSAURO', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'complex_ccv', category: 'animais', difficulty: 3 },
      { text: 'TARTARUGA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'complex_cvc', category: 'animais', difficulty: 3 },
      { text: 'COMPUTADOR', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'complex_cvc', category: 'cotidiano', difficulty: 3 },
      { text: 'REFRIGERANTE', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 5, syllableStructure: 'cluster_r', category: 'alimentos', difficulty: 3 },
      { text: 'BICICLETA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'cluster_l', category: 'brinquedos', difficulty: 3 },
      { text: 'PROFESSORA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'cluster_r', category: 'cotidiano', difficulty: 3 },
      { text: 'TRAVESSURA', level: QuestionLevel.LEITOR, type: ItemType.WORD, syllablesCount: 4, syllableStructure: 'cluster_r', category: 'cotidiano', difficulty: 3 },

      // ==========================================
      // FRASES CURTAS CONTEXTUALIZADAS (15s)
      // ==========================================
      { text: 'O SAPO PULA.', level: QuestionLevel.LEITOR, type: ItemType.PHRASE, syllablesCount: 5, syllableStructure: 'phrase_short', category: 'animais', difficulty: 4 },
      { text: 'A BOLA CAIU.', level: QuestionLevel.LEITOR, type: ItemType.PHRASE, syllablesCount: 5, syllableStructure: 'phrase_short', category: 'brinquedos', difficulty: 4 },
      { text: 'O GATO BEBE LEITE.', level: QuestionLevel.LEITOR, type: ItemType.PHRASE, syllablesCount: 7, syllableStructure: 'phrase_short', category: 'animais', difficulty: 4 },
      { text: 'A MENINA COME PIPOCA.', level: QuestionLevel.LEITOR, type: ItemType.PHRASE, syllablesCount: 9, syllableStructure: 'phrase_short', category: 'cotidiano', difficulty: 4 },
      { text: 'O SOL BRILHA NO CÉU.', level: QuestionLevel.LEITOR, type: ItemType.PHRASE, syllablesCount: 7, syllableStructure: 'phrase_short', category: 'natureza', difficulty: 4 },
      { text: 'A MENINA LÊ UM LIVRO.', level: QuestionLevel.LEITOR, type: ItemType.PHRASE, syllablesCount: 7, syllableStructure: 'phrase_short', category: 'cotidiano', difficulty: 4 }
    ];

    await prisma.question.createMany({
      data: questionsData.map((q, idx) => ({
        text: q.text,
        level: q.level,
        type: q.type,
        syllablesCount: q.syllablesCount,
        syllableStructure: q.syllableStructure,
        category: q.category,
        difficulty: q.difficulty,
        order: idx + 1,
        active: true,
        version: 1
      }))
    });
    console.log(`✅ ${questionsData.length} questões pedagógicas inseridas no banco.`);
  }

  // 7. Configurações pedagógicas globais
  await prisma.pedagogicalSetting.upsert({
    where: { key: 'wordDurationSec' },
    create: { key: 'wordDurationSec', value: 10, description: 'Tempo padrão em segundos para cada palavra' },
    update: {}
  });

  await prisma.pedagogicalSetting.upsert({
    where: { key: 'silentModeDuringSpeech' },
    create: { key: 'silentModeDuringSpeech', value: true, description: 'Silêncio absoluto do sistema durante a janela de fala' },
    update: {}
  });

  await prisma.pedagogicalSetting.upsert({
    where: { key: 'evaluationCriteriaVersion' },
    create: { key: 'evaluationCriteriaVersion', value: '2026.1', description: 'Versão atual ativa dos critérios pedagógicos' },
    update: {}
  });

  console.log('🎉 Seed concluído com sucesso!');
}

seed()
  .catch((e) => {
    console.error('❌ Falha na execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
