import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 FluencIA Backend rodando na porta ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:${env.PORT}/api-docs`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor com segurança...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('🔌 Conexão com o banco de dados finalizada.');
      process.exit(0);
    } catch (err) {
      console.error('Erro ao desconectar do banco:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
