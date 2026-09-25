import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FluencIA - API de Avaliação da Fluência Oral Infantil',
    version: '1.0.0',
    description:
      'API REST institucional e segura para avaliação, acompanhamento da fluência de leitura oral infantil, controle pedagógico e gestão escolar (LGPD Compliant).'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Servidor Principal v1'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token JWT gerado na autenticação'
      }
    }
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Verificação de integridade do serviço (Healthcheck)',
        responses: { 200: { description: 'Serviço operacional' } }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Autenticação de usuário (Login)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'superadmin@fluencia.edu.br' },
                  password: { type: 'string', example: 'Fluencia@2026!SuperAdmin' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Login efetuado com sucesso retornando token JWT' },
          401: { description: 'Credenciais inválidas' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Obter perfil do usuário autenticado',
        responses: { 200: { description: 'Dados do usuário' } }
      }
    },
    '/schools': {
      get: {
        summary: 'Listar escolas cadastradas',
        responses: { 200: { description: 'Lista de escolas' } }
      },
      post: {
        summary: 'Cadastrar nova escola (ADMIN/SUPERADMIN)',
        responses: { 201: { description: 'Escola cadastrada' } }
      }
    },
    '/classes': {
      get: {
        summary: 'Listar turmas',
        responses: { 200: { description: 'Lista de turmas' } }
      },
      post: {
        summary: 'Cadastrar nova turma (ADMIN/SUPERADMIN)',
        responses: { 201: { description: 'Turma cadastrada' } }
      }
    },
    '/students': {
      get: {
        summary: 'Listar estudantes com filtros',
        responses: { 200: { description: 'Lista de estudantes' } }
      },
      post: {
        summary: 'Cadastrar estudante',
        responses: { 201: { description: 'Estudante cadastrado' } }
      }
    },
    '/questions': {
      get: {
        summary: 'Listar banco de questões',
        responses: { 200: { description: 'Lista de questões pedagógicas' } }
      },
      post: {
        summary: 'Cadastrar nova palavra ou frase (SUPERADMIN)',
        responses: { 201: { description: 'Questão cadastrada' } }
      }
    },
    '/evaluations': {
      get: {
        summary: 'Listar histórico de avaliações',
        responses: { 200: { description: 'Sessões de avaliações' } }
      },
      post: {
        summary: 'Submeter sessão de avaliação de 10 segundos com métricas (SUPERVISOR)',
        responses: { 201: { description: 'Avaliação computada e persistida de forma imutável' } }
      }
    },
    '/reports/students/{studentId}': {
      get: {
        summary: 'Gerar relatório pedagógico individual do estudante',
        parameters: [{ in: 'path', name: 'studentId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Relatório individual com indicadores e recomendações' } }
      }
    },
    '/reports/classes/{classId}': {
      get: {
        summary: 'Gerar relatório consolidado por turma',
        parameters: [{ in: 'path', name: 'classId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Relatório e estatísticas de turma' } }
      }
    },
    '/analytics/overview': {
      get: {
        summary: 'Visão geral e cards para Dashboard (ADMIN/SUPERADMIN)',
        responses: { 200: { description: 'Totais consolidados' } }
      }
    },
    '/audit': {
      get: {
        summary: 'Trilha de auditoria de alterações (SUPERADMIN)',
        responses: { 200: { description: 'Logs imutáveis de ações' } }
      }
    }
  }
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export const docsRouter = router;
