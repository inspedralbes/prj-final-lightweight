import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// El módulo Prisma se encarga de proporcionar una instancia de PrismaService a toda la aplicación.
// Al marcar el módulo como @Global(), se asegura de que PrismaService esté disponible en cualquier parte de la aplicación sin necesidad de importarlo explícitamente en cada módulo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
